from rest_framework import serializers
from core.models import Integration, MetaAdsCampaign, WhatsAppConversation

class IntegrationSerializer(serializers.ModelSerializer):
    integration_type_display = serializers.CharField(source='get_integration_type_display', read_only=True)
    
    class Meta:
        model = Integration
        fields = [
            'id', 'tenant', 'integration_type', 'integration_type_display',
            'is_active', 'credentials', 'settings',
            'last_synced_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'last_synced_at']
        extra_kwargs = {
            'credentials': {'write_only': True}  # Don't expose credentials in responses
        }

class WhatsAppConversationSerializer(serializers.ModelSerializer):
    lead_name = serializers.CharField(source='lead.name', read_only=True)
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    
    class Meta:
        model = WhatsAppConversation
        fields = [
            'id', 'tenant', 'lead', 'lead_name', 'customer', 'customer_name',
            'conversation_id', 'phone_number', 'last_message_at', 'message_count',
            'sentiment_score', 'sentiment_label', 'intent', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class MetaAdsCampaignSerializer(serializers.ModelSerializer):
    package_name = serializers.CharField(source='package.name', read_only=True)
    
    class Meta:
        model = MetaAdsCampaign
        fields = [
            'id', 'tenant', 'package', 'package_name', 'campaign_id', 'campaign_name',
            'status', 'budget', 'spend', 'impressions', 'clicks', 'conversions',
            'revenue', 'roi', 'start_date', 'end_date', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
