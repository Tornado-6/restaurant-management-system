from rest_framework import viewsets, permissions
from kitchen.models import MenuItem
from .serializers import MenuItemSerializer

class MenuItemViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for menu items using kitchen's MenuItem as the source
    """
    queryset = MenuItem.objects.filter(is_available=True)
    serializer_class = MenuItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Optionally filter by category or other parameters
        """
        queryset = MenuItem.objects.filter(is_available=True)
        
        # Filter by category if provided
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category=category)
        
        return queryset
