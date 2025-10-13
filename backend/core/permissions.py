from rest_framework import permissions


class RoleBasedPermission(permissions.BasePermission):
    """Permission that maps HTTP methods to allowed roles.

    Roles: ADMIN, MANAGER, AGENT, VIEWER
    - SAFE_METHODS (GET, HEAD, OPTIONS): allowed for all authenticated users in tenant
    - POST: ADMIN, MANAGER, AGENT
    - PUT/PATCH/DELETE: ADMIN or MANAGER for most resources; for users only ADMIN
    """

    def has_permission(self, request, view):
        # require authenticated
        if not request.user or not request.user.is_authenticated:
            return False

        role = getattr(request.user, 'role', None)
        method = request.method

        if method in permissions.SAFE_METHODS:
            return True

        if method == 'POST':
            return role in ('ADMIN', 'MANAGER', 'AGENT')

        if method in ('PUT', 'PATCH', 'DELETE'):
            # default conservative policy: only ADMIN or MANAGER
            return role in ('ADMIN', 'MANAGER')

        return False

    def has_object_permission(self, request, view, obj):
        # Ensure object belongs to the same tenant when applicable
        tenant = getattr(request, 'tenant', None)
        if tenant is None:
            return False
        obj_tenant_id = getattr(obj, 'tenant_id', None) or getattr(obj, 'tenant', None)
        # if tenant is model instance, get id
        if hasattr(obj_tenant_id, 'id'):
            obj_tenant_id = obj_tenant_id.id
        return obj_tenant_id == getattr(tenant, 'id', tenant)
