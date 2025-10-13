from django.urls import path, include
from django.http import HttpResponse
from rest_framework.routers import DefaultRouter
from .views import TenantViewSet, UserViewSet, LeadViewSet, CustomerViewSet, DealViewSet, TravelPackageViewSet, BookingViewSet

router = DefaultRouter()
router.register(r'tenants', TenantViewSet)
router.register(r'users', UserViewSet)
router.register(r'leads', LeadViewSet)
router.register(r'customers', CustomerViewSet)
router.register(r'deals', DealViewSet)
router.register(r'packages', TravelPackageViewSet)
router.register(r'bookings', BookingViewSet)

urlpatterns = [
    path('test/', lambda r: HttpResponse('ok')),
    path('', include(router.urls)),
]
