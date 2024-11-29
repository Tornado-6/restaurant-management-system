from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile
from menu.models import MenuItem as MenuAppMenuItem
from kitchen.models import MenuItem as KitchenMenuItem
import requests
import os

class Command(BaseCommand):
    help = 'Synchronize menu items between menu app and kitchen app'

    def handle(self, *args, **kwargs):
        # Fetch all menu items from the menu app
        menu_app_items = MenuAppMenuItem.objects.all()
        
        # Track synced items to identify deletions
        synced_item_ids = []

        for menu_item in menu_app_items:
            try:
                # Try to find an existing kitchen menu item
                kitchen_item, created = KitchenMenuItem.objects.get_or_create(
                    name=menu_item.name,
                    defaults={
                        'description': menu_item.description or '',
                        'price': menu_item.price,
                        'category': menu_item.category,
                        'is_available': menu_item.is_available,
                        'preparation_time': 15  # Default preparation time
                    }
                )

                # Update existing item if needed
                if not created:
                    kitchen_item.description = menu_item.description or ''
                    kitchen_item.price = menu_item.price
                    kitchen_item.category = menu_item.category
                    kitchen_item.is_available = menu_item.is_available
                    kitchen_item.save()

                # Handle image synchronization
                if menu_item.image:
                    try:
                        # Download and save the image if it exists
                        response = requests.get(menu_item.image.url)
                        if response.status_code == 200:
                            filename = os.path.basename(menu_item.image.name)
                            kitchen_item.image.save(
                                filename, 
                                ContentFile(response.content), 
                                save=True
                            )
                    except Exception as img_error:
                        self.stdout.write(self.style.WARNING(
                            f'Could not sync image for {menu_item.name}: {img_error}'
                        ))

                synced_item_ids.append(kitchen_item.id)
                
                self.stdout.write(self.style.SUCCESS(
                    f'Synced menu item: {menu_item.name}'
                ))

            except Exception as e:
                self.stdout.write(self.style.ERROR(
                    f'Error syncing menu item {menu_item.name}: {e}'
                ))

        # Remove kitchen menu items not in menu app
        KitchenMenuItem.objects.exclude(id__in=synced_item_ids).delete()

        self.stdout.write(self.style.SUCCESS('Menu item synchronization complete'))
