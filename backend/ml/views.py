"""
ML API Views
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from datetime import datetime, timedelta
from django.db.models import Sum, Count, Avg
from decimal import Decimal

from core.models import Lead, Customer, Booking, Package
from .models import (
    LeadScoringModel,
    ChurnPredictionModel,
    RevenueForecastModel,
    SentimentAnalysisModel,
    DynamicPricingModel
)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def score_lead(request):
    """
    Score a lead based on attributes
    
    POST /api/ml/score-lead/
    {
        "lead_id": 123  // Optional: fetch from DB
        // OR provide manual data:
        "interaction_count": 5,
        "budget": 3000,
        "source": "whatsapp",
        "response_time_hours": 2.5,
        "last_contact_date": "2024-01-15"
    }
    """
    lead_id = request.data.get('lead_id')
    
    # If lead_id provided, fetch from database
    if lead_id:
        try:
            lead = Lead.objects.get(id=lead_id, tenant=request.user.tenant)
            
            # Calculate interaction count (you may need to track this in your model)
            interaction_count = request.data.get('interaction_count', 1)
            
            lead_data = {
                'interaction_count': interaction_count,
                'budget': float(lead.budget) if hasattr(lead, 'budget') else 0,
                'source': lead.source if hasattr(lead, 'source') else 'website',
                'response_time_hours': request.data.get('response_time_hours', 12),
                'last_contact_date': lead.updated_at,
                'package_interest': lead.interested_package.name if hasattr(lead, 'interested_package') else ''
            }
        except Lead.DoesNotExist:
            return Response(
                {'error': 'Lead not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    else:
        # Use provided data
        last_contact_str = request.data.get('last_contact_date')
        last_contact = datetime.fromisoformat(last_contact_str) if last_contact_str else datetime.now()
        
        lead_data = {
            'interaction_count': request.data.get('interaction_count', 1),
            'budget': request.data.get('budget', 0),
            'source': request.data.get('source', 'website'),
            'response_time_hours': request.data.get('response_time_hours', 12),
            'last_contact_date': last_contact,
            'package_interest': request.data.get('package_interest', '')
        }
    
    # Score the lead
    model = LeadScoringModel()
    result = model.calculate_score(lead_data)
    
    return Response(result)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def predict_churn(request):
    """
    Predict churn risk for a customer
    
    POST /api/ml/predict-churn/
    {
        "customer_id": 456
    }
    """
    customer_id = request.data.get('customer_id')
    
    if not customer_id:
        return Response(
            {'error': 'customer_id is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        customer = Customer.objects.get(id=customer_id, tenant=request.user.tenant)
        
        # Get customer booking data
        bookings = Booking.objects.filter(customer=customer)
        total_bookings = bookings.count()
        
        if total_bookings == 0:
            return Response({
                'risk_level': 'unknown',
                'message': 'Customer has no booking history'
            })
        
        last_booking = bookings.order_by('-created_at').first()
        days_since_last = (datetime.now() - last_booking.created_at.replace(tzinfo=None)).days
        
        avg_value = bookings.aggregate(avg=Avg('total_price'))['avg']
        
        customer_data = {
            'days_since_last_booking': days_since_last,
            'total_bookings': total_bookings,
            'avg_booking_value': float(avg_value) if avg_value else 0,
            'last_interaction_date': customer.updated_at,
            'satisfaction_score': request.data.get('satisfaction_score', 4.0)
        }
        
        # Predict churn
        model = ChurnPredictionModel()
        result = model.predict_churn(customer_data)
        
        return Response(result)
        
    except Customer.DoesNotExist:
        return Response(
            {'error': 'Customer not found'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def forecast_revenue(request):
    """
    Forecast revenue based on pipeline
    
    GET /api/ml/forecast-revenue/
    """
    tenant = request.user.tenant
    
    # Get all active leads with potential deal values
    leads = Lead.objects.filter(
        tenant=tenant,
        status__in=['new', 'contacted', 'qualified']
    )
    
    # Calculate pipeline value (you may need to add estimated_value field to Lead model)
    deals_in_pipeline = []
    for lead in leads:
        # Estimate deal value based on interested package or average
        if hasattr(lead, 'interested_package') and lead.interested_package:
            deals_in_pipeline.append(float(lead.interested_package.base_price))
        else:
            # Use average package price
            avg_price = Package.objects.filter(tenant=tenant).aggregate(
                avg=Avg('base_price')
            )['avg']
            if avg_price:
                deals_in_pipeline.append(float(avg_price))
    
    # Calculate historical conversion rate
    total_leads = Lead.objects.filter(tenant=tenant).count()
    converted_leads = Lead.objects.filter(tenant=tenant, status='converted').count()
    conversion_rate = converted_leads / total_leads if total_leads > 0 else 0.25
    
    # Seasonal factor (current month)
    current_month = datetime.now().month
    peak_months = [12, 1, 6, 7]
    seasonal_factor = 1.3 if current_month in peak_months else 1.0
    
    pipeline_data = {
        'deals_in_pipeline': deals_in_pipeline,
        'historical_conversion_rate': conversion_rate,
        'seasonal_factor': seasonal_factor
    }
    
    # Forecast
    model = RevenueForecastModel()
    result = model.forecast(pipeline_data)
    
    return Response(result)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def analyze_sentiment(request):
    """
    Analyze sentiment of text
    
    POST /api/ml/analyze-sentiment/
    {
        "text": "I had an amazing experience! The trip was fantastic."
    }
    """
    text = request.data.get('text', '')
    
    if not text:
        return Response(
            {'error': 'text is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    model = SentimentAnalysisModel()
    result = model.analyze(text)
    
    return Response(result)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def recommend_price(request):
    """
    Get dynamic pricing recommendation
    
    POST /api/ml/recommend-price/
    {
        "package_id": 789,
        "seasonality": "high",  // optional
        "days_until_departure": 45  // optional
    }
    """
    package_id = request.data.get('package_id')
    
    if not package_id:
        return Response(
            {'error': 'package_id is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        package = Package.objects.get(id=package_id, tenant=request.user.tenant)
        
        # Get current bookings for this package
        bookings_count = Booking.objects.filter(
            package=package,
            status__in=['confirmed', 'pending']
        ).count()
        
        # Get competition price (you may want to track this)
        competition_price = float(package.base_price) * 1.1
        
        package_data = {
            'base_price': float(package.base_price),
            'current_bookings': bookings_count,
            'competition_price': competition_price,
            'seasonality': request.data.get('seasonality', 'medium'),
            'days_until_departure': request.data.get('days_until_departure', 30)
        }
        
        model = DynamicPricingModel()
        result = model.recommend_price(package_data)
        
        return Response(result)
        
    except Package.DoesNotExist:
        return Response(
            {'error': 'Package not found'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def ml_insights_dashboard(request):
    """
    Get comprehensive ML insights for dashboard
    
    GET /api/ml/insights/
    """
    tenant = request.user.tenant
    
    # 1. Top 5 hot leads
    leads = Lead.objects.filter(
        tenant=tenant,
        status__in=['new', 'contacted', 'qualified']
    )[:10]  # Get top 10 to score
    
    lead_scores = []
    scoring_model = LeadScoringModel()
    
    for lead in leads:
        lead_data = {
            'interaction_count': 3,  # You may track this
            'budget': float(getattr(lead, 'budget', 1000)),
            'source': getattr(lead, 'source', 'website'),
            'response_time_hours': 6,
            'last_contact_date': lead.updated_at,
        }
        score_result = scoring_model.calculate_score(lead_data)
        
        lead_scores.append({
            'lead_id': lead.id,
            'lead_name': lead.name,
            'score': score_result['score'],
            'category': score_result['category'],
            'probability': score_result['conversion_probability']
        })
    
    # Sort by score and get top 5
    lead_scores.sort(key=lambda x: x['score'], reverse=True)
    hot_leads = lead_scores[:5]
    
    # 2. Churn risks
    customers = Customer.objects.filter(tenant=tenant)[:5]
    churn_risks = []
    churn_model = ChurnPredictionModel()
    
    for customer in customers:
        bookings = Booking.objects.filter(customer=customer)
        if bookings.exists():
            last_booking = bookings.order_by('-created_at').first()
            days_since = (datetime.now() - last_booking.created_at.replace(tzinfo=None)).days
            
            customer_data = {
                'days_since_last_booking': days_since,
                'total_bookings': bookings.count(),
                'avg_booking_value': 2500,
                'last_interaction_date': customer.updated_at,
                'satisfaction_score': 3.5
            }
            
            churn_result = churn_model.predict_churn(customer_data)
            
            if churn_result['risk_level'] in ['high', 'medium']:
                churn_risks.append({
                    'customer_id': customer.id,
                    'customer_name': customer.name,
                    'risk_level': churn_result['risk_level'],
                    'probability': churn_result['churn_probability']
                })
    
    # 3. Revenue forecast
    forecast_model = RevenueForecastModel()
    forecast_result = forecast_revenue(request).data
    
    return Response({
        'hot_leads': hot_leads,
        'churn_risks': churn_risks,
        'revenue_forecast': forecast_result,
        'timestamp': datetime.now().isoformat()
    })
