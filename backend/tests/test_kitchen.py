from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from kitchen.models import MenuItem, Order, OrderItem
from authentication.models import User as CustomUser

class KitchenTestCase(TestCase):
    def setUp(self):
        # Create a test client
        self.client = APIClient()
        
        # Create test users with different roles
        self.kitchen_staff = CustomUser.objects.create_user(
            username='kitchenstaff',
            email='kitchen@example.com',
            password='kitchenpassword123',
            role='kitchen_staff'
        )
        
        self.server = CustomUser.objects.create_user(
            username='server',
            email='server@example.com',
            password='serverpassword123',
            role='server'
        )
        
        # Create test menu items
        self.menu_item1 = MenuItem.objects.create(
            name='Margherita Pizza',
            description='Classic tomato and mozzarella pizza',
            price=12.99,
            category='Pizza',
            is_vegetarian=True,
            preparation_time=15
        )
        
        self.menu_item2 = MenuItem.objects.create(
            name='Chicken Alfredo',
            description='Creamy pasta with grilled chicken',
            price=15.99,
            category='Pasta',
            is_vegetarian=False,
            preparation_time=20
        )

    def test_menu_item_creation(self):
        """Test menu item creation and attributes"""
        self.assertEqual(self.menu_item1.name, 'Margherita Pizza')
        self.assertEqual(self.menu_item1.price, 12.99)
        self.assertTrue(self.menu_item1.is_vegetarian)

    def test_order_creation(self):
        """Test creating an order with multiple items"""
        # Authenticate as a server
        self.client.force_authenticate(user=self.server)
        
        # Create an order
        order_data = {
            'items': [
                {
                    'menu_item': self.menu_item1.id,
                    'quantity': 2
                },
                {
                    'menu_item': self.menu_item2.id,
                    'quantity': 1
                }
            ],
            'total_price': 41.97,
            'status': 'pending'
        }
        
        response = self.client.post('/api/orders/', order_data, format='json')
        self.assertEqual(response.status_code, 201)
        
        # Verify order details
        order = Order.objects.get(id=response.data['id'])
        self.assertEqual(order.total_price, 41.97)
        self.assertEqual(order.status, 'pending')
        self.assertEqual(order.orderitem_set.count(), 2)

    def test_order_status_update(self):
        """Test updating order status by kitchen staff"""
        # Authenticate as a server to create the order
        self.client.force_authenticate(user=self.server)
        
        # Create an order
        order_data = {
            'items': [
                {
                    'menu_item': self.menu_item1.id,
                    'quantity': 1
                }
            ],
            'total_price': 12.99,
            'status': 'pending'
        }
        
        order_response = self.client.post('/api/orders/', order_data, format='json')
        order_id = order_response.data['id']
        
        # Authenticate as kitchen staff to update status
        self.client.force_authenticate(user=self.kitchen_staff)
        
        # Update order status
        status_update = {
            'status': 'preparing'
        }
        
        response = self.client.patch(f'/api/orders/{order_id}/', status_update, format='json')
        self.assertEqual(response.status_code, 200)
        
        # Verify status update
        order = Order.objects.get(id=order_id)
        self.assertEqual(order.status, 'preparing')

    def test_kitchen_staff_permissions(self):
        """Test that only kitchen staff can update order status"""
        # Authenticate as a server
        self.client.force_authenticate(user=self.server)
        
        # Try to update order status (should be forbidden)
        status_update = {
            'status': 'preparing'
        }
        
        response = self.client.patch('/api/orders/999/', status_update, format='json')
        self.assertEqual(response.status_code, 403)  # Forbidden

    def test_order_item_details(self):
        """Test order item creation and details"""
        # Create an order
        order = Order.objects.create(
            total_price=28.98,
            status='pending'
        )
        
        # Create order items
        OrderItem.objects.create(
            order=order,
            menu_item=self.menu_item1,
            quantity=2
        )
        
        OrderItem.objects.create(
            order=order,
            menu_item=self.menu_item2,
            quantity=1
        )
        
        # Verify order items
        order_items = order.orderitem_set.all()
        self.assertEqual(order_items.count(), 2)
        
        # Check specific order item details
        pizza_item = order_items.get(menu_item=self.menu_item1)
        self.assertEqual(pizza_item.quantity, 2)
        self.assertEqual(pizza_item.menu_item.name, 'Margherita Pizza')
