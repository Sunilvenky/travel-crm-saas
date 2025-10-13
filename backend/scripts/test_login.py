import os
import sys
import django

# ensure backend package is importable
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crm.settings')
os.environ.setdefault('USE_SQLITE', '1')
django.setup()

from django.test import Client

c = Client()
resp = c.post('/api/auth/token/', {'email': 'admin@demo.travelco', 'password': 'password123'}, content_type='application/json')
print('status', resp.status_code)
print(resp.content.decode())
