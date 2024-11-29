from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/authentication/', include('authentication.urls')),
    path('api/tables/', include('tables.urls')),
    path('api/menu/', include('menu.urls')),
    path('api/kitchen/', include('kitchen.urls')),
    path('api/orders/', include('orders.urls')),
]
