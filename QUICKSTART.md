# 🚀 Quick Start Guide - Travel CRM SaaS

## Prerequisites Checklist
- [ ] Python 3.9+ installed
- [ ] Node.js 16+ installed
- [ ] Git installed
- [ ] Code editor (VS Code recommended)

## 5-Minute Setup

### Step 1: Clone Repository (30 seconds)
```bash
git clone https://github.com/Sunilvenky/travel-crm-saas.git
cd travel-crm-saas
```

### Step 2: Backend Setup (2 minutes)
```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install django djangorestframework djangorestframework-simplejwt django-cors-headers

# Run migrations
python manage.py migrate

# Create superuser (follow prompts)
python manage.py createsuperuser

# Start Django server
python manage.py runserver
```

Backend will be available at: **http://127.0.0.1:8000**

### Step 3: Frontend Setup (2 minutes)
Open a NEW terminal window:

```bash
# Navigate to frontend
cd travel-crm-saas/frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will be available at: **http://localhost:3000**

### Step 4: Access the Application (30 seconds)
1. Open browser to: http://localhost:3000
2. Login with superuser credentials you created
3. Explore the features!

## 🎯 What to Test First

### 1. Dashboard (Main Page)
- View revenue trends (line chart)
- Check lead sources (pie chart)
- See stat cards with trends

### 2. AI Insights (`/ai-insights`)
- 🔥 View hot leads with scores
- ⚠️ Check churn risk alerts
- 💰 See revenue forecast
- View AI stats cards

### 3. Packages (`/packages`)
- Toggle between grid and table view
- See AI insights on package cards
- Click "📢 Promote" for Meta Ads
- Click "💬 Send" for WhatsApp

### 4. Ads Dashboard (`/ads-dashboard`)
- View campaign performance
- Check total stats (spend, impressions, clicks, ROI)
- See performance charts

### 5. Integrations (`/integrations`)
- Configure WhatsApp Agent
- Configure Meta Ads Agent
- Test connections

## 🧪 Testing ML Features

### Test Lead Scoring
1. Go to Leads page
2. Add a new lead with:
   - Budget: $3000
   - Source: WhatsApp
3. See the lead score badge appear

### Test Churn Prediction
1. Go to Customers page
2. View existing customers
3. Look for churn risk badges on at-risk customers

### Test Revenue Forecast
1. Go to AI Insights page
2. View the "Revenue Forecast" section
3. See expected revenue with confidence range

### Test Dynamic Pricing
1. Go to Packages page
2. View any package card
3. Look for AI-optimized pricing suggestions

## 🔧 Admin Panel
Access Django admin: **http://127.0.0.1:8000/admin**

Login with superuser credentials.

You can:
- Add sample leads
- Create customers
- Add packages
- View all data

## 📱 Navigation Menu
- 📊 **Dashboard** - Overview with charts
- 👥 **Leads** - Lead management
- 🤝 **Customers** - Customer management
- 💼 **Deals** - Deal pipeline
- 🎁 **Packages** - Package management
- 📅 **Bookings** - Booking management
- 📢 **Ads Dashboard** - Meta Ads campaigns
- 🧠 **AI Insights** - ML-powered insights
- 🔌 **Integrations** - WhatsApp & Meta Ads setup

## 🐛 Troubleshooting

### Backend Issues

**Problem**: `ModuleNotFoundError`
```bash
# Solution: Make sure virtual environment is activated
venv\Scripts\activate  # Windows
source venv/bin/activate  # Mac/Linux

# Then reinstall
pip install django djangorestframework djangorestframework-simplejwt django-cors-headers
```

**Problem**: `Database is locked`
```bash
# Solution: Close other Django processes
# Then run:
python manage.py migrate --run-syncdb
```

**Problem**: Port 8000 already in use
```bash
# Solution: Run on different port
python manage.py runserver 8001
# Update frontend API URL in src/api.ts to http://127.0.0.1:8001
```

### Frontend Issues

**Problem**: `npm install` fails
```bash
# Solution: Clear cache and retry
npm cache clean --force
npm install
```

**Problem**: Port 3000 already in use
```bash
# Solution: Kill process or use different port
# Windows PowerShell:
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process

