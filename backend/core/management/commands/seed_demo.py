from django.core.management.base import BaseCommand
from core.models import Tenant, User, Lead, Customer, TravelPackage, Booking

class Command(BaseCommand):
    help = 'Seed demo data'

    def handle(self, *args, **options):
        tenant = Tenant.objects.create(name='Demo Travel Co', domain='demo.travelco', subscription_tier='starter', settings={'currency':'USD'})
        admin = User.objects.create_user(email='admin@demo.travelco', password='password123', role='ADMIN', tenant=tenant)
        agent = User.objects.create_user(email='agent@demo.travelco', password='password123', role='AGENT', tenant=tenant)
        lead = Lead.objects.create(email='lead1@example.com', first_name='Lead', last_name='One', source='web', tenant=tenant, destination='Hawaii', budget=3000)
        customer = Customer.objects.create(lead=lead, customer_type='individual', loyalty_level='bronze', tenant=tenant)
        pkg = TravelPackage.objects.create(name='7-Day Hawaii Escape', description='Relaxing beaches', base_price=2500, duration=7, destination='Hawaii', tenant=tenant)
        booking = Booking.objects.create(customer=customer, package=pkg, status='confirmed', total_amount=2500, travel_date='2025-08-20T00:00:00Z', pax_count=2, tenant=tenant)
        self.stdout.write(self.style.SUCCESS('Seeded demo data'))
