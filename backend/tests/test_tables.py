from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from tables.models import Table, Reservation
from datetime import date, time, timedelta

User = get_user_model()

class TableTestCase(TestCase):
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
        
        # Create some test tables
        self.table1 = Table.objects.create(
            table_number=1,
            capacity=4,
            status='available',
            location='Main Floor'
        )
        self.table2 = Table.objects.create(
            table_number=2,
            capacity=2,
            status='available',
            location='Window Area'
        )

    def test_table_creation(self):
        """Test table creation and basic attributes"""
        self.assertEqual(self.table1.table_number, 1)
        self.assertEqual(self.table1.capacity, 4)
        self.assertEqual(self.table1.status, 'available')
        self.assertEqual(self.table1.location, 'Main Floor')

    def test_table_api_list(self):
        """Test retrieving list of tables via API"""
        response = self.client.get('/api/tables/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 2)

    def test_table_api_create(self):
        """Test creating a new table via API"""
        table_data = {
            'table_number': 3,
            'capacity': 6,
            'status': 'available',
            'location': 'Private Room'
        }
        response = self.client.post('/api/tables/', table_data)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['table_number'], 3)
        self.assertEqual(response.data['location'], 'Private Room')

    def test_table_api_update(self):
        """Test updating an existing table via API"""
        update_data = {
            'table_number': 1,
            'capacity': 5,
            'status': 'maintenance',
            'location': 'Main Floor Updated'
        }
        response = self.client.put(f'/api/tables/{self.table1.id}/', update_data)
        self.assertEqual(response.status_code, 200)
        
        # Refresh from database
        updated_table = Table.objects.get(id=self.table1.id)
        self.assertEqual(updated_table.capacity, 5)
        self.assertEqual(updated_table.status, 'maintenance')
        self.assertEqual(updated_table.location, 'Main Floor Updated')

class ReservationTestCase(TestCase):
    def setUp(self):
        # Create a test client and user
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpassword123'
        )
        self.client.force_authenticate(user=self.user)
        
        # Create a test table
        self.table = Table.objects.create(
            table_number=1,
            capacity=4,
            status='available',
            location='Main Floor'
        )

    def test_reservation_creation(self):
        """Test creating a valid reservation"""
        reservation_data = {
            'table': self.table.id,
            'customer_name': 'John Doe',
            'customer_phone': '1234567890',
            'customer_email': 'john@example.com',
            'party_size': 3,
            'reservation_date': date.today() + timedelta(days=1),
            'reservation_time': time(19, 0),
            'status': 'pending',
            'notes': 'Birthday celebration'
        }
        
        response = self.client.post('/api/reservations/', reservation_data)
        self.assertEqual(response.status_code, 201)
        
        # Verify reservation details
        self.assertEqual(response.data['customer_name'], 'John Doe')
        self.assertEqual(response.data['party_size'], 3)

    def test_reservation_validation(self):
        """Test reservation validation rules"""
        # First reservation
        first_reservation_data = {
            'table': self.table.id,
            'customer_name': 'First Customer',
            'customer_phone': '1111111111',
            'customer_email': 'first@example.com',
            'party_size': 3,
            'reservation_date': date.today() + timedelta(days=1),
            'reservation_time': time(19, 0),
            'status': 'confirmed'
        }
        
        # Second reservation at the same time (should fail)
        second_reservation_data = {
            'table': self.table.id,
            'customer_name': 'Second Customer',
            'customer_phone': '2222222222',
            'customer_email': 'second@example.com',
            'party_size': 2,
            'reservation_date': date.today() + timedelta(days=1),
            'reservation_time': time(19, 0),
            'status': 'confirmed'
        }
        
        # Create first reservation
        first_response = self.client.post('/api/reservations/', first_reservation_data)
        self.assertEqual(first_response.status_code, 201)
        
        # Try to create second reservation (should fail)
        second_response = self.client.post('/api/reservations/', second_reservation_data)
        self.assertEqual(second_response.status_code, 400)

    def test_reservation_party_size_validation(self):
        """Test reservation party size validation"""
        # Create a small table
        small_table = Table.objects.create(
            table_number=2,
            capacity=2,
            status='available',
            location='Small Area'
        )
        
        # Try to reserve for a party larger than table capacity
        reservation_data = {
            'table': small_table.id,
            'customer_name': 'Large Party',
            'customer_phone': '3333333333',
            'customer_email': 'large@example.com',
            'party_size': 3,  # Exceeds table capacity
            'reservation_date': date.today() + timedelta(days=1),
            'reservation_time': time(19, 0),
            'status': 'pending'
        }
        
        response = self.client.post('/api/reservations/', reservation_data)
        self.assertEqual(response.status_code, 400)
