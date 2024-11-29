from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.core.management import call_command
from .models import MenuItem

@receiver(post_save, sender=MenuItem)
def sync_menu_item_to_kitchen(sender, instance, created, **kwargs):
    """
    Synchronize menu item to kitchen when created or updated
    """
    call_command('sync_menu_items')

@receiver(post_delete, sender=MenuItem)
def sync_menu_item_deletion(sender, instance, **kwargs):
    """
    Synchronize menu item deletion to kitchen
    """
    call_command('sync_menu_items')
