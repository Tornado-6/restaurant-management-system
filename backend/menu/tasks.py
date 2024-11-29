from celery import shared_task
from django.core.management import call_command

@shared_task
def sync_menu_items_task():
    """
    Celery task to synchronize menu items between menu and kitchen apps
    """
    call_command('sync_menu_items')
    return "Menu items synchronized successfully"
