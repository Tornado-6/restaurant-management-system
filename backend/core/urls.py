from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('authentication.urls')),
    path('api/kitchen/', include('kitchen.urls')),
    path('api/orders/', include('orders.urls')),
    path('api/tables/', include('tables.urls')),
    path('api/', include('menu.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
