import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  MessageCircle, 
  Facebook, 
  Check, 
  X, 
  Settings, 
  RefreshCw,
  Zap,
  TrendingUp
} from 'lucide-react';
import api from '../api';

interface Integration {
  id: number;
  type: string;
  name: string;
  is_active: boolean;
  is_connected: boolean;
  last_synced_at: string | null;
}

interface ConnectionForm {
  api_url: string;
  api_key: string;
  ad_account_id?: string;
}

export default function Integrations() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);
  const [connectionForm, setConnectionForm] = useState<ConnectionForm>({
    api_url: '',
    api_key: '',
    ad_account_id: ''
  });
  const [connecting, setConnecting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      const response = await api.get('/integrations/');
      setIntegrations(response.data.integrations || []);
    } catch (error) {
      console.error('Error fetching integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = (integrationType: string) => {
    setSelectedIntegration(integrationType);
    setConnectionForm({ api_url: '', api_key: '', ad_account_id: '' });
    setShowConnectModal(true);
  };

  const handleSubmitConnection = async () => {
    if (!selectedIntegration) return;

    setConnecting(true);
    try {
      const response = await api.post('/integrations/connect/', {
        integration_type: selectedIntegration,
        credentials: connectionForm
      });

      if (response.data.success) {
        alert(`${selectedIntegration} connected successfully!`);
        setShowConnectModal(false);
        fetchIntegrations();
      }
    } catch (error) {
      console.error('Error connecting integration:', error);
      alert('Failed to connect. Please check your credentials.');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async (integrationType: string) => {
    if (!confirm(`Are you sure you want to disconnect ${integrationType}?`)) return;

    try {
      await api.post('/integrations/disconnect/', {
        integration_type: integrationType
      });
      alert('Disconnected successfully');
      fetchIntegrations();
    } catch (error) {
      console.error('Error disconnecting:', error);
      alert('Failed to disconnect');
    }
  };

  const handleTest = async (integrationType: string) => {
    setTesting(true);
    try {
      const response = await api.post('/integrations/test/', {
        integration_type: integrationType
      });

      if (response.data.success) {
        alert(`✅ ${integrationType} connection test successful!`);
      } else {
        alert(`❌ Connection test failed: ${response.data.message}`);
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      alert('Connection test failed');
    } finally {
      setTesting(false);
    }
  };

  const handleSync = async (integrationType?: string) => {
    setSyncing(true);
    try {
      const response = await api.post('/integrations/sync/', {
        integration_type: integrationType
      });

      if (response.data.success) {
        alert('✅ Sync completed successfully!');
        fetchIntegrations();
      }
    } catch (error) {
      console.error('Error syncing:', error);
      alert('Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const getIntegrationIcon = (type: string) => {
    switch (type) {
      case 'whatsapp':
        return MessageCircle;
      case 'meta_ads':
        return Facebook;
      default:
        return Settings;
    }
  };

  const getIntegrationColor = (type: string) => {
    switch (type) {
      case 'whatsapp':
        return 'from-green-500 to-green-600';
      case 'meta_ads':
        return 'from-blue-500 to-indigo-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getIntegrationDescription = (type: string) => {
    switch (type) {
      case 'whatsapp':
        return 'AI-powered WhatsApp messaging with sentiment analysis, lead extraction, and automated responses';
      case 'meta_ads':
        return 'Meta (Facebook) Ads campaign management with AI optimization and performance tracking';
      default:
        return 'External integration';
    }
  };

  if (loading) {
    return <div className="p-6">Loading integrations...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
          <p className="text-gray-600 mt-2">Connect your external apps and agents to supercharge your CRM</p>
        </div>
        <Button
          onClick={() => handleSync()}
          disabled={syncing}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
          Sync All
        </Button>
      </div>

      {/* Integration Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* WhatsApp Agent */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-full bg-gradient-to-br ${getIntegrationColor('whatsapp')}`}>
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">WhatsApp Agent</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {integrations.find(i => i.type === 'whatsapp')?.is_connected ? (
                        <span className="flex items-center text-green-600">
                          <Check className="w-4 h-4 mr-1" />
                          Connected
                        </span>
                      ) : (
                        <span className="flex items-center text-gray-500">
                          <X className="w-4 h-4 mr-1" />
                          Not Connected
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                {getIntegrationDescription('whatsapp')}
              </p>
              
              <div className="flex items-center space-x-2 mb-4">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium text-gray-700">AI-Powered Features:</span>
              </div>
              <ul className="text-sm text-gray-600 space-y-2 mb-4">
                <li>• Sentiment analysis & mood tracking</li>
                <li>• Automatic lead extraction from conversations</li>
                <li>• Intent detection (booking, inquiry, complaint)</li>
                <li>• Smart response suggestions</li>
              </ul>

              <div className="flex space-x-2">
                {integrations.find(i => i.type === 'whatsapp')?.is_connected ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => handleTest('whatsapp')}
                      disabled={testing}
                      className="flex-1"
                    >
                      Test Connection
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleSync('whatsapp')}
                      disabled={syncing}
                      className="flex-1"
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                      Sync
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleDisconnect('whatsapp')}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Disconnect
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => handleConnect('whatsapp')}
                    className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                  >
                    Connect WhatsApp Agent
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Meta Ads Agent */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-full bg-gradient-to-br ${getIntegrationColor('meta_ads')}`}>
                    <Facebook className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Meta Ads Agent</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {integrations.find(i => i.type === 'meta_ads')?.is_connected ? (
                        <span className="flex items-center text-green-600">
                          <Check className="w-4 h-4 mr-1" />
                          Connected
                        </span>
                      ) : (
                        <span className="flex items-center text-gray-500">
                          <X className="w-4 h-4 mr-1" />
                          Not Connected
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                {getIntegrationDescription('meta_ads')}
              </p>
              
              <div className="flex items-center space-x-2 mb-4">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-700">AI-Powered Features:</span>
              </div>
              <ul className="text-sm text-gray-600 space-y-2 mb-4">
                <li>• One-click campaign creation from packages</li>
                <li>• AI-generated ad creative & targeting</li>
                <li>• Real-time performance tracking & ROI</li>
                <li>• Budget optimization recommendations</li>
              </ul>

              <div className="flex space-x-2">
                {integrations.find(i => i.type === 'meta_ads')?.is_connected ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => handleTest('meta_ads')}
                      disabled={testing}
                      className="flex-1"
                    >
                      Test Connection
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleSync('meta_ads')}
                      disabled={syncing}
                      className="flex-1"
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                      Sync
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleDisconnect('meta_ads')}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Disconnect
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => handleConnect('meta_ads')}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800"
                  >
                    Connect Meta Ads Agent
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Connection Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-6 rounded-lg w-full max-w-md"
          >
            <h2 className="text-xl font-bold mb-4">
              Connect {selectedIntegration === 'whatsapp' ? 'WhatsApp Agent' : 'Meta Ads Agent'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API URL
                </label>
                <input
                  type="text"
                  placeholder="https://your-api-url.com"
                  value={connectionForm.api_url}
                  onChange={(e) => setConnectionForm({...connectionForm, api_url: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Key
                </label>
                <input
                  type="password"
                  placeholder="Your API key"
                  value={connectionForm.api_key}
                  onChange={(e) => setConnectionForm({...connectionForm, api_key: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {selectedIntegration === 'meta_ads' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ad Account ID
                  </label>
                  <input
                    type="text"
                    placeholder="act_123456789"
                    value={connectionForm.ad_account_id}
                    onChange={(e) => setConnectionForm({...connectionForm, ad_account_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowConnectModal(false)}
                disabled={connecting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitConnection}
                disabled={connecting || !connectionForm.api_url || !connectionForm.api_key}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              >
                {connecting ? 'Connecting...' : 'Connect'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
