from rest_framework import serializers
from .models import AuditLog

class AuditLogSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()
    content_type = serializers.StringRelatedField()
    
    class Meta:
        model = AuditLog
        fields = (
            'id', 'user', 'action', 'timestamp', 'ip_address',
            'content_type', 'object_id', 'details', 'status',
            'error_message'
        )
        read_only_fields = fields
