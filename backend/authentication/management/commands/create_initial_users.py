from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = 'Create initial users for the restaurant management system'

    def handle(self, *args, **kwargs):
        # Create admin user
        admin_user, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@restaurant.com',
                'first_name': 'Admin',
                'last_name': 'User',
                'role': 'admin',
                'is_staff': True,
                'is_superuser': True
            }
        )
        
        if created:
            admin_user.set_password('AdminPass123!')
            admin_user.save()
            self.stdout.write(self.style.SUCCESS('Admin user created successfully'))
        else:
            self.stdout.write(self.style.WARNING('Admin user already exists'))

        # Create manager user
        manager_user, created = User.objects.get_or_create(
            username='manager',
            defaults={
                'email': 'manager@restaurant.com',
                'first_name': 'Restaurant',
                'last_name': 'Manager',
                'role': 'manager',
                'is_staff': True
            }
        )
        
        if created:
            manager_user.set_password('ManagerPass123!')
            manager_user.save()
            self.stdout.write(self.style.SUCCESS('Manager user created successfully'))
        else:
            self.stdout.write(self.style.WARNING('Manager user already exists'))

        # Create waiter user
        waiter_user, created = User.objects.get_or_create(
            username='waiter',
            defaults={
                'email': 'waiter@restaurant.com',
                'first_name': 'Restaurant',
                'last_name': 'Waiter',
                'role': 'waiter'
            }
        )
        
        if created:
            waiter_user.set_password('WaiterPass123!')
            waiter_user.save()
            self.stdout.write(self.style.SUCCESS('Waiter user created successfully'))
        else:
            self.stdout.write(self.style.WARNING('Waiter user already exists'))
