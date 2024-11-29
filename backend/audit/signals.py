from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from .models import AuditLog

User = get_user_model()

@receiver([post_save, post_delete], sender=User)
def log_user_changes(sender, instance, created=None, **kwargs):
    """
    Log user model changes automatically
    """
    if created is not None:  # post_save signal
        action = 'create' if created else 'update'
    else:  # post_delete signal
        action = 'delete'

    try:
        AuditLog.objects.create(
            user=instance,  # The user being modified
            action=action,
            content_type=ContentType.objects.get_for_model(User),
            object_id=instance.id,
            details={
                'username': instance.username,
                'email': instance.email,
                'role': instance.role,
            },
            status='success'
        )
    except Exception as e:
        # Log the error but don't raise it to prevent disrupting the save/delete operation
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Failed to create audit log for user change: {str(e)}")
