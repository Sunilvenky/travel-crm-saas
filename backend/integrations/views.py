"""
API Views for Integration Management
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from core.models import Integration, MetaAdsCampaign, WhatsAppConversation, TravelPackage
from integrations.manager import IntegrationManager
import json


class IntegrationViewSet(viewsets.ViewSet):
    """Manage external integrations"""
    permission_classes = [IsAuthenticated]
    
    def list(self, request):
        """Get all integrations status for current tenant"""
        tenant_id = request.user.tenant_id
        manager = IntegrationManager(tenant_id)
        
        # Get integration status
        status_data = manager.get_integration_status()
        
        # Get saved integrations from database
        saved_integrations = Integration.objects.filter(tenant_id=tenant_id)
        
        integrations_list = []
        for integration in saved_integrations:
            integrations_list.append({
                'id': integration.id,
                'type': integration.integration_type,
                'name': dict(Integration.INTEGRATION_TYPES).get(integration.integration_type),
                'is_active': integration.is_active,
                'is_connected': status_data.get(integration.integration_type, {}).get('connected', False),
                'last_synced_at': integration.last_synced_at,
                'created_at': integration.created_at
            })
        
        return Response({
            'success': True,
            'integrations': integrations_list
        })
    
    @action(detail=False, methods=['post'])
    def connect(self, request):
        """Connect to an integration"""
        tenant_id = request.user.tenant_id
        integration_type = request.data.get('integration_type')
        credentials = request.data.get('credentials', {})
        
        if not integration_type:
            return Response({
                'success': False,
                'error': 'integration_type is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Initialize manager and connect
        manager = IntegrationManager(tenant_id)
        result = manager.connect_integration(integration_type, credentials)
        
        if result['success']:
            # Save to database
            integration, created = Integration.objects.update_or_create(
                tenant_id=tenant_id,
                integration_type=integration_type,
                defaults={
                    'is_active': True,
                    'credentials': credentials,  # In production, encrypt this!
                    'updated_at': timezone.now()
                }
            )
            
            return Response({
                'success': True,
                'message': f'{integration_type} connected successfully',
                'integration': {
                    'id': integration.id,
                    'type': integration.integration_type,
                    'is_active': integration.is_active
                }
            })
        else:
            return Response({
                'success': False,
                'error': result.get('error', 'Connection failed')
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def disconnect(self, request):
        """Disconnect from an integration"""
        tenant_id = request.user.tenant_id
        integration_type = request.data.get('integration_type')
        
        if not integration_type:
            return Response({
                'success': False,
                'error': 'integration_type is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Disconnect via manager
        manager = IntegrationManager(tenant_id)
        result = manager.disconnect_integration(integration_type)
        
        # Update database
        Integration.objects.filter(
            tenant_id=tenant_id,
            integration_type=integration_type
        ).update(is_active=False)
        
        return Response(result)
    
    @action(detail=False, methods=['post'])
    def test(self, request):
        """Test integration connection"""
        tenant_id = request.user.tenant_id
        integration_type = request.data.get('integration_type')
        
        if not integration_type:
            return Response({
                'success': False,
                'error': 'integration_type is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        manager = IntegrationManager(tenant_id)
        result = manager.test_integration(integration_type)
        
        return Response(result)
    
    @action(detail=False, methods=['post'])
    def sync(self, request):
        """Sync data from all or specific integration"""
        tenant_id = request.user.tenant_id
        integration_type = request.data.get('integration_type')  # Optional
        
        manager = IntegrationManager(tenant_id)
        
        if integration_type:
            # Sync specific integration
            integration = manager.get_integration(integration_type)
            if not integration:
                return Response({
                    'success': False,
                    'error': f'Integration {integration_type} not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            result = integration.sync_data()
            
            # Update last_synced_at
            Integration.objects.filter(
                tenant_id=tenant_id,
                integration_type=integration_type
            ).update(last_synced_at=timezone.now())
        else:
            # Sync all integrations
            result = manager.sync_all_integrations()
            
            # Update all last_synced_at
            Integration.objects.filter(
                tenant_id=tenant_id,
                is_active=True
            ).update(last_synced_at=timezone.now())
        
        return Response({
            'success': True,
            'results': result
        })


class WhatsAppViewSet(viewsets.ViewSet):
    """WhatsApp Agent integration endpoints"""
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['post'])
    def send_message(self, request):
        """Send WhatsApp message to a contact"""
        tenant_id = request.user.tenant_id
        phone_number = request.data.get('phone_number')
        message = request.data.get('message')
        template_name = request.data.get('template_name')
        template_params = request.data.get('template_params', {})
        
        if not phone_number:
            return Response({
                'success': False,
                'error': 'phone_number is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        manager = IntegrationManager(tenant_id)
        whatsapp = manager.get_integration('whatsapp')
        
        if not whatsapp or not whatsapp.is_connected:
            return Response({
                'success': False,
                'error': 'WhatsApp not connected'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        result = whatsapp.send_message(
            phone_number=phone_number,
            message=message,
            template_name=template_name,
            template_params=template_params
        )
        
        return Response(result)
    
    @action(detail=False, methods=['post'])
    def send_package(self, request):
        """Send package details via WhatsApp"""
        tenant_id = request.user.tenant_id
        phone_number = request.data.get('phone_number')
        package_id = request.data.get('package_id')
        
        if not phone_number or not package_id:
            return Response({
                'success': False,
                'error': 'phone_number and package_id are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            package = TravelPackage.objects.get(id=package_id, tenant_id=tenant_id)
        except TravelPackage.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Package not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        manager = IntegrationManager(tenant_id)
        whatsapp = manager.get_integration('whatsapp')
        
        if not whatsapp or not whatsapp.is_connected:
            return Response({
                'success': False,
                'error': 'WhatsApp not connected'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        package_data = {
            'id': str(package.id),
            'name': package.name,
            'description': package.description,
            'base_price': str(package.base_price),
            'duration': package.duration,
            'destination': package.destination
        }
        
        result = whatsapp.send_package_details(phone_number, package_data)
        
        return Response(result)
    
    @action(detail=False, methods=['post'])
    def broadcast(self, request):
        """Broadcast message to multiple contacts"""
        tenant_id = request.user.tenant_id
        phone_numbers = request.data.get('phone_numbers', [])
        message = request.data.get('message')
        template_name = request.data.get('template_name')
        
        if not phone_numbers or not message:
            return Response({
                'success': False,
                'error': 'phone_numbers and message are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        manager = IntegrationManager(tenant_id)
        whatsapp = manager.get_integration('whatsapp')
        
        if not whatsapp or not whatsapp.is_connected:
            return Response({
                'success': False,
                'error': 'WhatsApp not connected'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        result = whatsapp.broadcast_message(
            phone_numbers=phone_numbers,
            message=message,
            template_name=template_name
        )
        
        return Response(result)
    
    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """Get WhatsApp analytics"""
        tenant_id = request.user.tenant_id
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if not start_date or not end_date:
            return Response({
                'success': False,
                'error': 'start_date and end_date are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        manager = IntegrationManager(tenant_id)
        whatsapp = manager.get_integration('whatsapp')
        
        if not whatsapp or not whatsapp.is_connected:
            return Response({
                'success': False,
                'error': 'WhatsApp not connected'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        result = whatsapp.get_analytics(start_date, end_date)
        
        return Response(result)


class MetaAdsViewSet(viewsets.ViewSet):
    """Meta Ads Agent integration endpoints"""
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['post'])
    def create_campaign(self, request):
        """Create a new Meta Ads campaign"""
        tenant_id = request.user.tenant_id
        campaign_data = request.data.get('campaign_data', {})
        
        manager = IntegrationManager(tenant_id)
        meta_ads = manager.get_integration('meta_ads')
        
        if not meta_ads or not meta_ads.is_connected:
            return Response({
                'success': False,
                'error': 'Meta Ads not connected'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        result = meta_ads.create_campaign(campaign_data)
        
        if result['success']:
            # Save campaign to database
            package_id = campaign_data.get('package_id')
            package = None
            
            if package_id:
                try:
                    package = TravelPackage.objects.get(id=package_id, tenant_id=tenant_id)
                except TravelPackage.DoesNotExist:
                    pass
            
            campaign = MetaAdsCampaign.objects.create(
                tenant_id=tenant_id,
                package=package,
                campaign_id=result.get('campaign_id'),
                campaign_name=result.get('campaign_name'),
                status='active',
                budget=campaign_data.get('budget', 0),
                start_date=timezone.now()
            )
            
            return Response({
                'success': True,
                'campaign': {
                    'id': campaign.id,
                    'campaign_id': campaign.campaign_id,
                    'campaign_name': campaign.campaign_name,
                    'status': campaign.status
                }
            })
        
        return Response(result, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def promote_package(self, request):
        """Quick campaign creation for a package"""
        tenant_id = request.user.tenant_id
        package_id = request.data.get('package_id')
        budget = request.data.get('budget')
        duration_days = request.data.get('duration_days', 7)
        
        if not package_id or not budget:
            return Response({
                'success': False,
                'error': 'package_id and budget are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            package = TravelPackage.objects.get(id=package_id, tenant_id=tenant_id)
        except TravelPackage.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Package not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        manager = IntegrationManager(tenant_id)
        meta_ads = manager.get_integration('meta_ads')
        
        if not meta_ads or not meta_ads.is_connected:
            return Response({
                'success': False,
                'error': 'Meta Ads not connected'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        package_data = {
            'id': str(package.id),
            'name': package.name,
            'description': package.description,
            'base_price': str(package.base_price),
            'duration': package.duration,
            'destination': package.destination
        }
        
        result = meta_ads.create_package_campaign(package_data, float(budget), duration_days)
        
        if result['success']:
            # Save to database
            campaign = MetaAdsCampaign.objects.create(
                tenant_id=tenant_id,
                package=package,
                campaign_id=result.get('campaign_id'),
                campaign_name=result.get('campaign_name'),
                status='active',
                budget=budget,
                start_date=timezone.now()
            )
            
            return Response({
                'success': True,
                'campaign': {
                    'id': campaign.id,
                    'campaign_id': campaign.campaign_id,
                    'campaign_name': campaign.campaign_name
                }
            })
        
        return Response(result, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def campaigns(self, request):
        """Get all campaigns for tenant"""
        tenant_id = request.user.tenant_id
        
        campaigns = MetaAdsCampaign.objects.filter(tenant_id=tenant_id).order_by('-created_at')
        
        campaigns_list = []
        for campaign in campaigns:
            campaigns_list.append({
                'id': campaign.id,
                'campaign_id': campaign.campaign_id,
                'campaign_name': campaign.campaign_name,
                'status': campaign.status,
                'budget': float(campaign.budget),
                'spend': float(campaign.spend),
                'impressions': campaign.impressions,
                'clicks': campaign.clicks,
                'conversions': campaign.conversions,
                'revenue': float(campaign.revenue),
                'roi': float(campaign.roi),
                'package_name': campaign.package.name if campaign.package else None,
                'start_date': campaign.start_date,
                'created_at': campaign.created_at
            })
        
        return Response({
            'success': True,
            'campaigns': campaigns_list
        })
    
    @action(detail=True, methods=['get'])
    def performance(self, request, pk=None):
        """Get campaign performance"""
        tenant_id = request.user.tenant_id
        
        try:
            campaign = MetaAdsCampaign.objects.get(id=pk, tenant_id=tenant_id)
        except MetaAdsCampaign.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Campaign not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        manager = IntegrationManager(tenant_id)
        meta_ads = manager.get_integration('meta_ads')
        
        if not meta_ads or not meta_ads.is_connected:
            return Response({
                'success': False,
                'error': 'Meta Ads not connected'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        result = meta_ads.get_campaign_performance(campaign.campaign_id)
        
        if result['success']:
            # Update database with latest performance
            performance = result['performance']
            campaign.spend = performance.get('spend', 0)
            campaign.impressions = performance.get('impressions', 0)
            campaign.clicks = performance.get('clicks', 0)
            campaign.conversions = performance.get('conversions', 0)
            campaign.revenue = performance.get('revenue', 0)
            campaign.roi = performance.get('roi', 0)
            campaign.status = performance.get('status', campaign.status)
            campaign.save()
        
        return Response(result)
    
    @action(detail=True, methods=['post'])
    def pause(self, request, pk=None):
        """Pause a campaign"""
        tenant_id = request.user.tenant_id
        
        try:
            campaign = MetaAdsCampaign.objects.get(id=pk, tenant_id=tenant_id)
        except MetaAdsCampaign.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Campaign not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        manager = IntegrationManager(tenant_id)
        meta_ads = manager.get_integration('meta_ads')
        
        if not meta_ads or not meta_ads.is_connected:
            return Response({
                'success': False,
                'error': 'Meta Ads not connected'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        result = meta_ads.pause_campaign(campaign.campaign_id)
        
        if result['success']:
            campaign.status = 'paused'
            campaign.save()
        
        return Response(result)
    
    @action(detail=True, methods=['post'])
    def resume(self, request, pk=None):
        """Resume a paused campaign"""
        tenant_id = request.user.tenant_id
        
        try:
            campaign = MetaAdsCampaign.objects.get(id=pk, tenant_id=tenant_id)
        except MetaAdsCampaign.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Campaign not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        manager = IntegrationManager(tenant_id)
        meta_ads = manager.get_integration('meta_ads')
        
        if not meta_ads or not meta_ads.is_connected:
            return Response({
                'success': False,
                'error': 'Meta Ads not connected'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        result = meta_ads.resume_campaign(campaign.campaign_id)
        
        if result['success']:
            campaign.status = 'active'
            campaign.save()
        
        return Response(result)
    
    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """Get Meta Ads analytics"""
        tenant_id = request.user.tenant_id
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if not start_date or not end_date:
            return Response({
                'success': False,
                'error': 'start_date and end_date are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        manager = IntegrationManager(tenant_id)
        meta_ads = manager.get_integration('meta_ads')
        
        if not meta_ads or not meta_ads.is_connected:
            return Response({
                'success': False,
                'error': 'Meta Ads not connected'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        result = meta_ads.get_analytics(start_date, end_date)
        
        return Response(result)
    
    @action(detail=False, methods=['get'])
    def recommendations(self, request):
        """Get AI recommendations for campaigns"""
        tenant_id = request.user.tenant_id
        campaign_id = request.query_params.get('campaign_id')
        
        manager = IntegrationManager(tenant_id)
        meta_ads = manager.get_integration('meta_ads')
        
        if not meta_ads or not meta_ads.is_connected:
            return Response({
                'success': False,
                'error': 'Meta Ads not connected'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        result = meta_ads.get_ai_recommendations(campaign_id)
        
        return Response(result)
