from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MenuItemViewSet, 
    IngredientViewSet, 
    InventoryTransactionViewSet
)

router = DefaultRouter()
router.register(r'menuitems', MenuItemViewSet)
router.register(r'ingredients', IngredientViewSet)
router.register(r'inventory-transactions', InventoryTransactionViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
