"""
Integration Manager
Orchestrates all external integrations
"""
from typing import Dict, Any, Optional
from .whatsapp_agent import WhatsAppAgentIntegration
from .meta_ads_agent import MetaAdsAgentIntegration


class IntegrationManager:
    """Central manager for all integrations"""
    
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
        self.integrations = {}
        
        # Initialize integrations
        self.integrations['whatsapp'] = WhatsAppAgentIntegration(tenant_id)
        self.integrations['meta_ads'] = MetaAdsAgentIntegration(tenant_id)
    
    def get_integration(self, integration_name: str):
        """Get integration instance by name"""
        return self.integrations.get(integration_name)
    
    def connect_integration(self, integration_name: str, credentials: Dict[str, Any]) -> Dict[str, Any]:
        """Connect to an integration"""
        integration = self.get_integration(integration_name)
        
        if not integration:
            return {
                'success': False,
                'error': f'Integration {integration_name} not found'
            }
        
        success = integration.connect(credentials)
        
        return {
            'success': success,
            'integration': integration_name,
            'message': f'{integration_name} connected successfully' if success else 'Connection failed'
        }
    
    def disconnect_integration(self, integration_name: str) -> Dict[str, Any]:
        """Disconnect from an integration"""
        integration = self.get_integration(integration_name)
        
        if not integration:
            return {
                'success': False,
                'error': f'Integration {integration_name} not found'
            }
        
        success = integration.disconnect()
        
        return {
            'success': success,
            'integration': integration_name
        }
    
    def test_integration(self, integration_name: str) -> Dict[str, Any]:
        """Test integration connection"""
        integration = self.get_integration(integration_name)
        
        if not integration:
            return {
                'success': False,
                'error': f'Integration {integration_name} not found'
            }
        
        return integration.test_connection()
    
    def sync_all_integrations(self) -> Dict[str, Any]:
        """Sync data from all connected integrations"""
        results = {}
        
        for name, integration in self.integrations.items():
            if integration.is_connected:
                results[name] = integration.sync_data()
            else:
                results[name] = {
                    'success': False,
                    'error': 'Integration not connected'
                }
        
        return results
    
    def get_integration_status(self) -> Dict[str, Any]:
        """Get connection status of all integrations"""
        status = {}
        
        for name, integration in self.integrations.items():
            status[name] = {
                'connected': integration.is_connected,
                'name': integration.integration_name
            }
        
        return status
