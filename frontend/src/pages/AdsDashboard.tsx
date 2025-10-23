import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import api from '../api';

interface Campaign {
  id: string;
  campaign_name: string;
  status: string;
  budget: number;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  roi: number;
  package_name?: string;
}

export default function AdsDashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await api.get('/integrations/meta-ads/campaigns/');
      if (response.data.success) {
        setCampaigns(response.data.campaigns);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePauseCampaign = async (id: string) => {
    try {
      await api.post(`/integrations/meta-ads/${id}/pause/`);
      fetchCampaigns();
    } catch (error) {
      console.error('Error pausing campaign:', error);
    }
  };

  const handleResumeCampaign = async (id: string) => {
    try {
      await api.post(`/integrations/meta-ads/${id}/resume/`);
      fetchCampaigns();
    } catch (error) {
      console.error('Error resuming campaign:', error);
    }
  };

  const totalStats = {
    totalSpend: campaigns.reduce((sum, c) => sum + c.spend, 0),
    totalImpressions: campaigns.reduce((sum, c) => sum + c.impressions, 0),
    totalClicks: campaigns.reduce((sum, c) => sum + c.clicks, 0),
    totalConversions: campaigns.reduce((sum, c) => sum + c.conversions, 0),
    avgROI: campaigns.length > 0 ? campaigns.reduce((sum, c) => sum + c.roi, 0) / campaigns.length : 0
  };

  const performanceData = campaigns.map(c => ({
    name: c.campaign_name.substring(0, 15) + '...',
    impressions: c.impressions,
    clicks: c.clicks,
    conversions: c.conversions
  }));

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow h-32"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Meta Ads Dashboard</h1>
        <p className="text-gray-600 mt-1">Monitor and optimize your advertising campaigns</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg"
        >
          <div className="text-sm opacity-90 mb-1">Total Spend</div>
          <div className="text-3xl font-bold">${totalStats.totalSpend.toFixed(2)}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg"
        >
          <div className="text-sm opacity-90 mb-1">Impressions</div>
          <div className="text-3xl font-bold">{totalStats.totalImpressions.toLocaleString()}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg"
        >
          <div className="text-sm opacity-90 mb-1">Clicks</div>
          <div className="text-3xl font-bold">{totalStats.totalClicks.toLocaleString()}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white shadow-lg"
        >
          <div className="text-sm opacity-90 mb-1">Conversions</div>
          <div className="text-3xl font-bold">{totalStats.totalConversions}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg"
        >
          <div className="text-sm opacity-90 mb-1">Avg ROI</div>
          <div className="text-3xl font-bold">{totalStats.avgROI.toFixed(1)}x</div>
        </motion.div>
      </div>

      {/* Performance Chart */}
      {campaigns.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4">Campaign Performance</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="impressions" fill="#8B5CF6" name="Impressions" />
              <Bar dataKey="clicks" fill="#3B82F6" name="Clicks" />
              <Bar dataKey="conversions" fill="#10B981" name="Conversions" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Campaigns Grid */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Active Campaigns</h2>
        {campaigns.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-12 text-center">
            <div className="text-6xl mb-4">📢</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No campaigns yet</h3>
            <p className="text-gray-600 mb-4">Create your first campaign from the Packages page</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {campaigns.map((campaign, index) => (
              <motion.div
                key={campaign.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{campaign.campaign_name}</h3>
                      {campaign.package_name && (
                        <p className="text-sm text-gray-600">Package: {campaign.package_name}</p>
                      )}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                      campaign.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {campaign.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Budget</div>
                      <div className="text-lg font-bold text-gray-900">${campaign.budget}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Spent</div>
                      <div className="text-lg font-bold text-gray-900">${campaign.spend.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Impressions</div>
                      <div className="text-lg font-bold text-blue-600">{campaign.impressions.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Clicks</div>
                      <div className="text-lg font-bold text-purple-600">{campaign.clicks}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Conversions</div>
                      <div className="text-lg font-bold text-green-600">{campaign.conversions}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">ROI</div>
                      <div className="text-lg font-bold text-red-600">{campaign.roi.toFixed(1)}x</div>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    {campaign.status === 'active' ? (
                      <button
                        onClick={() => handlePauseCampaign(campaign.id)}
                        className="flex-1 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        ⏸️ Pause
                      </button>
                    ) : (
                      <button
                        onClick={() => handleResumeCampaign(campaign.id)}
                        className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        ▶️ Resume
                      </button>
                    )}
                    <button
                      className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      📊 Details
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
