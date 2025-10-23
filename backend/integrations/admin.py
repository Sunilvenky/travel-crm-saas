from django.contrib import admin
from core.models import Integration, MetaAdsCampaign, WhatsAppConversation

@admin.register(Integration)
class IntegrationAdmin(admin.ModelAdmin):
    list_display = ['tenant', 'integration_type', 'is_active', 'last_synced_at', 'created_at']
    list_filter = ['integration_type', 'is_active']
    search_fields = ['tenant__name']
    readonly_fields = ['created_at', 'updated_at']

@admin.register(WhatsAppConversation)
class WhatsAppConversationAdmin(admin.ModelAdmin):
    list_display = ['phone_number', 'lead', 'customer', 'sentiment_label', 'message_count', 'last_message_at']
    list_filter = ['sentiment_label', 'is_active']
    search_fields = ['phone_number', 'conversation_id']
    readonly_fields = ['created_at', 'updated_at']

@admin.register(MetaAdsCampaign)
class MetaAdsCampaignAdmin(admin.ModelAdmin):
    list_display = ['campaign_name', 'package', 'status', 'budget', 'spend', 'conversions', 'roi']
    list_filter = ['status']
    search_fields = ['campaign_name', 'campaign_id']
    readonly_fields = ['created_at', 'updated_at']
