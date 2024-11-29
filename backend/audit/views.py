from rest_framework import viewsets, permissions
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from .models import AuditLog
from .serializers import AuditLogSerializer
from authentication.permissions import IsAdminOrManager

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    A viewset for viewing audit logs.
    Only administrators and managers can view audit logs.
    """
    queryset = AuditLog.objects.all().select_related('user', 'content_type')
    serializer_class = AuditLogSerializer
    permission_classes = [IsAdminOrManager]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['action', 'status', 'user']
    search_fields = ['user__username', 'ip_address', 'details']
    ordering_fields = ['timestamp', 'action']
    ordering = ['-timestamp']

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Date range filtering
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        
        if start_date:
            queryset = queryset.filter(timestamp__gte=start_date)
        if end_date:
            queryset = queryset.filter(timestamp__lte=end_date)
            
        return queryset
