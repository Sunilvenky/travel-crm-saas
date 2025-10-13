from django.contrib import admin
from .models import Tenant, User, Lead, Customer, Deal, Communication, TravelPackage, Booking

admin.site.register(Tenant)
admin.site.register(User)
admin.site.register(Lead)
admin.site.register(Customer)
admin.site.register(Deal)
admin.site.register(Communication)
admin.site.register(TravelPackage)
admin.site.register(Booking)
