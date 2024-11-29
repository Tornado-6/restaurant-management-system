from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters import rest_framework as filters
from datetime import datetime, timedelta
from .models import Table, Reservation
from .serializers import TableSerializer, ReservationSerializer

class TableFilter(filters.FilterSet):
    min_capacity = filters.NumberFilter(field_name="capacity", lookup_expr='gte')
    max_capacity = filters.NumberFilter(field_name="capacity", lookup_expr='lte')
    
    class Meta:
        model = Table
        fields = ['status']

class TableViewSet(viewsets.ModelViewSet):
    queryset = Table.objects.all()
    serializer_class = TableSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_class = TableFilter
    http_method_names = ['get', 'post', 'put', 'patch', 'delete']

    @action(detail=False, methods=['get'])
    def available(self, request):
        tables = Table.objects.filter(status='available')
        serializer = self.get_serializer(tables, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def change_status(self, request, pk=None):
        table = self.get_object()
        new_status = request.data.get('status')
        
        if new_status not in dict(Table.STATUS_CHOICES):
            return Response(
                {'error': 'Invalid status'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        table.status = new_status
        table.save()
        serializer = self.get_serializer(table)
        return Response(serializer.data)

class ReservationFilter(filters.FilterSet):
    date = filters.DateFilter(field_name='reservation_date')
    start_time = filters.TimeFilter(field_name='reservation_time', lookup_expr='gte')
    end_time = filters.TimeFilter(field_name='reservation_time', lookup_expr='lte')
    
    class Meta:
        model = Reservation
        fields = ['status', 'table']

class ReservationViewSet(viewsets.ModelViewSet):
    queryset = Reservation.objects.all()
    serializer_class = ReservationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_class = ReservationFilter

    def get_queryset(self):
        queryset = Reservation.objects.all()
        # Filter out old reservations
        if self.action == 'list':
            today = datetime.now().date()
            queryset = queryset.filter(reservation_date__gte=today)
        return queryset

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        reservation = self.get_object()
        if reservation.status != 'pending':
            return Response(
                {'error': 'Can only confirm pending reservations'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        reservation.status = 'confirmed'
        reservation.save()
        
        # Update table status for the reservation time
        if reservation.reservation_date == datetime.now().date():
            reservation.table.status = 'reserved'
            reservation.table.save()
            
        serializer = self.get_serializer(reservation)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        reservation = self.get_object()
        if reservation.status == 'completed':
            return Response(
                {'error': 'Cannot cancel completed reservations'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        reservation.status = 'cancelled'
        reservation.save()
        
        # Update table status if it was reserved for this reservation
        if (reservation.table.status == 'reserved' and 
            reservation.reservation_date == datetime.now().date()):
            reservation.table.status = 'available'
            reservation.table.save()
            
        serializer = self.get_serializer(reservation)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def today(self, request):
        today = datetime.now().date()
        reservations = Reservation.objects.filter(
            reservation_date=today,
            status='confirmed'
        )
        serializer = self.get_serializer(reservations, many=True)
        return Response(serializer.data)
