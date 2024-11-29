from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

from .serializers import (
    UserSerializer, 
    UserUpdateSerializer, 
    PasswordResetRequestSerializer, 
    PasswordResetConfirmSerializer
)
from .permissions import IsAdminOrManager, IsSelfOrAdminOrManager

User = get_user_model()

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminOrManager]

    def get_serializer_class(self):
        if self.action in ['update', 'partial_update']:
            return UserUpdateSerializer
        return UserSerializer

    def get_permissions(self):
        # Special case for creating users (registration)
        if self.action == 'create':
            return [permissions.AllowAny()]
        
        # For specific user actions, use object-level permissions
        if self.action in ['retrieve', 'update', 'partial_update', 'destroy']:
            return [IsSelfOrAdminOrManager()]
        
        return super().get_permissions()

    def list(self, request):
        # Only allow admins and managers to list all users
        if request.user.role not in ['admin', 'manager']:
            return Response(
                {'detail': 'You do not have permission to list users.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().list(request)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['put'], permission_classes=[permissions.IsAuthenticated])
    def change_password(self, request):
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')

        # Validate password fields
        if not old_password or not new_password:
            return Response(
                {'error': 'Both old and new passwords are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check current password
        if not user.check_password(old_password):
            return Response(
                {'error': 'Current password is incorrect.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate new password strength
        if len(new_password) < 8:
            return Response(
                {'error': 'New password must be at least 8 characters long.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.set_password(new_password)
        user.save()
        return Response({'status': 'password changed successfully'})

    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def password_reset_request(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            user = User.objects.get(email=email)
            
            # Create reset token
            reset_token = serializer.create_reset_token(user)
            
            # Send reset email
            serializer.send_reset_email(email, reset_token)
            
            return Response({
                'message': 'Password reset link sent to your email.'
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def password_reset_confirm(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if serializer.is_valid():
            # Optional: Add token expiration check
            user = User.objects.get(password_reset_token=serializer.validated_data['token'])
            token_created_at = user.password_reset_token_created_at
            
            if token_created_at and timezone.now() - token_created_at > timedelta(hours=1):
                return Response({
                    'error': 'Reset token has expired. Please request a new reset link.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            serializer.save()
            return Response({
                'message': 'Password reset successful.'
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CustomTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        
        if response.status_code == 200:
            # Get the user
            user = User.objects.get(username=request.data['username'])
            
            # Add user details to the response
            response.data['user'] = UserSerializer(user).data
            
            # Optional: Refresh token management
            refresh = RefreshToken.for_user(user)
            response.data['refresh'] = str(refresh)
            response.data['access'] = str(refresh.access_token)
        
        return response
