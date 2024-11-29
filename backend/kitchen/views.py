from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters import rest_framework as filters
from django.db.models import Q, Sum, Avg, Min, Max, Count
from django.utils import timezone

from .models import MenuItem, Ingredient, MenuItemIngredient, InventoryTransaction
from .serializers import (
    MenuItemSerializer, 
    IngredientSerializer, 
    InventoryTransactionSerializer
)

class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        # Allow read-only access to everyone
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Allow write access to staff, admins, and managers
        return (
            request.user and 
            request.user.is_authenticated and 
            (request.user.is_staff or 
             request.user.role in ['admin', 'manager'])
        )

class MenuItemFilter(filters.FilterSet):
    min_price = filters.NumberFilter(field_name="price", lookup_expr='gte')
    max_price = filters.NumberFilter(field_name="price", lookup_expr='lte')
    category = filters.CharFilter(lookup_expr='iexact')
    
    class Meta:
        model = MenuItem
        fields = ['category', 'is_available']

class IngredientFilter(filters.FilterSet):
    name = filters.CharFilter(lookup_expr='icontains')
    category = filters.MultipleChoiceFilter(choices=Ingredient.CATEGORY_CHOICES)
    is_low_stock = filters.BooleanFilter(method='filter_low_stock')
    
    class Meta:
        model = Ingredient
        fields = ['name', 'category', 'is_low_stock', 'unit']
    
    def filter_low_stock(self, queryset, name, value):
        if value:
            return queryset.filter(quantity__lte=models.F('reorder_level'))
        return queryset

class MenuItemViewSet(viewsets.ModelViewSet):
    queryset = MenuItem.objects.all()
    serializer_class = MenuItemSerializer
    permission_classes = [IsAdminOrReadOnly]
    filterset_class = MenuItemFilter
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    @action(detail=True, methods=['post'])
    def toggle_availability(self, request, pk=None):
        menu_item = self.get_object()
        menu_item.is_available = not menu_item.is_available
        menu_item.save()
        return Response({'status': 'success', 'is_available': menu_item.is_available})

    def get_queryset(self):
        queryset = MenuItem.objects.all()
        search_query = self.request.query_params.get('search', None)
        category = self.request.query_params.get('category', None)
        
        if search_query:
            queryset = queryset.filter(
                Q(name__icontains=search_query) | 
                Q(description__icontains=search_query) | 
                Q(category__icontains=search_query)
            )
        
        if category:
            queryset = queryset.filter(category=category)
        
        return queryset

    @action(detail=False, methods=['POST'])
    def bulk_update_availability(self, request):
        """
        Bulk update availability for multiple menu items
        Request body should be: {'menu_items': [1, 2, 3], 'is_available': true/false}
        """
        menu_item_ids = request.data.get('menu_items', [])
        is_available = request.data.get('is_available', None)
        
        if not menu_item_ids or is_available is None:
            return Response(
                {'error': 'Menu item IDs and availability status are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        updated_count = MenuItem.objects.filter(id__in=menu_item_ids).update(is_available=is_available)
        
        return Response({
            'updated_count': updated_count,
            'status': 'success'
        })

    @action(detail=False, methods=['GET'])
    def categories(self, request):
        """
        Get all unique menu item categories
        """
        categories = MenuItem.objects.values_list('category', flat=True).distinct()
        return Response(list(categories))

    @action(detail=False, methods=['GET'])
    def price_range(self, request):
        """
        Get the price range of menu items
        """
        price_range = MenuItem.objects.aggregate(
            min_price=Min('price'), 
            max_price=Max('price')
        )
        return Response(price_range)

class IngredientViewSet(viewsets.ModelViewSet):
    queryset = Ingredient.objects.all().order_by('-last_used_at')
    serializer_class = IngredientSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_class = IngredientFilter

    def perform_create(self, serializer):
        # Auto-set last_restocked_at when creating
        ingredient = serializer.save(last_restocked_at=timezone.now())
        
        # Log inventory transaction
        InventoryTransaction.objects.create(
            ingredient=ingredient,
            transaction_type='restock',
            quantity=ingredient.quantity,
            cost_per_unit=ingredient.cost_per_unit
        )

    def perform_update(self, serializer):
        # Track restock if quantity increased
        old_ingredient = self.get_object()
        new_ingredient = serializer.save()
        
        # Check if quantity increased (restock)
        if new_ingredient.quantity > old_ingredient.quantity:
            new_ingredient.last_restocked_at = timezone.now()
            new_ingredient.save(update_fields=['last_restocked_at'])
            
            # Log inventory transaction
            InventoryTransaction.objects.create(
                ingredient=new_ingredient,
                transaction_type='restock',
                quantity=new_ingredient.quantity - old_ingredient.quantity,
                cost_per_unit=new_ingredient.cost_per_unit
            )

    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """
        Get list of ingredients below reorder level
        """
        low_stock_ingredients = self.get_queryset().filter(
            quantity__lte=models.F('reorder_level')
        )
        
        serializer = self.get_serializer(low_stock_ingredients, many=True)
        return Response({
            'low_stock_ingredients': serializer.data,
            'total_low_stock': low_stock_ingredients.count()
        })

    @action(detail=True, methods=['post'])
    def update_stock(self, request, pk=None):
        """
        Manually update ingredient stock
        """
        ingredient = self.get_object()
        quantity = request.data.get('quantity')
        transaction_type = request.data.get('transaction_type', 'manual')
        
        if quantity is None:
            return Response(
                {'error': 'Quantity is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            quantity = float(quantity)
        except ValueError:
            return Response(
                {'error': 'Invalid quantity'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update ingredient quantity
        ingredient.quantity += quantity
        ingredient.save()
        
        # Log inventory transaction
        InventoryTransaction.objects.create(
            ingredient=ingredient,
            transaction_type=transaction_type,
            quantity=quantity,
            cost_per_unit=ingredient.cost_per_unit
        )
        
        serializer = self.get_serializer(ingredient)
        return Response(serializer.data)

class InventoryTransactionViewSet(viewsets.ModelViewSet):
    queryset = InventoryTransaction.objects.all()
    serializer_class = InventoryTransactionSerializer
    permission_classes = [IsAdminOrReadOnly]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        ingredient_id = self.request.query_params.get('ingredient_id')
        
        if ingredient_id:
            queryset = queryset.filter(ingredient_id=ingredient_id)
        
        return queryset
