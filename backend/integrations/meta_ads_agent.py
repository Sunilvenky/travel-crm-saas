"""
Meta Ads Agent Integration
Connects to your custom Meta Ads agent API for campaign management
"""
from typing import Dict, Any, List, Optional
from .base import BaseIntegration
from core.models import Lead
from django.utils import timezone
import json


class MetaAdsAgentIntegration(BaseIntegration):
    """Integration with custom Meta Ads Agent"""
    
    def __init__(self, tenant_id: str):
        super().__init__(tenant_id)
        self.integration_name = "Meta Ads Agent"
        self.ad_account_id = None
    
    def connect(self, credentials: Dict[str, Any]) -> bool:
        """
        Connect to Meta Ads Agent API
        credentials should contain: api_url, api_key, ad_account_id
        """
        try:
            self.api_url = credentials.get('api_url')
            self.api_key = credentials.get('api_key')
            self.ad_account_id = credentials.get('ad_account_id')
            
            # Test the connection
            test_result = self.test_connection()
            
            if test_result['success']:
                self.is_connected = True
                self.log_activity('connected', {
                    'tenant_id': self.tenant_id,
                    'ad_account_id': self.ad_account_id
                })
                return True
            else:
                return False
                
        except Exception as e:
            self.log_activity('connection_failed', {'error': str(e)})
            return False
    
    def disconnect(self) -> bool:
        """Disconnect from Meta Ads Agent"""
        self.is_connected = False
        self.api_key = None
        self.ad_account_id = None
        self.log_activity('disconnected', {'tenant_id': self.tenant_id})
        return True
    
    def test_connection(self) -> Dict[str, Any]:
        """Test connection to Meta Ads Agent API"""
        result = self.make_request('GET', '/health')
        
        if result['success']:
            return {
                'success': True,
                'message': 'Meta Ads Agent connected successfully',
                'account_info': result.get('data', {})
            }
        else:
            return {
                'success': False,
                'message': f"Connection failed: {result.get('error', 'Unknown error')}"
            }
    
    def sync_data(self) -> Dict[str, Any]:
        """
        Sync campaign data and leads from Meta Ads
        """
        try:
            # Fetch active campaigns
            result = self.make_request('GET', '/campaigns', params={
                'ad_account_id': self.ad_account_id,
                'status': 'active'
            })
            
            if not result['success']:
                return {'success': False, 'error': result.get('error')}
            
            campaigns = result.get('data', {}).get('campaigns', [])
            
            # Sync leads from campaigns
            synced_leads = 0
            for campaign in campaigns:
                lead_count = self._sync_campaign_leads(campaign['id'])
                synced_leads += lead_count
            
            return {
                'success': True,
                'synced_campaigns': len(campaigns),
                'synced_leads': synced_leads,
                'message': f'Synced {len(campaigns)} campaigns and {synced_leads} leads'
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def create_campaign(self, campaign_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new Meta Ads campaign
        
        Args:
            campaign_data: {
                'name': 'Campaign Name',
                'objective': 'LEAD_GENERATION',
                'budget': 100,
                'package_id': 'uuid',
                'package_name': 'Maldives Luxury',
                'package_description': '...',
                'package_price': '2500',
                'package_image_url': 'https://...',
                'target_audience': {...},
                'ad_creative': {...},
                'duration_days': 7
            }
        """
        payload = {
            'ad_account_id': self.ad_account_id,
            'tenant_id': self.tenant_id,
            **campaign_data
        }
        
        result = self.make_request('POST', '/campaigns/create', data=payload)
        
        if result['success']:
            campaign_id = result.get('data', {}).get('campaign_id')
            self.log_activity('campaign_created', {
                'campaign_id': campaign_id,
                'campaign_name': campaign_data.get('name'),
                'package_id': campaign_data.get('package_id'),
                'budget': campaign_data.get('budget')
            })
            
            return {
                'success': True,
                'campaign_id': campaign_id,
                'campaign_name': campaign_data.get('name'),
                'message': 'Campaign created successfully',
                'campaign_data': result.get('data')
            }
        
        return result
    
    def create_package_campaign(self, package_data: Dict[str, Any], budget: float, duration_days: int = 7) -> Dict[str, Any]:
        """
        Quick campaign creation for a travel package
        Uses AI to generate optimal ad creative and targeting
        """
        campaign_data = {
            'name': f"{package_data['name']} - {timezone.now().strftime('%Y-%m-%d')}",
            'objective': 'CONVERSIONS',
            'budget': budget,
            'package_id': package_data['id'],
            'package_name': package_data['name'],
            'package_description': package_data.get('description', ''),
            'package_price': package_data['base_price'],
            'package_image_url': package_data.get('image_url', ''),
            'package_destination': package_data.get('destination', ''),
            'package_duration': package_data.get('duration', 0),
            'duration_days': duration_days,
            'auto_optimize': True  # Let Meta Ads Agent AI optimize
        }
        
        return self.create_campaign(campaign_data)
    
    def get_campaign_performance(self, campaign_id: str) -> Dict[str, Any]:
        """
        Get real-time performance metrics for a campaign
        """
        result = self.make_request('GET', f'/campaigns/{campaign_id}/performance')
        
        if result['success']:
            performance = result.get('data', {})
            return {
                'success': True,
                'performance': {
                    'impressions': performance.get('impressions', 0),
                    'clicks': performance.get('clicks', 0),
                    'ctr': performance.get('ctr', 0),  # Click-through rate
                    'conversions': performance.get('conversions', 0),
                    'cost_per_click': performance.get('cost_per_click', 0),
                    'cost_per_conversion': performance.get('cost_per_conversion', 0),
                    'spend': performance.get('spend', 0),
                    'revenue': performance.get('revenue', 0),
                    'roi': performance.get('roi', 0),  # Return on investment
                    'status': performance.get('status'),
                    'reach': performance.get('reach', 0),
                    'frequency': performance.get('frequency', 0)
                }
            }
        
        return result
    
    def get_all_campaigns_performance(self) -> Dict[str, Any]:
        """
        Get performance summary for all campaigns
        """
        result = self.make_request('GET', '/campaigns/performance-summary', params={
            'ad_account_id': self.ad_account_id
        })
        
        if result['success']:
            return {
                'success': True,
                'campaigns': result.get('data', {}).get('campaigns', []),
                'totals': result.get('data', {}).get('totals', {})
            }
        
        return result
    
    def pause_campaign(self, campaign_id: str) -> Dict[str, Any]:
        """Pause an active campaign"""
        result = self.make_request('POST', f'/campaigns/{campaign_id}/pause')
        
        if result['success']:
            self.log_activity('campaign_paused', {'campaign_id': campaign_id})
        
        return result
    
    def resume_campaign(self, campaign_id: str) -> Dict[str, Any]:
        """Resume a paused campaign"""
        result = self.make_request('POST', f'/campaigns/{campaign_id}/resume')
        
        if result['success']:
            self.log_activity('campaign_resumed', {'campaign_id': campaign_id})
        
        return result
    
    def update_campaign_budget(self, campaign_id: str, new_budget: float) -> Dict[str, Any]:
        """Update campaign budget"""
        result = self.make_request('POST', f'/campaigns/{campaign_id}/budget', data={
            'budget': new_budget
        })
        
        if result['success']:
            self.log_activity('budget_updated', {
                'campaign_id': campaign_id,
                'new_budget': new_budget
            })
        
        return result
    
    def get_campaign_leads(self, campaign_id: str) -> Dict[str, Any]:
        """
        Get leads generated by a specific campaign
        """
        result = self.make_request('GET', f'/campaigns/{campaign_id}/leads')
        
        if result['success']:
            return {
                'success': True,
                'leads': result.get('data', {}).get('leads', []),
                'total_leads': result.get('data', {}).get('total_leads', 0)
            }
        
        return result
    
    def get_ai_recommendations(self, campaign_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Get AI-powered recommendations for campaign optimization
        """
        params = {'ad_account_id': self.ad_account_id}
        
        if campaign_id:
            params['campaign_id'] = campaign_id
        
        result = self.make_request('GET', '/ai/recommendations', params=params)
        
        if result['success']:
            recommendations = result.get('data', {}).get('recommendations', [])
            return {
                'success': True,
                'recommendations': recommendations
                # Example recommendations:
                # [
                #     {
                #         'type': 'budget_increase',
                #         'campaign_id': '...',
                #         'current_budget': 100,
                #         'suggested_budget': 150,
                #         'expected_roi_increase': 25,
                #         'confidence': 0.87,
                #         'reason': 'Campaign showing high engagement...'
                #     },
                #     {
                #         'type': 'pause_campaign',
                #         'campaign_id': '...',
                #         'reason': 'Low CTR, wasting budget'
                #     }
                # ]
            }
        
        return result
    
    def get_audience_insights(self, package_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Get audience insights and targeting suggestions
        Optionally for a specific package
        """
        params = {'ad_account_id': self.ad_account_id}
        
        if package_id:
            params['package_id'] = package_id
        
        result = self.make_request('GET', '/ai/audience-insights', params=params)
        
        if result['success']:
            insights = result.get('data', {})
            return {
                'success': True,
                'insights': {
                    'top_demographics': insights.get('top_demographics', {}),
                    'best_locations': insights.get('best_locations', []),
                    'optimal_age_range': insights.get('optimal_age_range', {}),
                    'interests': insights.get('interests', []),
                    'best_time_to_run': insights.get('best_time_to_run', {}),
                    'suggested_budget': insights.get('suggested_budget', 0),
                    'expected_reach': insights.get('expected_reach', 0),
                    'estimated_conversions': insights.get('estimated_conversions', 0)
                }
            }
        
        return result
    
    def generate_ad_creative(self, package_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Use AI to generate ad creative (headlines, descriptions, CTAs)
        for a travel package
        """
        result = self.make_request('POST', '/ai/generate-creative', data={
            'package_name': package_data['name'],
            'package_description': package_data.get('description', ''),
            'package_price': package_data['base_price'],
            'destination': package_data.get('destination', ''),
            'duration': package_data.get('duration', 0),
            'package_type': package_data.get('type', 'standard')
        })
        
        if result['success']:
            creative = result.get('data', {})
            return {
                'success': True,
                'creative': {
                    'headlines': creative.get('headlines', []),  # Multiple headline options
                    'descriptions': creative.get('descriptions', []),
                    'ctas': creative.get('ctas', []),  # Call-to-action buttons
                    'hashtags': creative.get('hashtags', []),
                    'image_suggestions': creative.get('image_suggestions', [])
                }
            }
        
        return result
    
    def get_analytics(self, start_date: str, end_date: str) -> Dict[str, Any]:
        """
        Get comprehensive analytics for date range
        """
        result = self.make_request('GET', '/analytics', params={
            'ad_account_id': self.ad_account_id,
            'start_date': start_date,
            'end_date': end_date
        })
        
        if result['success']:
            analytics = result.get('data', {})
            return {
                'success': True,
                'analytics': {
                    'total_spend': analytics.get('total_spend', 0),
                    'total_revenue': analytics.get('total_revenue', 0),
                    'total_roi': analytics.get('total_roi', 0),
                    'total_leads': analytics.get('total_leads', 0),
                    'total_conversions': analytics.get('total_conversions', 0),
                    'avg_cost_per_lead': analytics.get('avg_cost_per_lead', 0),
                    'avg_cost_per_conversion': analytics.get('avg_cost_per_conversion', 0),
                    'campaign_breakdown': analytics.get('campaign_breakdown', []),
                    'daily_performance': analytics.get('daily_performance', [])
                }
            }
        
        return result
    
    def _sync_campaign_leads(self, campaign_id: str) -> int:
        """
        Sync leads from a specific campaign to CRM
        """
        try:
            leads_result = self.get_campaign_leads(campaign_id)
            
            if not leads_result['success']:
                return 0
            
            leads_data = leads_result['leads']
            synced_count = 0
            
            for lead_data in leads_data:
                # Create or update lead in CRM
                lead, created = Lead.objects.update_or_create(
                    tenant_id=self.tenant_id,
                    email=lead_data.get('email'),
                    defaults={
                        'name': lead_data.get('name', 'Meta Ads Lead'),
                        'phone': lead_data.get('phone', ''),
                        'source': 'meta_ads',
                        'status': 'new',
                        'notes': f"Generated from Meta Ads campaign: {campaign_id}",
                        'metadata': json.dumps({
                            'campaign_id': campaign_id,
                            'ad_id': lead_data.get('ad_id'),
                            'ad_name': lead_data.get('ad_name'),
                            'cost_per_lead': lead_data.get('cost_per_lead')
                        })
                    }
                )
                
                synced_count += 1
            
            self.log_activity('leads_synced', {
                'campaign_id': campaign_id,
                'count': synced_count
            })
            
            return synced_count
            
        except Exception as e:
            self.log_activity('sync_leads_error', {
                'campaign_id': campaign_id,
                'error': str(e)
            })
            return 0
