from rest_framework import viewsets, permissions
from .models import Tenant, User, Lead, Customer, Deal, Communication, TravelPackage, Booking
from .serializers import TenantSerializer, UserSerializer, LeadSerializer, CustomerSerializer, DealSerializer, CommunicationSerializer, TravelPackageSerializer, BookingSerializer
from .permissions import RoleBasedPermission


class IsTenantAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return getattr(request.user, 'role', None) == 'ADMIN'


class IsTenantMember(permissions.BasePermission):
    def has_permission(self, request, view):
        return getattr(request.user, 'tenant_id', None) is not None


class TenantScopedMixin:
    """Mixin to ensure queryset is scoped to request.tenant when available."""
    def get_queryset(self):
        qs = super().get_queryset()
        tenant = getattr(self.request, 'tenant', None)
        if tenant is not None:
            return qs.filter(tenant_id=getattr(tenant, 'id', tenant))
        return qs.none()


class TenantViewSet(viewsets.ModelViewSet):
    queryset = Tenant.objects.all()
    serializer_class = TenantSerializer
    permission_classes = [permissions.IsAuthenticated, IsTenantAdmin]


class UserViewSet(TenantScopedMixin, viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, RoleBasedPermission]

    def get_permissions(self):
        # restrict creating/deleting users to ADMIN only
        perms = super().get_permissions()
        if self.request.method in ('POST', 'DELETE', 'PUT', 'PATCH'):
            return [permissions.IsAuthenticated(), IsTenantAdmin()]
        return perms


class LeadViewSet(TenantScopedMixin, viewsets.ModelViewSet):
    queryset = Lead.objects.all()
    serializer_class = LeadSerializer
    permission_classes = [permissions.IsAuthenticated]


class CustomerViewSet(TenantScopedMixin, viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [permissions.IsAuthenticated]


class DealViewSet(TenantScopedMixin, viewsets.ModelViewSet):
    queryset = Deal.objects.all()
    serializer_class = DealSerializer
    permission_classes = [permissions.IsAuthenticated]


class TravelPackageViewSet(TenantScopedMixin, viewsets.ModelViewSet):
    queryset = TravelPackage.objects.all()
    serializer_class = TravelPackageSerializer
    permission_classes = [permissions.IsAuthenticated]


class BookingViewSet(TenantScopedMixin, viewsets.ModelViewSet):
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]
