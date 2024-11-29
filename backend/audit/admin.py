from django.contrib import admin
from django.utils.html import format_html
from .models import AuditLog

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'action', 'timestamp', 'ip_address', 'status', 'colored_status')
    list_filter = ('action', 'status', 'timestamp', 'user')
    search_fields = ('user__username', 'ip_address', 'details')
    readonly_fields = (
        'user', 'action', 'timestamp', 'ip_address', 'user_agent',
        'content_type', 'object_id', 'details', 'status', 'error_message'
    )
    ordering = ('-timestamp',)

    def colored_status(self, obj):
        colors = {
            'success': 'green',
            'failure': 'red',
        }
        return format_html(
            '<span style="color: {};">{}</span>',
            colors.get(obj.status, 'black'),
            obj.status.title()
        )
    colored_status.short_description = 'Status'

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        # Only superusers can delete audit logs
        return request.user.is_superuser
