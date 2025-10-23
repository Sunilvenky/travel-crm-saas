# 🌍 Travel CRM SaaS - Complete AI-Powered Platform

A premium, multi-tenant Travel CRM system with advanced AI/ML capabilities, WhatsApp automation, and Meta Ads integration.

## ✨ Features Overview

### 🎯 Core CRM Functionality
- **Lead Management**: Track and qualify travel leads with AI-powered scoring
- **Customer Management**: Complete customer profiles with booking history
- **Deal Pipeline**: Visual deal tracking with stage management
- **Package Management**: Create and manage travel packages with dynamic pricing
- **Booking Management**: End-to-end booking workflow
- **Multi-tenant Architecture**: Complete tenant isolation and RBAC

### 🤖 AI/ML Intelligence Layer (Phase 3) ✅
Built-in machine learning models for intelligent automation:

#### 1. **Lead Scoring Model** 🎯
- Automatically scores leads 0-100 based on multiple factors
- Categories: Hot (🔥), Warm (⚡), Cold (❄️)
- Provides actionable recommendations for each lead

#### 2. **Churn Prediction Model** ⚠️
- Predicts customer churn risk: High, Medium, Low
- Suggests re-engagement strategies

#### 3. **Revenue Forecasting** 💰
- Predicts next 30-day revenue with 80% confidence intervals
- Based on pipeline value, conversion rates, seasonal factors

#### 4. **Sentiment Analysis** 😊😐😞
- Real-time sentiment analysis of customer communications
- Analyzes WhatsApp messages, reviews, feedback

#### 5. **Dynamic Pricing Recommendations** 💲
- AI-optimized package pricing
- Suggests price adjustments with conversion impact predictions

### 🔌 Integration Layer (Phase 1) ✅

#### WhatsApp Agent Integration 💬
- Send personalized messages to leads/customers
- Share package details with rich formatting
- Broadcast campaigns to multiple recipients

#### Meta Ads Agent Integration 📢
- Create and manage ad campaigns from CRM
- Promote packages directly to Facebook/Instagram
- Track campaign performance and ROI

### 🎨 Premium UI/UX (Phase 2) ✅

- **Enhanced Dashboard** with revenue trends and lead source charts
- **Magazine-style Package Cards** with AI insights
- **Ads Dashboard** with campaign performance analytics
- **AI Insights Dashboard** with hot leads and churn alerts
- **Beautiful Animations** with Framer Motion

## 🛠️ Technology Stack

### Backend
- **Django 4.2+** with Django REST Framework
- **Django Simple JWT** for authentication
- **SQLite** (dev) / **PostgreSQL** (production)
- **Custom ML Models** for AI features

### Frontend
- **React 18** with TypeScript
- **Vite** for fast builds
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Recharts** for data visualization

## 🚀 Quick Start

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install django djangorestframework djangorestframework-simplejwt django-cors-headers
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

- Backend: `http://127.0.0.1:8000`
- Frontend: `http://localhost:3000`

## 📡 Key API Endpoints

### AI/ML (Phase 3)
- `POST /api/ml/score-lead/` - Score a lead
- `POST /api/ml/predict-churn/` - Predict customer churn
- `GET /api/ml/forecast-revenue/` - Get revenue forecast
- `POST /api/ml/analyze-sentiment/` - Analyze sentiment
- `POST /api/ml/recommend-price/` - Get pricing recommendation
- `GET /api/ml/insights/` - Get comprehensive AI insights

### Integrations (Phase 1)
- `POST /api/integrations/whatsapp/send-message/`
- `POST /api/integrations/meta-ads/create-campaign/`
- `GET /api/integrations/meta-ads/performance/`

### Core CRM
- `GET/POST /api/leads/`
- `GET/POST /api/customers/`
- `GET/POST /api/packages/`
- `GET/POST /api/bookings/`

## 📁 Project Structure

```
travel-crm-saas/
├── backend/
│   ├── core/              # Core CRM models and views
│   ├── integrations/      # WhatsApp & Meta Ads agents
│   ├── ml/                # AI/ML models (Phase 3)
│   │   ├── models.py      # LeadScoring, Churn, Revenue, Sentiment, Pricing
│   │   ├── views.py       # ML API endpoints
│   │   └── urls.py        # ML routes
│   └── crm/               # Django settings
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/        # UI components
│   │   │   └── MLBadges.tsx  # ML-powered badges
│   │   ├── pages/
│   │   │   ├── DashboardOverview.tsx  # Enhanced dashboard
│   │   │   ├── Packages.tsx           # Magazine-style packages
│   │   │   ├── AdsDashboard.tsx       # Meta Ads dashboard
│   │   │   └── AIInsights.tsx         # AI insights dashboard
│   │   └── App.tsx
│   └── package.json
└── README.md
```

## 🎯 Implementation Phases

### ✅ Phase 1: Integration Layer (Completed)
- WhatsApp Agent with message automation
- Meta Ads Agent with campaign management
- Integration Manager for orchestration

### ✅ Phase 2: Premium UI/UX (Completed)
- Dashboard with Recharts visualizations
- Magazine-style package cards
- Ads Dashboard
- Smooth animations

### ✅ Phase 3: AI/ML Intelligence (Completed)
- Lead Scoring Model (0-100 with Hot/Warm/Cold categories)
- Churn Prediction (High/Medium/Low risk)
- Revenue Forecasting (30-day predictions)
- Sentiment Analysis (Positive/Neutral/Negative)
- Dynamic Pricing (AI-optimized recommendations)

### 🔜 Phase 4: Advanced Features (Planned)
- Email marketing automation
- Payment gateway integration
- Mobile app (React Native)
- Advanced ML with Deep Learning

## 👨‍💻 Author

**Sunil Venky**
- GitHub: [@Sunilvenky](https://github.com/Sunilvenky)
- Repository: [travel-crm-saas](https://github.com/Sunilvenky/travel-crm-saas)

---

**Version**: 3.0.0 (Phase 3 Complete)  
**Status**: Production Ready 🚀  
**Last Updated**: AI/ML Intelligence Layer fully implemented

Built with ❤️ for the travel industry
