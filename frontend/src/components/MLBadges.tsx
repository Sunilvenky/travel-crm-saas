import React, { useState, useEffect } from 'react';
import { Target, TrendingUp } from 'lucide-react';

interface LeadScoreBadgeProps {
  leadId: string | number;
  budget?: number;
  source?: string;
}

interface ScoreResult {
  score: number;
  category: string;
  conversion_probability: number;
}

export const LeadScoreBadge: React.FC<LeadScoreBadgeProps> = ({ leadId, budget = 0, source = 'website' }) => {
  const [scoreData, setScoreData] = useState<ScoreResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchScore();
  }, [leadId]);

  const fetchScore = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://127.0.0.1:8000/api/ml/score-lead/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          interaction_count: 3,
          budget: budget,
          source: source,
          response_time_hours: 6,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setScoreData(data);
      }
    } catch (error) {
      console.error('Failed to fetch lead score:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !scoreData) {
    return (
      <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded">
        <Target className="w-3 h-3 mr-1 animate-pulse" />
        ...
      </span>
    );
  }

  const getCategoryStyle = (category: string) => {
    switch (category) {
      case 'hot':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'warm':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'cold':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getIcon = (category: string) => {
    if (category === 'hot') return '🔥';
    if (category === 'warm') return '⚡';
    return '❄️';
  };

  return (
    <div className="flex items-center gap-2">
      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold border rounded ${getCategoryStyle(scoreData.category)}`}>
        <span className="mr-1">{getIcon(scoreData.category)}</span>
        {scoreData.score}
      </span>
      <span className="text-xs text-gray-600">
        {Math.round(scoreData.conversion_probability * 100)}%
      </span>
    </div>
  );
};

interface PricingBadgeProps {
  packageId: string | number;
  basePrice: number;
  seasonality?: string;
}

interface PricingResult {
  recommended_price: number;
  base_price: number;
  price_change: number;
}

export const DynamicPricingBadge: React.FC<PricingBadgeProps> = ({ 
  packageId, 
  basePrice, 
  seasonality = 'medium' 
}) => {
  const [pricingData, setPricingData] = useState<PricingResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPricing();
  }, [packageId]);

  const fetchPricing = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://127.0.0.1:8000/api/ml/recommend-price/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          package_id: packageId,
          seasonality: seasonality,
          days_until_departure: 30,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setPricingData(data);
      }
    } catch (error) {
      console.error('Failed to fetch pricing:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !pricingData) {
    return (
      <span className="text-sm text-gray-600">
        ${basePrice.toLocaleString()}
      </span>
    );
  }

  const priceChange = pricingData.price_change;
  const isIncrease = priceChange > 0;

  return (
    <div className="flex items-center gap-2">
      <div>
        <span className="text-lg font-bold text-gray-900">
          ${pricingData.recommended_price.toLocaleString()}
        </span>
        {Math.abs(priceChange) > 1 && (
          <span className={`ml-2 text-xs font-semibold ${isIncrease ? 'text-green-600' : 'text-orange-600'}`}>
            {isIncrease ? '↑' : '↓'} {Math.abs(priceChange).toFixed(0)}%
          </span>
        )}
      </div>
      {Math.abs(priceChange) > 1 && (
        <span className="text-xs text-gray-500">
          AI optimized
        </span>
      )}
    </div>
  );
};

interface ChurnBadgeProps {
  customerId: string | number;
  customerName: string;
}

interface ChurnResult {
  risk_level: string;
  churn_probability: number;
  recommendations: string[];
}

export const ChurnRiskBadge: React.FC<ChurnBadgeProps> = ({ customerId, customerName }) => {
  const [churnData, setChurnData] = useState<ChurnResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchChurn();
  }, [customerId]);

  const fetchChurn = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://127.0.0.1:8000/api/ml/predict-churn/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_id: customerId,
          satisfaction_score: 4.0,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setChurnData(data);
      }
    } catch (error) {
      console.error('Failed to fetch churn data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !churnData) {
    return null;
  }

  if (churnData.risk_level === 'low') {
    return null; // Don't show badge for low risk
  }

  const getRiskStyle = (risk: string) => {
    switch (risk) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'medium':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      default:
        return 'bg-green-100 text-green-800 border-green-300';
    }
  };

  return (
    <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold border rounded ${getRiskStyle(churnData.risk_level)}`}>
      ⚠️ {churnData.risk_level.toUpperCase()} RISK
    </span>
  );
};
