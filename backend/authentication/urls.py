from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import UserViewSet, CustomTokenObtainPairView

router = DefaultRouter()
router.register(r'users', UserViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('users/password_reset_request/', UserViewSet.as_view({'post': 'password_reset_request'}), name='password_reset_request'),
    path('users/password_reset_confirm/', UserViewSet.as_view({'post': 'password_reset_confirm'}), name='password_reset_confirm'),
]
