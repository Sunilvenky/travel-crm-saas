"""
WhatsApp Agent Integration
Connects to your custom WhatsApp ML-powered agent API
"""
from typing import Dict, Any, List, Optional
from .base import BaseIntegration
from core.models import Lead, Customer, Communication
from django.utils import timezone
import json


class WhatsAppAgentIntegration(BaseIntegration):
    """Integration with custom WhatsApp Agent (ML-powered)"""
    
    def __init__(self, tenant_id: str):
        super().__init__(tenant_id)
        self.integration_name = "WhatsApp Agent"
    
    def connect(self, credentials: Dict[str, Any]) -> bool:
        """
        Connect to WhatsApp Agent API
        credentials should contain: api_url, api_key
        """
        try:
            self.api_url = credentials.get('api_url')
            self.api_key = credentials.get('api_key')
            
            # Test the connection
            test_result = self.test_connection()
            
            if test_result['success']:
                self.is_connected = True
                self.log_activity('connected', {'tenant_id': self.tenant_id})
                return True
            else:
                return False
                
        except Exception as e:
            self.log_activity('connection_failed', {'error': str(e)})
            return False
    
    def disconnect(self) -> bool:
        """Disconnect from WhatsApp Agent"""
        self.is_connected = False
        self.api_key = None
        self.log_activity('disconnected', {'tenant_id': self.tenant_id})
        return True
    
    def test_connection(self) -> Dict[str, Any]:
        """Test connection to WhatsApp Agent API"""
        result = self.make_request('GET', '/health')
        
        if result['success']:
            return {
                'success': True,
                'message': 'WhatsApp Agent connected successfully',
                'agent_status': result.get('data', {})
            }
        else:
            return {
                'success': False,
                'message': f"Connection failed: {result.get('error', 'Unknown error')}"
            }
    
    def sync_data(self) -> Dict[str, Any]:
        """
        Sync recent WhatsApp conversations to CRM
        """
        try:
            # Fetch recent conversations from WhatsApp Agent
            result = self.make_request('GET', '/conversations/recent', params={'days': 30})
            
            if not result['success']:
                return {'success': False, 'error': result.get('error')}
            
            conversations = result.get('data', {}).get('conversations', [])
            synced_count = 0
            
            for conversation in conversations:
                # Process each conversation
                self._process_conversation(conversation)
                synced_count += 1
            
            return {
                'success': True,
                'synced_conversations': synced_count,
                'message': f'Synced {synced_count} conversations'
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def send_message(
        self, 
        phone_number: str, 
        message: str, 
        template_name: Optional[str] = None,
        template_params: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Send WhatsApp message to customer
        
        Args:
            phone_number: Recipient phone number
            message: Message text (if not using template)
            template_name: WhatsApp template name (optional)
            template_params: Template parameters (optional)
        """
        payload = {
            'phone_number': phone_number,
            'tenant_id': self.tenant_id
        }
        
        if template_name:
            payload['template'] = {
                'name': template_name,
                'params': template_params or {}
            }
        else:
            payload['message'] = message
        
        result = self.make_request('POST', '/messages/send', data=payload)
        
        if result['success']:
            self.log_activity('message_sent', {
                'phone_number': phone_number,
                'message_id': result.get('data', {}).get('message_id')
            })
        
        return result
    
    def send_package_details(self, phone_number: str, package_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Send travel package details via WhatsApp
        Uses formatted template with package information
        """
        payload = {
            'phone_number': phone_number,
            'tenant_id': self.tenant_id,
            'type': 'package_share',
            'package': package_data
        }
        
        result = self.make_request('POST', '/messages/send-package', data=payload)
        
        if result['success']:
            self.log_activity('package_shared', {
                'phone_number': phone_number,
                'package_id': package_data.get('id'),
                'package_name': package_data.get('name')
            })
        
        return result
    
    def get_conversation_sentiment(self, conversation_id: str) -> Dict[str, Any]:
        """
        Get ML-powered sentiment analysis for a conversation
        Returns sentiment score and classification
        """
        result = self.make_request('GET', f'/conversations/{conversation_id}/sentiment')
        
        if result['success']:
            sentiment_data = result.get('data', {})
            return {
                'success': True,
                'sentiment': sentiment_data.get('sentiment'),  # positive, neutral, negative
                'score': sentiment_data.get('score'),  # -1.0 to 1.0
                'confidence': sentiment_data.get('confidence')  # 0.0 to 1.0
            }
        
        return result
    
    def extract_lead_info(self, conversation_id: str) -> Dict[str, Any]:
        """
        Use ML to extract lead information from conversation
        Returns structured data: name, destination, budget, travel dates, etc.
        """
        result = self.make_request('GET', f'/conversations/{conversation_id}/extract-lead')
        
        if result['success']:
            lead_data = result.get('data', {})
            return {
                'success': True,
                'extracted_data': {
                    'name': lead_data.get('name'),
                    'phone_number': lead_data.get('phone_number'),
                    'destination': lead_data.get('destination'),
                    'budget': lead_data.get('budget'),
                    'travel_dates': lead_data.get('travel_dates'),
                    'travelers_count': lead_data.get('travelers_count'),
                    'preferences': lead_data.get('preferences', []),
                    'intent_score': lead_data.get('intent_score'),  # 0-100
                    'urgency': lead_data.get('urgency')  # high, medium, low
                }
            }
        
        return result
    
    def get_conversation_insights(self, conversation_id: str) -> Dict[str, Any]:
        """
        Get AI-powered insights about a conversation
        Includes intent detection, keywords, recommendations
        """
        result = self.make_request('GET', f'/conversations/{conversation_id}/insights')
        
        if result['success']:
            insights = result.get('data', {})
            return {
                'success': True,
                'insights': {
                    'primary_intent': insights.get('primary_intent'),  # booking, inquiry, complaint, etc.
                    'keywords': insights.get('keywords', []),
                    'topics': insights.get('topics', []),
                    'customer_mood': insights.get('customer_mood'),
                    'recommended_action': insights.get('recommended_action'),
                    'suggested_response': insights.get('suggested_response'),
                    'package_recommendations': insights.get('package_recommendations', [])
                }
            }
        
        return result
    
    def broadcast_message(
        self, 
        phone_numbers: List[str], 
        message: str,
        template_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Broadcast message to multiple contacts
        Useful for promotional campaigns
        """
        payload = {
            'phone_numbers': phone_numbers,
            'tenant_id': self.tenant_id,
            'message': message
        }
        
        if template_name:
            payload['template_name'] = template_name
        
        result = self.make_request('POST', '/messages/broadcast', data=payload)
        
        if result['success']:
            self.log_activity('broadcast_sent', {
                'recipient_count': len(phone_numbers),
                'message_id': result.get('data', {}).get('broadcast_id')
            })
        
        return result
    
    def _process_conversation(self, conversation_data: Dict[str, Any]):
        """
        Process a conversation and create/update lead in CRM
        """
        try:
            phone_number = conversation_data.get('phone_number')
            
            # Extract lead information using ML
            extracted = self.extract_lead_info(conversation_data.get('id'))
            
            if extracted['success']:
                lead_data = extracted['extracted_data']
                
                # Check if lead already exists
                lead, created = Lead.objects.get_or_create(
                    tenant_id=self.tenant_id,
                    phone=phone_number,
                    defaults={
                        'name': lead_data.get('name', 'WhatsApp Lead'),
                        'email': lead_data.get('email', ''),
                        'source': 'whatsapp',
                        'status': 'new',
                        'budget': lead_data.get('budget'),
                        'notes': f"Auto-created from WhatsApp conversation. Intent score: {lead_data.get('intent_score')}"
                    }
                )
                
                # Create communication record
                Communication.objects.create(
                    tenant_id=self.tenant_id,
                    lead=lead,
                    type='whatsapp',
                    direction='inbound',
                    subject=f"WhatsApp conversation",
                    body=json.dumps(conversation_data),
                    created_at=timezone.now()
                )
                
                self.log_activity('lead_processed', {
                    'lead_id': str(lead.id),
                    'created': created,
                    'phone_number': phone_number
                })
                
        except Exception as e:
            self.log_activity('process_conversation_error', {'error': str(e)})
    
    def get_analytics(self, start_date: str, end_date: str) -> Dict[str, Any]:
        """
        Get WhatsApp analytics from the agent
        """
        result = self.make_request('GET', '/analytics', params={
            'start_date': start_date,
            'end_date': end_date,
            'tenant_id': self.tenant_id
        })
        
        if result['success']:
            analytics = result.get('data', {})
            return {
                'success': True,
                'analytics': {
                    'total_conversations': analytics.get('total_conversations'),
                    'total_messages': analytics.get('total_messages'),
                    'avg_response_time': analytics.get('avg_response_time'),
                    'sentiment_distribution': analytics.get('sentiment_distribution', {}),
                    'top_intents': analytics.get('top_intents', []),
                    'conversion_rate': analytics.get('conversion_rate'),
                    'leads_generated': analytics.get('leads_generated')
                }
            }
        
        return result
