"""
Lead Scoring Model
Predicts the likelihood of a lead converting to a customer
"""
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, Any


class LeadScoringModel:
    """
    Lead scoring model using weighted factors
    In production, this would use a trained ML model (RandomForest, XGBoost, etc.)
    """
    
    def __init__(self):
        # Weight factors for different attributes
        self.weights = {
            'engagement_score': 0.25,
            'budget_alignment': 0.20,
            'response_time': 0.15,
            'interaction_frequency': 0.15,
            'source_quality': 0.15,
            'timing_score': 0.10
        }
    
    def calculate_score(self, lead_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate lead score (0-100)
        
        Args:
            lead_data: Dictionary containing lead information
                - last_contact_date: datetime
                - budget: float
                - source: str (whatsapp, meta_ads, website, referral)
                - interaction_count: int
                - response_time_hours: float
                - package_interest: str
        
        Returns:
            Dictionary with score and breakdown
        """
        scores = {}
        
        # 1. Engagement Score (0-25 points)
        interaction_count = lead_data.get('interaction_count', 0)
        if interaction_count >= 10:
            scores['engagement_score'] = 25
        elif interaction_count >= 5:
            scores['engagement_score'] = 20
        elif interaction_count >= 3:
            scores['engagement_score'] = 15
        elif interaction_count >= 1:
            scores['engagement_score'] = 10
        else:
            scores['engagement_score'] = 5
        
        # 2. Budget Alignment (0-20 points)
        budget = lead_data.get('budget', 0)
        if budget >= 5000:
            scores['budget_alignment'] = 20
        elif budget >= 3000:
            scores['budget_alignment'] = 15
        elif budget >= 1500:
            scores['budget_alignment'] = 10
        elif budget >= 500:
            scores['budget_alignment'] = 5
        else:
            scores['budget_alignment'] = 2
        
        # 3. Response Time (0-15 points) - faster response = higher score
        response_time = lead_data.get('response_time_hours', 24)
        if response_time <= 1:
            scores['response_time'] = 15
        elif response_time <= 4:
            scores['response_time'] = 12
        elif response_time <= 12:
            scores['response_time'] = 8
        elif response_time <= 24:
            scores['response_time'] = 5
        else:
            scores['response_time'] = 2
        
        # 4. Interaction Frequency (0-15 points)
        last_contact = lead_data.get('last_contact_date')
        if last_contact:
            days_since = (datetime.now() - last_contact).days
            if days_since <= 1:
                scores['interaction_frequency'] = 15
            elif days_since <= 3:
                scores['interaction_frequency'] = 12
            elif days_since <= 7:
                scores['interaction_frequency'] = 8
            elif days_since <= 14:
                scores['interaction_frequency'] = 5
            else:
                scores['interaction_frequency'] = 2
        else:
            scores['interaction_frequency'] = 0
        
        # 5. Source Quality (0-15 points)
        source = lead_data.get('source', 'website').lower()
        source_scores = {
            'referral': 15,
            'whatsapp': 13,
            'meta_ads': 11,
            'website': 8,
            'organic': 6
        }
        scores['source_quality'] = source_scores.get(source, 5)
        
        # 6. Timing Score (0-10 points) - seasonal factors
        current_month = datetime.now().month
        # Peak travel months: December, January, June, July
        peak_months = [12, 1, 6, 7]
        if current_month in peak_months:
            scores['timing_score'] = 10
        elif current_month in [11, 2, 5, 8]:  # Pre-peak months
            scores['timing_score'] = 7
        else:
            scores['timing_score'] = 5
        
        # Calculate total score
        total_score = sum(scores.values())
        
        # Determine category
        if total_score >= 80:
            category = 'hot'
            probability = 0.85
        elif total_score >= 60:
            category = 'warm'
            probability = 0.60
        elif total_score >= 40:
            category = 'cold'
            probability = 0.30
        else:
            category = 'ice_cold'
            probability = 0.10
        
        return {
            'score': total_score,
            'category': category,
            'conversion_probability': probability,
            'breakdown': scores,
            'recommendations': self._get_recommendations(scores, category)
        }
    
    def _get_recommendations(self, scores: Dict[str, float], category: str) -> list:
        """Generate actionable recommendations based on score breakdown"""
        recommendations = []
        
        if scores['engagement_score'] < 15:
            recommendations.append("Increase engagement: Send personalized package recommendations")
        
        if scores['response_time'] < 10:
            recommendations.append("Improve response time: Set up automated responses via WhatsApp")
        
        if scores['interaction_frequency'] < 10:
            recommendations.append("Follow up: Lead hasn't been contacted recently")
        
        if scores['budget_alignment'] < 10:
            recommendations.append("Budget concerns: Offer payment plans or budget-friendly packages")
        
        if category == 'hot':
            recommendations.append("🔥 Priority: Schedule call within 24 hours to close deal")
        elif category == 'warm':
            recommendations.append("Send detailed itinerary and customer testimonials")
        elif category == 'cold':
            recommendations.append("Nurture campaign: Send travel inspiration content")
        
        return recommendations


class ChurnPredictionModel:
    """
    Predicts customer churn risk
    """
    
    def predict_churn(self, customer_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Predict churn probability
        
        Args:
            customer_data: Dictionary with customer information
                - days_since_last_booking: int
                - total_bookings: int
                - avg_booking_value: float
                - last_interaction_date: datetime
                - satisfaction_score: float (0-5)
        
        Returns:
            Churn prediction with probability and recommendations
        """
        risk_score = 0
        factors = {}
        
        # 1. Days since last booking (max 40 points)
        days_since = customer_data.get('days_since_last_booking', 0)
        if days_since > 365:
            factors['booking_recency'] = 40
        elif days_since > 180:
            factors['booking_recency'] = 30
        elif days_since > 90:
            factors['booking_recency'] = 20
        else:
            factors['booking_recency'] = 5
        
        # 2. Booking frequency (max 30 points)
        total_bookings = customer_data.get('total_bookings', 0)
        if total_bookings == 1:
            factors['frequency'] = 30
        elif total_bookings == 2:
            factors['frequency'] = 15
        else:
            factors['frequency'] = 5
        
        # 3. Satisfaction score (max 30 points)
        satisfaction = customer_data.get('satisfaction_score', 3.5)
        if satisfaction < 2.0:
            factors['satisfaction'] = 30
        elif satisfaction < 3.0:
            factors['satisfaction'] = 20
        elif satisfaction < 4.0:
            factors['satisfaction'] = 10
        else:
            factors['satisfaction'] = 0
        
        risk_score = sum(factors.values())
        
        # Determine risk level
        if risk_score >= 70:
            risk_level = 'high'
            churn_probability = 0.80
        elif risk_score >= 45:
            risk_level = 'medium'
            churn_probability = 0.50
        else:
            risk_level = 'low'
            churn_probability = 0.20
        
        return {
            'risk_score': risk_score,
            'risk_level': risk_level,
            'churn_probability': churn_probability,
            'factors': factors,
            'recommendations': self._get_churn_recommendations(risk_level, factors)
        }
    
    def _get_churn_recommendations(self, risk_level: str, factors: Dict[str, float]) -> list:
        """Generate recommendations to reduce churn"""
        recommendations = []
        
        if risk_level == 'high':
            recommendations.append("🚨 Urgent: Reach out immediately with exclusive offer")
            recommendations.append("Send personalized 'We miss you' message via WhatsApp")
            recommendations.append("Offer 15-20% discount on next booking")
        elif risk_level == 'medium':
            recommendations.append("Send re-engagement campaign with new destinations")
            recommendations.append("Share customer success stories")
            recommendations.append("Offer 10% loyalty discount")
        else:
            recommendations.append("Continue regular engagement")
            recommendations.append("Send travel tips and destination guides")
        
        if factors.get('satisfaction', 0) > 20:
            recommendations.append("Follow up on previous experience concerns")
        
        return recommendations


class RevenueForecastModel:
    """
    Forecast revenue based on pipeline and historical data
    """
    
    def forecast(self, pipeline_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Forecast revenue for next period
        
        Args:
            pipeline_data: Dictionary with pipeline information
                - deals_in_pipeline: list of deal values
                - historical_conversion_rate: float
                - avg_deal_size: float
                - seasonal_factor: float
        
        Returns:
            Revenue forecast with confidence intervals
        """
        deals = pipeline_data.get('deals_in_pipeline', [])
        conversion_rate = pipeline_data.get('historical_conversion_rate', 0.25)
        seasonal_factor = pipeline_data.get('seasonal_factor', 1.0)
        
        # Calculate expected revenue
        total_pipeline = sum(deals) if deals else 0
        expected_revenue = total_pipeline * conversion_rate * seasonal_factor
        
        # Calculate confidence intervals
        std_dev = expected_revenue * 0.15  # 15% standard deviation
        confidence_80_lower = expected_revenue - (1.28 * std_dev)
        confidence_80_upper = expected_revenue + (1.28 * std_dev)
        
        return {
            'expected_revenue': round(expected_revenue, 2),
            'confidence_interval': {
                'lower': round(max(0, confidence_80_lower), 2),
                'upper': round(confidence_80_upper, 2),
                'confidence_level': 80
            },
            'pipeline_value': round(total_pipeline, 2),
            'conversion_rate': round(conversion_rate * 100, 1),
            'deals_count': len(deals),
            'avg_deal_size': round(sum(deals) / len(deals), 2) if deals else 0
        }


class SentimentAnalysisModel:
    """
    Analyze sentiment from customer communications
    """
    
    def analyze(self, text: str) -> Dict[str, Any]:
        """
        Analyze sentiment of text
        
        Args:
            text: Text to analyze (message, review, etc.)
        
        Returns:
            Sentiment analysis result
        """
        # Simple keyword-based sentiment (in production, use BERT/transformers)
        text_lower = text.lower()
        
        positive_keywords = [
            'amazing', 'excellent', 'great', 'wonderful', 'fantastic',
            'love', 'perfect', 'beautiful', 'awesome', 'best',
            'thank you', 'grateful', 'appreciate', 'happy', 'enjoyed'
        ]
        
        negative_keywords = [
            'terrible', 'awful', 'bad', 'worst', 'horrible',
            'disappointing', 'poor', 'unhappy', 'frustrated', 'angry',
            'complaint', 'refund', 'cancel', 'problem', 'issue'
        ]
        
        positive_count = sum(1 for word in positive_keywords if word in text_lower)
        negative_count = sum(1 for word in negative_keywords if word in text_lower)
        
        # Calculate sentiment score (-1 to 1)
        if positive_count + negative_count == 0:
            score = 0
            label = 'neutral'
        else:
            score = (positive_count - negative_count) / (positive_count + negative_count)
            
            if score > 0.3:
                label = 'positive'
            elif score < -0.3:
                label = 'negative'
            else:
                label = 'neutral'
        
        return {
            'score': round(score, 2),
            'label': label,
            'confidence': min(0.95, 0.6 + abs(score) * 0.4),
            'positive_indicators': positive_count,
            'negative_indicators': negative_count
        }


class DynamicPricingModel:
    """
    Recommend optimal pricing for packages
    """
    
    def recommend_price(self, package_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Recommend optimal price for a package
        
        Args:
            package_data: Dictionary with package information
                - base_price: float
                - current_bookings: int
                - competition_price: float
                - seasonality: str (high/medium/low)
                - days_until_departure: int
        
        Returns:
            Price recommendation
        """
        base_price = package_data.get('base_price', 1000)
        bookings = package_data.get('current_bookings', 0)
        seasonality = package_data.get('seasonality', 'medium')
        days_until = package_data.get('days_until_departure', 30)
        
        # Start with base price
        recommended_price = base_price
        adjustments = {}
        
        # 1. Demand-based adjustment
        if bookings >= 10:
            demand_multiplier = 1.15
            adjustments['high_demand'] = '+15%'
        elif bookings >= 5:
            demand_multiplier = 1.08
            adjustments['moderate_demand'] = '+8%'
        else:
            demand_multiplier = 0.95
            adjustments['low_demand'] = '-5%'
        
        recommended_price *= demand_multiplier
        
        # 2. Seasonality adjustment
        if seasonality == 'high':
            recommended_price *= 1.20
            adjustments['peak_season'] = '+20%'
        elif seasonality == 'low':
            recommended_price *= 0.85
            adjustments['off_season'] = '-15%'
        
        # 3. Time-based adjustment (early bird/last minute)
        if days_until > 90:
            recommended_price *= 0.90
            adjustments['early_bird'] = '-10%'
        elif days_until < 14:
            recommended_price *= 1.10
            adjustments['last_minute'] = '+10%'
        
        # Calculate expected conversion impact
        price_change = ((recommended_price - base_price) / base_price) * 100
        if price_change > 0:
            conversion_impact = f"↓ {abs(price_change * 0.5):.1f}%"
        else:
            conversion_impact = f"↑ {abs(price_change * 0.8):.1f}%"
        
        return {
            'recommended_price': round(recommended_price, 2),
            'base_price': base_price,
            'price_change': round(price_change, 1),
            'adjustments': adjustments,
            'expected_conversion_impact': conversion_impact,
            'confidence': 0.75
        }
