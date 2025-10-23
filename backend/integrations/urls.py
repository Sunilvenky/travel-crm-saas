"""
URLs for Integration APIs
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import IntegrationViewSet, WhatsAppViewSet, MetaAdsViewSet

router = DefaultRouter()
router.register(r'integrations', IntegrationViewSet, basename='integration')
router.register(r'whatsapp', WhatsAppViewSet, basename='whatsapp')
router.register(r'meta-ads', MetaAdsViewSet, basename='meta-ads')

urlpatterns = [
    path('', include(router.urls)),
]
