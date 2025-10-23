from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager

class Tenant(models.Model):
    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=255)
    domain = models.CharField(max_length=255, unique=True)
    subscription_tier = models.CharField(max_length=100)
    settings = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Users must have an email address')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [
        ('ADMIN', 'Admin'),
        ('MANAGER', 'Manager'),
        ('AGENT', 'Agent'),
        ('VIEWER', 'Viewer'),
    ]
    id = models.BigAutoField(primary_key=True)
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=100, null=True, blank=True)
    last_name = models.CharField(max_length=100, null=True, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='AGENT')
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='users')
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    last_login = models.DateTimeField(null=True, blank=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.email


class Lead(models.Model):
    STATUS_CHOICES = [
        ('new', 'New'),
        ('contacted', 'Contacted'),
        ('qualified', 'Qualified'),
        ('lost', 'Lost'),
    ]
    id = models.BigAutoField(primary_key=True)
    email = models.EmailField(null=True, blank=True)
    phone = models.CharField(max_length=50, null=True, blank=True)
    first_name = models.CharField(max_length=100, null=True, blank=True)
    last_name = models.CharField(max_length=100, null=True, blank=True)
    source = models.CharField(max_length=100, null=True, blank=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='new')
    score = models.IntegerField(default=0)
    assigned_to = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE)
    travel_dates = models.CharField(max_length=255, null=True, blank=True)
    destination = models.CharField(max_length=255, null=True, blank=True)
    budget = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    adults = models.IntegerField(default=1)
    children = models.IntegerField(default=0)
    notes = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Customer(models.Model):
    id = models.BigAutoField(primary_key=True)
    lead = models.ForeignKey(Lead, null=True, blank=True, on_delete=models.SET_NULL)
    customer_type = models.CharField(max_length=100, null=True, blank=True)
    loyalty_level = models.CharField(max_length=100, null=True, blank=True)
    total_spent = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    last_booking_date = models.DateTimeField(null=True, blank=True)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE)


class Deal(models.Model):
    id = models.BigAutoField(primary_key=True)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    value = models.DecimalField(max_digits=12, decimal_places=2)
    stage = models.CharField(max_length=100)
    probability = models.IntegerField(null=True, blank=True)
    expected_close_date = models.DateTimeField(null=True, blank=True)
    assigned_to = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE)


class Communication(models.Model):
    id = models.BigAutoField(primary_key=True)
    customer = models.ForeignKey(Customer, null=True, blank=True, on_delete=models.SET_NULL)
    type = models.CharField(max_length=50)
    subject = models.CharField(max_length=255, null=True, blank=True)
    content = models.TextField(null=True, blank=True)
    sent_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=50)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE)


class TravelPackage(models.Model):
    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    base_price = models.DecimalField(max_digits=12, decimal_places=2)
    duration = models.IntegerField()
    destination = models.CharField(max_length=255)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE)


class Booking(models.Model):
    id = models.BigAutoField(primary_key=True)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE)
    package = models.ForeignKey(TravelPackage, on_delete=models.CASCADE)
    status = models.CharField(max_length=100)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    travel_date = models.DateTimeField()
    pax_count = models.IntegerField()
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE)


class Integration(models.Model):
    """Store integration configurations for each tenant"""
    INTEGRATION_TYPES = [
        ('whatsapp', 'WhatsApp Agent'),
        ('meta_ads', 'Meta Ads Agent'),
        ('salesforce', 'Salesforce'),
        ('stripe', 'Stripe'),
        ('sendgrid', 'SendGrid'),
    ]
    
    id = models.BigAutoField(primary_key=True)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='integrations')
    integration_type = models.CharField(max_length=50, choices=INTEGRATION_TYPES)
    is_active = models.BooleanField(default=False)
    credentials = models.JSONField()  # Encrypted credentials
    settings = models.JSONField(null=True, blank=True)  # Additional settings
    last_synced_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('tenant', 'integration_type')
    
    def __str__(self):
        return f"{self.tenant.name} - {self.get_integration_type_display()}"


class MetaAdsCampaign(models.Model):
    """Track Meta Ads campaigns created from CRM"""
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('paused', 'Paused'),
        ('completed', 'Completed'),
        ('draft', 'Draft'),
    ]
    
    id = models.BigAutoField(primary_key=True)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE)
    package = models.ForeignKey(TravelPackage, null=True, blank=True, on_delete=models.SET_NULL)
    campaign_id = models.CharField(max_length=255)  # ID from Meta Ads Agent
    campaign_name = models.CharField(max_length=255)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='draft')
    budget = models.DecimalField(max_digits=12, decimal_places=2)
    spend = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    impressions = models.BigIntegerField(default=0)
    clicks = models.BigIntegerField(default=0)
    conversions = models.IntegerField(default=0)
    revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    roi = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.campaign_name} ({self.status})"


class WhatsAppConversation(models.Model):
    """Track WhatsApp conversations"""
    id = models.BigAutoField(primary_key=True)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE)
    lead = models.ForeignKey(Lead, null=True, blank=True, on_delete=models.SET_NULL)
    customer = models.ForeignKey(Customer, null=True, blank=True, on_delete=models.SET_NULL)
    conversation_id = models.CharField(max_length=255)  # ID from WhatsApp Agent
    phone_number = models.CharField(max_length=50)
    last_message_at = models.DateTimeField()
    message_count = models.IntegerField(default=0)
    sentiment_score = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True)  # -1.0 to 1.0
    sentiment_label = models.CharField(max_length=20, null=True, blank=True)  # positive, neutral, negative
    intent = models.CharField(max_length=100, null=True, blank=True)  # booking, inquiry, complaint, etc.
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Conversation with {self.phone_number}"
