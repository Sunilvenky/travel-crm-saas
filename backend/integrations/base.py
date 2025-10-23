"""
Base Integration Class
All external integrations inherit from this base class
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import requests
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


class BaseIntegration(ABC):
    """Abstract base class for all external integrations"""
    
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
        self.api_key = None
        self.api_url = None
        self.is_connected = False
        
    @abstractmethod
    def connect(self, credentials: Dict[str, Any]) -> bool:
        """
        Connect to the external service
        Returns True if successful, False otherwise
        """
        pass
    
    @abstractmethod
    def disconnect(self) -> bool:
        """Disconnect from the external service"""
        pass
    
    @abstractmethod
    def test_connection(self) -> Dict[str, Any]:
        """
        Test the connection to external service
        Returns status and message
        """
        pass
    
    @abstractmethod
    def sync_data(self) -> Dict[str, Any]:
        """
        Sync data from external service to CRM
        Returns summary of synced data
        """
        pass
    
    def make_request(
        self, 
        method: str, 
        endpoint: str, 
        data: Optional[Dict] = None,
        params: Optional[Dict] = None,
        headers: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Make HTTP request to external API
        """
        try:
            url = f"{self.api_url}/{endpoint.lstrip('/')}"
            
            default_headers = {
                'Authorization': f'Bearer {self.api_key}',
                'Content-Type': 'application/json'
            }
            
            if headers:
                default_headers.update(headers)
            
            response = requests.request(
                method=method,
                url=url,
                json=data,
                params=params,
                headers=default_headers,
                timeout=30
            )
            
            response.raise_for_status()
            return {
                'success': True,
                'data': response.json() if response.content else {},
                'status_code': response.status_code
            }
            
        except requests.exceptions.RequestException as e:
            logger.error(f"API request failed: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'status_code': getattr(e.response, 'status_code', None) if hasattr(e, 'response') else None
            }
    
    def log_activity(self, activity_type: str, details: Dict[str, Any]):
        """Log integration activity for audit trail"""
        logger.info(f"[{self.__class__.__name__}] {activity_type}: {details}")
