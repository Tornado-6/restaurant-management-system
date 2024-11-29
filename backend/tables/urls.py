from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TableViewSet, ReservationViewSet

router = DefaultRouter()
router.register(r'', TableViewSet, basename='tables')
router.register(r'reservations', ReservationViewSet, basename='reservations')

urlpatterns = router.urls
