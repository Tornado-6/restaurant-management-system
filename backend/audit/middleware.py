import json
import logging
from django.utils.deprecation import MiddlewareMixin
from django.contrib.contenttypes.models import ContentType
from .models import AuditLog

logger = logging.getLogger(__name__)

class AuditMiddleware(MiddlewareMixin):
    def process_request(self, request):
        # Store request data for later use
        request.audit_data = {
            'ip_address': self.get_client_ip(request),
            'user_agent': request.META.get('HTTP_USER_AGENT', ''),
        }

    def process_response(self, request, response):
        if hasattr(request, 'audit_data') and hasattr(request, 'user') and request.user.is_authenticated:
            try:
                # Only log certain actions
                if self.should_log_request(request):
                    self.log_action(request, response)
            except Exception as e:
                logger.error(f"Error in audit logging: {str(e)}")
        
        return response

    def should_log_request(self, request):
        # Define which paths/actions to log
        sensitive_paths = [
            '/auth/users/',
            '/auth/login/',
            '/auth/logout/',
            '/auth/password_reset/',
        ]
        return any(path in request.path for path in sensitive_paths)

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0]
        return request.META.get('REMOTE_ADDR')

    def get_action_from_request(self, request):
        if 'login' in request.path:
            return 'login'
        if 'logout' in request.path:
            return 'logout'
        if 'password_reset' in request.path:
            return 'password_reset'
        
        # Map HTTP methods to actions
        method_to_action = {
            'POST': 'create',
            'PUT': 'update',
            'PATCH': 'update',
            'DELETE': 'delete',
        }
        return method_to_action.get(request.method, 'other')

    def log_action(self, request, response):
        action = self.get_action_from_request(request)
        status = 'success' if 200 <= response.status_code < 300 else 'failure'
        
        try:
            # Get the content type and object ID if available
            content_type = None
            object_id = None
            
            if 'users' in request.path and request.method != 'GET':
                content_type = ContentType.objects.get_for_model(request.user.__class__)
                object_id = request.user.id

            # Create audit log entry
            AuditLog.objects.create(
                user=request.user,
                action=action,
                ip_address=request.audit_data['ip_address'],
                user_agent=request.audit_data['user_agent'],
                content_type=content_type,
                object_id=object_id or 0,
                details={
                    'path': request.path,
                    'method': request.method,
                    'status_code': response.status_code,
                },
                status=status,
                error_message=str(response.content) if status == 'failure' else None
            )
        except Exception as e:
            logger.error(f"Failed to create audit log: {str(e)}")
