from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from menu.models import MenuItem
from kitchen.models import MenuItem as KitchenMenuItem

User = get_user_model()

class MenuItemTestCase(TestCase):
    def setUp(self):
        # Create a test client
        self.client = APIClient()
        
        # Create a test user
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpassword123'
        )
        self.client.force_authenticate(user=self.user)
        
        # Create some test menu items in kitchen
        self.kitchen_item1 = KitchenMenuItem.objects.create(
            name='Margherita Pizza',
            description='Classic tomato and mozzarella pizza',
            price=12.99,
            category='Pizza',
            is_vegetarian=True,
            preparation_time=15
        )
        
        self.kitchen_item2 = KitchenMenuItem.objects.create(
            name='Chicken Alfredo',
            description='Creamy pasta with grilled chicken',
            price=15.99,
            category='Pasta',
            is_vegetarian=False,
            preparation_time=20
        )

    def test_menu_item_proxy_creation(self):
        """Test that menu items are correctly proxied from kitchen"""
        # Verify that menu items are created from kitchen items
        menu_items = MenuItem.objects.all()
        self.assertEqual(menu_items.count(), 2)
        
        # Check specific item details
        margherita = menu_items.get(name='Margherita Pizza')
        self.assertEqual(margherita.price, 12.99)
        self.assertEqual(margherita.category, 'Pizza')
        self.assertTrue(margherita.is_vegetarian)

    def test_menu_item_api_list(self):
        """Test retrieving list of menu items via API"""
        response = self.client.get('/api/menu-items/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 2)

    def test_menu_item_filtering(self):
        """Test filtering menu items"""
        # Filter by vegetarian
        response = self.client.get('/api/menu-items/?is_vegetarian=true')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Margherita Pizza')
        
        # Filter by category
        response = self.client.get('/api/menu-items/?category=Pizza')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Margherita Pizza')

    def test_menu_item_search(self):
        """Test searching menu items"""
        # Search by name
        response = self.client.get('/api/menu-items/?search=Chicken')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Chicken Alfredo')
        
        # Search by description
        response = self.client.get('/api/menu-items/?search=creamy')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Chicken Alfredo')
