from django.utils.deprecation import MiddlewareMixin
from .models import Tenant
from django.http import HttpRequest

class TenantMiddleware(MiddlewareMixin):
    def process_request(self, request: HttpRequest):
        host = request.get_host().split(':')[0]
        # Try subdomain/domain mapping
        try:
            tenant = Tenant.objects.filter(domain__icontains=host).first()
            request.tenant = tenant
        except Exception:
            request.tenant = None
        # If user is authenticated, attach tenant_id for easy checks
        try:
            if hasattr(request, 'user') and request.user and request.user.is_authenticated:
                setattr(request.user, 'tenant_id', getattr(request.tenant, 'id', None))
        except Exception:
            pass