# Or run on different port:
npm run dev -- --port 3001
```

**Problem**: API calls failing (CORS errors)
```bash
# Solution: Check CORS settings in backend/crm/settings.py
# Make sure CORS_ALLOWED_ORIGINS includes http://localhost:3000
```

### ML Features Not Working

**Problem**: ML endpoints return 404
```bash
# Solution: Make sure ml module is in INSTALLED_APPS
# Check backend/crm/settings.py:
INSTALLED_APPS = [
    ...
    'ml',  # Should be here
]
```

**Problem**: Lead scoring shows "..."
```bash
# Solution: Check browser console for API errors
# Verify token is valid
# Check Django server logs
```

## 🎨 Sample Data

To quickly populate with sample data:

```bash
# In Django shell
python manage.py shell

from core.models import Tenant, Lead, Customer, Package
from decimal import Decimal

# Create tenant
tenant = Tenant.objects.create(name="Test Agency", subdomain="test")

# Create leads
Lead.objects.create(
    tenant=tenant,
    first_name="John",
    last_name="Doe",
    email="john@example.com",
    phone="+1234567890",
    source="whatsapp",
    status="new"
)

# Create package
Package.objects.create(
    tenant=tenant,
    name="Bali Paradise",
    description="5 days in Bali",
    base_price=Decimal("2500.00"),
    duration_days=5
)
```

## 📚 API Documentation

### Authentication
All API requests require JWT token:

```bash
# Get token
curl -X POST http://127.0.0.1:8000/api/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "your_username", "password": "your_password"}'

# Use token in requests
curl -X GET http://127.0.0.1:8000/api/leads/ \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### ML Endpoints

**Score a Lead:**
```bash
curl -X POST http://127.0.0.1:8000/api/ml/score-lead/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "interaction_count": 5,
    "budget": 3000,
    "source": "whatsapp",
    "response_time_hours": 2.5
  }'
```

**Predict Churn:**
```bash
curl -X POST http://127.0.0.1:8000/api/ml/predict-churn/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"customer_id": 1}'
```

**Get Revenue Forecast:**
```bash
curl -X GET http://127.0.0.1:8000/api/ml/forecast-revenue/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Analyze Sentiment:**
```bash
curl -X POST http://127.0.0.1:8000/api/ml/analyze-sentiment/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text": "I had an amazing experience!"}'
```

**Get Pricing Recommendation:**
```bash
curl -X POST http://127.0.0.1:8000/api/ml/recommend-price/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "package_id": 1,
    "seasonality": "high",
    "days_until_departure": 30
  }'
```

**Get All ML Insights:**
```bash
curl -X GET http://127.0.0.1:8000/api/ml/insights/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🎯 Feature Checklist

After setup, verify these features work:

### Phase 1: Integrations
- [ ] WhatsApp Agent connection configured
- [ ] Meta Ads Agent connection configured
- [ ] Can send test WhatsApp message
- [ ] Can create test ad campaign

### Phase 2: UI/UX
- [ ] Dashboard shows revenue trend chart
- [ ] Dashboard shows lead sources pie chart
- [ ] Packages page has grid/table toggle
- [ ] Package cards show AI insights
- [ ] Ads Dashboard displays campaigns
- [ ] Smooth animations on hover

### Phase 3: AI/ML
- [ ] Lead scoring works (shows score badge)
- [ ] Churn prediction works (shows risk badge)
- [ ] Revenue forecast visible in AI Insights
- [ ] Sentiment analysis endpoint responds
- [ ] Dynamic pricing recommendations shown
- [ ] AI Insights dashboard loads with data

## 🚀 Production Deployment

When ready for production:

1. **Update Settings:**
   - Set `DEBUG = False` in settings.py
   - Configure `ALLOWED_HOSTS`
   - Use PostgreSQL database
   - Set secure `SECRET_KEY`

2. **Build Frontend:**
   ```bash
   cd frontend
   npm run build
   ```

3. **Collect Static Files:**
   ```bash
   cd backend
   python manage.py collectstatic
   ```

4. **Deploy Options:**
   - **Heroku**: Easy deployment with buildpacks
   - **AWS**: EC2 + RDS for scalability
   - **DigitalOcean**: App Platform or Droplets
   - **Railway**: Simple deployment platform

## 📞 Support

- **Issues**: https://github.com/Sunilvenky/travel-crm-saas/issues
- **Documentation**: See README.md and PHASE3_SUMMARY.md
- **Email**: support@yourcompany.com

## ✅ Success!

If you can:
1. ✅ Access the dashboard
2. ✅ See charts and stats
3. ✅ View AI Insights page
4. ✅ See lead scores
5. ✅ Navigate all pages without errors

**Congratulations! Your Travel CRM SaaS is fully operational! 🎉**

---

**Version**: 3.0.0  
**Last Updated**: Phase 3 Complete  
**Estimated Setup Time**: 5 minutes
