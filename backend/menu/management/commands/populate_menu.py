from django.core.management.base import BaseCommand
from kitchen.models import MenuItem
from django.core.files.base import ContentFile
import os

class Command(BaseCommand):
    help = 'Populate the menu with initial items'

    def handle(self, *args, **kwargs):
        # Clear existing menu items
        MenuItem.objects.all().delete()

        # Define initial menu items
        initial_items = [
            {
                'name': 'Classic Burger',
                'description': 'Juicy beef patty with lettuce, tomato, and our special sauce',
                'price': 12.99,
                'category': 'Burgers',
                'is_available': True,
                'preparation_time': 15
            },
            {
                'name': 'Margherita Pizza',
                'description': 'Traditional pizza with fresh mozzarella, tomatoes, and basil',
                'price': 14.50,
                'category': 'Pizzas',
                'is_available': True,
                'preparation_time': 20
            },
            {
                'name': 'Caesar Salad',
                'description': 'Crisp romaine lettuce, croutons, parmesan, and Caesar dressing',
                'price': 8.99,
                'category': 'Salads',
                'is_available': True,
                'preparation_time': 10
            },
            {
                'name': 'Grilled Salmon',
                'description': 'Fresh salmon fillet with herb butter and seasonal vegetables',
                'price': 18.99,
                'category': 'Seafood',
                'is_available': True,
                'preparation_time': 25
            },
            {
                'name': 'Vegetarian Pasta',
                'description': 'Penne pasta with roasted vegetables and marinara sauce',
                'price': 13.50,
                'category': 'Vegetarian',
                'is_available': True,
                'preparation_time': 18
            },
            {
                'name': 'Chocolate Lava Cake',
                'description': 'Warm chocolate cake with a molten chocolate center',
                'price': 7.99,
                'category': 'Desserts',
                'is_available': True,
                'preparation_time': 15
            }
        ]

        # Create menu items
        for item_data in initial_items:
            menu_item = MenuItem.objects.create(**item_data)
            self.stdout.write(self.style.SUCCESS(f'Created menu item: {item_data["name"]}'))

        self.stdout.write(self.style.SUCCESS('Successfully populated menu'))
