from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django_filters import rest_framework as filters
from django.utils import timezone
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Order, OrderItem, Payment
from .serializers import OrderSerializer, PaymentSerializer
from tables.models import Table
from django.db import models
import traceback
import logging

logger = logging.getLogger(__name__)

class OrderPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

class OrderFilter(filters.FilterSet):
    start_date = filters.DateFilter(field_name='created_at', lookup_expr='gte')
    end_date = filters.DateFilter(field_name='created_at', lookup_expr='lte')
    status = filters.MultipleChoiceFilter(choices=Order.STATUS_CHOICES)
    priority = filters.MultipleChoiceFilter(choices=Order.PRIORITY_CHOICES)
    
    class Meta:
        model = Order
        fields = ['status', 'priority', 'is_paid', 'waiter', 'table']

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all().order_by('-created_at')
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_class = OrderFilter
    pagination_class = OrderPagination

    def get_queryset(self):
        queryset = Order.objects.all().prefetch_related('items', 'items__menu_item').order_by('-created_at')
        
        if self.request.user.role == 'waiter':
            return queryset.filter(waiter=self.request.user)
        elif self.request.user.role == 'chef':
            return queryset.exclude(status__in=['served', 'cancelled'])
        
        return queryset

    def list(self, request, *args, **kwargs):
        # Support both GET and POST methods for filtering
        if request.method == 'POST':
            # If it's a POST request, use the data for filtering
            filter_params = request.data
        else:
            # For GET request, use query parameters
            filter_params = request.query_params

        # Create a mutable copy of the filter parameters
        filter_params = filter_params.copy()

        # Apply custom filtering
        queryset = self.get_queryset()

        # Apply status filter
        if filter_params.get('status'):
            queryset = queryset.filter(status=filter_params.get('status'))

        # Apply date filter
        if filter_params.get('start_date'):
            queryset = queryset.filter(created_at__gte=filter_params.get('start_date'))

        # Apply additional filters as needed
        
        # Paginate the queryset
        page = self.paginate_queryset(queryset)
        
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'count': queryset.count(),
            'results': serializer.data
        })

    # Allow POST method for list
    def create(self, request, *args, **kwargs):
        # If the request is for filtering, handle it in list method
        if 'status' in request.data or 'start_date' in request.data:
            return self.list(request, *args, **kwargs)
        
        # Otherwise, proceed with normal create
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        # Set waiter as current user if not specified
        if not self.request.data.get('waiter'):
            serializer.save(waiter=self.request.user)
        
        # Notify about new order via WebSocket
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            "orders",
            {
                "type": "order.create",
                "order": OrderSerializer(serializer.instance).data
            }
        )
        return serializer.instance

    def get_serializer_context(self):
        context = super().get_serializer_context()
        if self.request.method in ['POST', 'PUT', 'PATCH']:
            context['items'] = self.request.data.get('items', [])
        return context

    @action(detail=True, methods=['post'], url_path='status')
    def update_order_status(self, request, pk=None):
        try:
            order = self.get_object()
            new_status = request.data.get('status')
            
            if not new_status:
                return Response({'error': 'Status is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            order.status = new_status
            order.save()
            
            serializer = self.get_serializer(order)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error updating order status: {str(e)}")
            logger.error(traceback.format_exc())
            return Response({'error': 'Failed to update order status'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'], url_path='bulk-update')
    def bulk_update_orders(self, request):
        try:
            order_ids = request.data.get('order_ids', [])
            new_status = request.data.get('status')
            
            if not order_ids or not new_status:
                return Response({'error': 'Order IDs and status are required'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Bulk update orders
            updated_count = Order.objects.filter(id__in=order_ids).update(status=new_status)
            
            return Response({
                'updated_count': updated_count,
                'message': f'Successfully updated {updated_count} orders to {new_status} status'
            })
        except Exception as e:
            logger.error(f"Error in bulk order update: {str(e)}")
            logger.error(traceback.format_exc())
            return Response({'error': 'Failed to bulk update orders'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'], url_path='status')
    def update_status(self, request, pk=None):
        import traceback
        
        # Log the incoming request details
        print("=" * 50)
        print(f"Update Status Request - Order ID: {pk}")
        print(f"Request Data: {request.data}")
        print(f"Current User: {request.user}")
        print(f"User ID: {request.user.id}")
        print(f"User Role: {request.user.role}")
        print("=" * 50)
        
        try:
            order = self.get_object()
            print(f"Order Found: {order}")
        except Exception as e:
            print(f"Error retrieving order: {e}")
            traceback.print_exc()
            return Response(
                {'error': 'Order not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        new_status = request.data.get('status')
        
        # Validate status
        if not new_status:
            print("No status provided in the request")
            return Response(
                {'error': 'Status is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if new_status not in dict(Order.STATUS_CHOICES):
            print(f"Invalid status: {new_status}")
            return Response(
                {'error': 'Invalid status'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Prepare update data
        update_data = {'status': new_status}
        
        # Set chef for preparing orders
        if new_status == 'preparing':
            update_data['chef'] = request.user.id
            update_data['started_preparing_at'] = timezone.now()
        
        # Add current timestamp for completed or cancelled orders
        if new_status in ['served', 'cancelled']:
            update_data['completed_at'] = timezone.now()
        
        try:
            # Validate and save the order
            print(f"Update Data: {update_data}")
            serializer = self.get_serializer(order, data=update_data, partial=True)
            
            # Detailed serializer validation
            try:
                serializer.is_valid(raise_exception=True)
            except serializers.ValidationError as e:
                print("Serializer Validation Errors:")
                print(e.detail)
                return Response(
                    {'error': 'Validation failed', 'details': e.detail}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            updated_order = serializer.save()
            print(f"Order Updated: {updated_order}")
            
            # If preparing, calculate estimated preparation time
            if new_status == 'preparing':
                # Estimate preparation time based on items
                total_items = updated_order.items.count()
                estimated_time = max(5, total_items * 5)  # Minimum 5 mins, 5 mins per item
                updated_order.estimated_preparation_time = estimated_time
                updated_order.save(update_fields=['estimated_preparation_time'])
            
            # Notify about order status change via WebSocket
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                "orders",
                {
                    "type": "order.update",
                    "order": OrderSerializer(updated_order).data
                }
            )
            
            print(f"Order {pk} status updated to {new_status}")
            return Response(OrderSerializer(updated_order).data)
        
        except Exception as e:
            print(f"Error updating order status: {e}")
            traceback.print_exc()
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def bulk_update(self, request):
        order_ids = request.data.get('order_ids', [])
        new_status = request.data.get('status')
        
        if not order_ids:
            return Response(
                {'error': 'No orders specified'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if new_status not in dict(Order.STATUS_CHOICES):
            return Response(
                {'error': 'Invalid status'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Prepare data for bulk update
        update_data = {
            'status': new_status,
            'chef': request.user.id if new_status == 'preparing' else None
        }
        
        orders = Order.objects.filter(id__in=order_ids)
        updated_count = 0
        
        # Send WebSocket updates for each updated order
        channel_layer = get_channel_layer()
        for order in orders:
            serializer = self.get_serializer(order, data=update_data, partial=True)
            if serializer.is_valid():
                serializer.save()
                updated_count += 1
                
                async_to_sync(channel_layer.group_send)(
                    "orders",
                    {
                        "type": "order.update",
                        "order": serializer.data
                    }
                )
        
        return Response({
            'message': f'Successfully updated {updated_count} orders',
            'updated_count': updated_count
        })

    @action(detail=False, methods=['get'])
    def kitchen_summary(self, request):
        """
        Provide summary statistics for kitchen staff
        """
        summary = {
            'total_pending': Order.objects.filter(status='pending').count(),
            'total_preparing': Order.objects.filter(status='preparing').count(),
            'avg_preparation_time': Order.objects.filter(
                status='served', 
                actual_preparation_time__isnull=False
            ).aggregate(models.Avg('actual_preparation_time'))['actual_preparation_time__avg'] or 0,
            'orders_by_priority': Order.objects.filter(
                status__in=['pending', 'preparing']
            ).values('priority').annotate(count=models.Count('id'))
        }
        
        return Response(summary)

    @action(detail=True, methods=['post'])
    def process_payment(self, request, pk=None):
        order = self.get_object()
        
        if order.is_paid:
            return Response(
                {'error': 'Order is already paid'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        payment_data = {
            'order': order.id,
            'amount': order.total_amount,
            'payment_method': request.data.get('payment_method'),
            'transaction_id': request.data.get('transaction_id', '')
        }
        
        payment_serializer = PaymentSerializer(data=payment_data)
        if payment_serializer.is_valid():
            payment_serializer.save()
            order.is_paid = True
            order.save()
            
            # Free up the table if order is completed and paid
            if order.status == 'served':
                table = order.table
                if table:
                    table.status = 'available'
                    table.save()
            
            return Response(payment_serializer.data)
        return Response(payment_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def perform_update(self, serializer):
        instance = serializer.save()
        # Send WebSocket update
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            "orders",
            {
                "type": "order.update",
                "order": OrderSerializer(instance).data
            }
        )
