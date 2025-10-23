import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, Target, DollarSign, Brain } from 'lucide-react';
import { motion } from 'framer-motion';

interface LeadScore {
  lead_id: number;
  lead_name: string;
  score: number;
  category: string;
  probability: number;
}

interface ChurnRisk {
  customer_id: number;
  customer_name: string;
  risk_level: string;
  probability: number;
}

interface RevenueForecast {
  expected_revenue: number;
  confidence_interval: {
    lower: number;
    upper: number;
    confidence_level: number;
  };
  pipeline_value: number;
  conversion_rate: number;
  deals_count: number;
}

interface MLInsights {
  hot_leads: LeadScore[];
  churn_risks: ChurnRisk[];
  revenue_forecast: RevenueForecast;
  timestamp: string;
}

const AIInsights: React.FC = () => {
  const [insights, setInsights] = useState<MLInsights | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://127.0.0.1:8000/api/ml/insights/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setInsights(data);
      }
    } catch (error) {
      console.error('Failed to fetch ML insights:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Brain className="w-16 h-16 text-blue-500 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">AI is analyzing your data...</p>
        </div>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="text-center p-8">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <p className="text-gray-600">Unable to load AI insights</p>
      </div>
    );
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'hot':
        return 'bg-red-500';
      case 'warm':
        return 'bg-orange-500';
      case 'cold':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-green-600 bg-green-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Brain className="w-8 h-8 text-purple-600" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900">AI Insights</h2>
          <p className="text-sm text-gray-600">Powered by Machine Learning</p>
        </div>
      </div>

      {/* Revenue Forecast */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg p-6 text-white"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Revenue Forecast
          </h3>
          <span className="text-sm opacity-80">Next 30 Days</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm opacity-80">Expected Revenue</p>
            <p className="text-3xl font-bold">
              ${insights.revenue_forecast.expected_revenue.toLocaleString()}
            </p>
          </div>
          
          <div>
            <p className="text-sm opacity-80">Confidence Range (80%)</p>
            <p className="text-lg font-semibold">
              ${insights.revenue_forecast.confidence_interval.lower.toLocaleString()} - ${insights.revenue_forecast.confidence_interval.upper.toLocaleString()}
            </p>
          </div>
          
          <div>
            <p className="text-sm opacity-80">Pipeline Value</p>
            <p className="text-xl font-semibold">
              ${insights.revenue_forecast.pipeline_value.toLocaleString()}
            </p>
            <p className="text-xs opacity-80 mt-1">
              {insights.revenue_forecast.deals_count} deals • {insights.revenue_forecast.conversion_rate}% conversion
            </p>
          </div>
        </div>
      </motion.div>

      {/* Hot Leads */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg shadow-lg p-6"
      >
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-red-500" />
          🔥 Hot Leads (High Priority)
        </h3>
        
        {insights.hot_leads.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No hot leads at the moment</p>
        ) : (
          <div className="space-y-3">
            {insights.hot_leads.map((lead, index) => (
              <motion.div
                key={lead.lead_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${getCategoryColor(lead.category)}`} />
                  <div>
                    <p className="font-medium text-gray-900">{lead.lead_name}</p>
                    <p className="text-sm text-gray-600">
                      {Math.round(lead.probability * 100)}% conversion probability
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">{lead.score}</p>
                    <p className="text-xs text-gray-600 uppercase">{lead.category}</p>
                  </div>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Contact
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Churn Risks */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-lg shadow-lg p-6"
      >
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          ⚠️ Churn Risk Alerts
        </h3>
        
        {insights.churn_risks.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-green-600 font-medium">✅ All customers are healthy!</p>
            <p className="text-sm text-gray-600 mt-1">No churn risks detected</p>
          </div>
        ) : (
          <div className="space-y-3">
            {insights.churn_risks.map((customer, index) => (
              <motion.div
                key={customer.customer_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-4 border border-orange-200 rounded-lg bg-orange-50"
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="font-medium text-gray-900">{customer.customer_name}</p>
                    <p className="text-sm text-gray-600">
                      {Math.round(customer.probability * 100)}% churn probability
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getRiskColor(customer.risk_level)}`}>
                    {customer.risk_level.toUpperCase()} RISK
                  </span>
                  <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
                    Re-engage
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* AI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg p-6 text-white"
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium opacity-80">Lead Scoring</h4>
            <TrendingUp className="w-5 h-5" />
          </div>
          <p className="text-3xl font-bold">{insights.hot_leads.length}</p>
          <p className="text-sm opacity-80 mt-1">Hot leads identified</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.35 }}
          className="bg-gradient-to-br from-orange-500 to-red-600 rounded-lg p-6 text-white"
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium opacity-80">Churn Prevention</h4>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <p className="text-3xl font-bold">{insights.churn_risks.length}</p>
          <p className="text-sm opacity-80 mt-1">At-risk customers</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg p-6 text-white"
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium opacity-80">Forecast Accuracy</h4>
            <TrendingUp className="w-5 h-5" />
          </div>
          <p className="text-3xl font-bold">
            {insights.revenue_forecast.confidence_interval.confidence_level}%
          </p>
          <p className="text-sm opacity-80 mt-1">Confidence level</p>
        </motion.div>
      </div>
    </div>
  );
};

export default AIInsights;
