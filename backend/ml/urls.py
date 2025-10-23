"""
ML API URLs
"""
from django.urls import path
from . import views

app_name = 'ml'

urlpatterns = [
    path('score-lead/', views.score_lead, name='score-lead'),
    path('predict-churn/', views.predict_churn, name='predict-churn'),
    path('forecast-revenue/', views.forecast_revenue, name='forecast-revenue'),
    path('analyze-sentiment/', views.analyze_sentiment, name='analyze-sentiment'),
    path('recommend-price/', views.recommend_price, name='recommend-price'),
    path('insights/', views.ml_insights_dashboard, name='insights'),
]
