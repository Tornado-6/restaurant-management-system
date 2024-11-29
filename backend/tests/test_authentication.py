from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

class AuthenticationTestCase(TestCase):
    def setUp(self):
        # Create a test client
        self.client = APIClient()
        
        # Create test users with different roles
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='adminpassword123',
            role='admin'
        )
        
        self.kitchen_staff = User.objects.create_user(
            username='kitchenstaff',
            email='kitchen@example.com',
            password='kitchenpassword123',
            role='kitchen_staff'
        )
        
        self.server = User.objects.create_user(
            username='server',
            email='server@example.com',
            password='serverpassword123',
            role='server'
        )

    def test_user_creation(self):
        """Test user creation and role assignment"""
        self.assertEqual(self.admin_user.role, 'admin')
        self.assertEqual(self.kitchen_staff.role, 'kitchen_staff')
        self.assertEqual(self.server.role, 'server')

    def test_jwt_token_generation(self):
        """Test JWT token generation and authentication"""
        # Generate token for server
        refresh = RefreshToken.for_user(self.server)
        
        # Verify token generation
        self.assertTrue(refresh)
        self.assertTrue(refresh.access_token)

    def test_login_authentication(self):
        """Test user login with different credentials"""
        # Test successful login for server
        login_data = {
            'username': 'server',
            'password': 'serverpassword123'
        }
        
        response = self.client.post('/api/token/', login_data)
        self.assertEqual(response.status_code, 200)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        # Test login with incorrect password
        login_data = {
            'username': 'server',
            'password': 'wrongpassword'
        }
        
        response = self.client.post('/api/token/', login_data)
        self.assertEqual(response.status_code, 401)  # Unauthorized

    def test_role_based_access_control(self):
        """Test access control for different user roles"""
        # Authenticate as server
        self.client.force_authenticate(user=self.server)
        
        # Try to access admin-only endpoint
        response = self.client.get('/api/admin/users/')
        self.assertEqual(response.status_code, 403)  # Forbidden
        
        # Authenticate as admin
        self.client.force_authenticate(user=self.admin_user)
        
        # Access admin endpoint
        response = self.client.get('/api/admin/users/')
        self.assertEqual(response.status_code, 200)

    def test_token_refresh(self):
        """Test JWT token refresh mechanism"""
        # Generate initial refresh token
        refresh = RefreshToken.for_user(self.server)
        
        # Attempt to refresh token
        refresh_data = {
            'refresh': str(refresh)
        }
        
        response = self.client.post('/api/token/refresh/', refresh_data)
        self.assertEqual(response.status_code, 200)
        self.assertIn('access', response.data)

    def test_password_change(self):
        """Test user password change"""
        # Authenticate as server
        self.client.force_authenticate(user=self.server)
        
        # Change password
        password_change_data = {
            'old_password': 'serverpassword123',
            'new_password': 'newserverpassword456'
        }
        
        response = self.client.post('/api/change-password/', password_change_data)
        self.assertEqual(response.status_code, 200)
        
        # Verify new password works
        login_data = {
            'username': 'server',
            'password': 'newserverpassword456'
        }
        
        login_response = self.client.post('/api/token/', login_data)
        self.assertEqual(login_response.status_code, 200)
