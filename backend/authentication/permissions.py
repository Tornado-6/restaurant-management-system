from rest_framework import permissions

class IsAdminOrManager(permissions.BasePermission):
    """
    Custom permission to only allow admins or managers to manage users.
    """
    def has_permission(self, request, view):
        # Allow read-only access to authenticated users
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        
        # Only allow admins and managers to create/modify/delete users
        return (
            request.user.is_authenticated and 
            request.user.role in ['admin', 'manager']
        )

    def has_object_permission(self, request, view, obj):
        # Allow admins and managers to modify/delete users
        if request.method in permissions.SAFE_METHODS:
            return True
        
        return (
            request.user.is_authenticated and 
            request.user.role in ['admin', 'manager']
        )

class IsSelfOrAdminOrManager(permissions.BasePermission):
    """
    Custom permission to allow users to view/edit their own profile,
    and admins/managers to manage all profiles.
    """
    def has_object_permission(self, request, view, obj):
        # Allow users to view/edit their own profile
        if request.user == obj:
            return True
        
        # Allow admins and managers full access
        return (
            request.user.is_authenticated and 
            request.user.role in ['admin', 'manager']
        )
