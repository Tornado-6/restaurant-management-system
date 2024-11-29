from rest_framework import serializers
from .models import MenuItemProxy
from kitchen.models import MenuItem

class MenuItemSerializer(serializers.ModelSerializer):
    """
    Serializer for menu items with additional proxy metadata
    """
    display_priority = serializers.IntegerField(source='menu_proxy.display_priority', read_only=True)
    is_featured = serializers.BooleanField(source='menu_proxy.is_featured', read_only=True)

    class Meta:
        model = MenuItem
        fields = [
            'id', 
            'name', 
            'description', 
            'price', 
            'category', 
            'is_available', 
            'image', 
            'preparation_time',
            'display_priority',
            'is_featured'
        ]
        read_only_fields = ['id']

    def to_representation(self, instance):
        """
        Custom representation to include MenuItemProxy fields if they exist
        """
        representation = super().to_representation(instance)
        
        try:
            menu_proxy = instance.menu_proxy
            representation['display_priority'] = menu_proxy.display_priority
            representation['is_featured'] = menu_proxy.is_featured
        except MenuItemProxy.DoesNotExist:
            representation['display_priority'] = 0
            representation['is_featured'] = False
        
        return representation
