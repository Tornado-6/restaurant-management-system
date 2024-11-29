from django.db import models
from django.core.validators import MinValueValidator
from kitchen.models import MenuItem as KitchenMenuItem

class MenuItemProxy(models.Model):
    """
    Proxy model to add additional metadata to kitchen's MenuItem
    """
    menu_item = models.OneToOneField(
        KitchenMenuItem, 
        on_delete=models.CASCADE, 
        primary_key=True,
        related_name='menu_proxy'
    )
    
    # Additional fields specific to menu management
    display_priority = models.IntegerField(default=0)
    is_featured = models.BooleanField(default=False)
    
    def __str__(self):
        return str(self.menu_item)
    
    class Meta:
        verbose_name = 'Menu Item Proxy'
        verbose_name_plural = 'Menu Item Proxies'
        db_table = 'menu_item_proxies'

# Alias for backwards compatibility
MenuItem = KitchenMenuItem
