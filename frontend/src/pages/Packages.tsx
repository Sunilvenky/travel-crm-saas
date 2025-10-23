import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../api';

interface Package {
  id: string;
  name: string;
  description?: string;
  base_price: string; // Django returns decimals as strings
  duration?: number;
  destination?: string;
}

export default function Packages() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [formData, setFormData] = useState<Partial<Package>>({});
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [promoteBudget, setPromoteBudget] = useState('500');
  const [promoteDuration, setPromoteDuration] = useState('7');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const response = await api.get('/packages');
      setPackages(response.data.packages);
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPackages = packages.filter(pkg =>
    pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pkg.destination?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pkg.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPackage) {
        await api.put(`/packages/${editingPackage.id}`, formData);
      } else {
        await api.post('/packages', formData);
      }
      fetchPackages();
      setShowForm(false);
      setEditingPackage(null);
      setFormData({});
    } catch (error) {
      console.error('Error saving package:', error);
    }
  };

  const handleEdit = (pkg: Package) => {
    setEditingPackage(pkg);
    setFormData(pkg);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this package?')) {
      try {
        await api.delete(`/packages/${id}`);
        fetchPackages();
      } catch (error) {
        console.error('Error deleting package:', error);
      }
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingPackage(null);
    setFormData({});
  };

  const handlePromote = (pkg: Package) => {
    setSelectedPackage(pkg);
    setShowPromoteModal(true);
  };

  const handleSendWhatsApp = (pkg: Package) => {
    setSelectedPackage(pkg);
    setShowWhatsAppModal(true);
  };

  const submitMetaAdsPromotion = async () => {
    if (!selectedPackage) return;
    
    try {
      const response = await api.post('/integrations/meta-ads/promote-package/', {
        package_id: selectedPackage.id,
        budget: parseFloat(promoteBudget),
        duration_days: parseInt(promoteDuration)
      });
      
      if (response.data.success) {
        alert('Campaign created successfully!');
        setShowPromoteModal(false);
        setSelectedPackage(null);
        setPromoteBudget('500');
        setPromoteDuration('7');
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert('Failed to create campaign. Please check if Meta Ads is connected in Integrations.');
    }
  };

  const submitWhatsAppSend = async () => {
    if (!selectedPackage || !whatsappPhone) return;
    
    try {
      const response = await api.post('/integrations/whatsapp/send-package/', {
        phone_number: whatsappPhone,
        package_id: selectedPackage.id
      });
      
      if (response.data.success) {
        alert('Package details sent via WhatsApp!');
        setShowWhatsAppModal(false);
        setSelectedPackage(null);
        setWhatsappPhone('');
      }
    } catch (error) {
      console.error('Error sending WhatsApp:', error);
      alert('Failed to send WhatsApp message. Please check if WhatsApp Agent is connected in Integrations.');
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Travel Packages</h1>
          <p className="text-gray-600 mt-1">Manage and promote your travel packages</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
            >
              🎴 Grid
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded ${viewMode === 'table' ? 'bg-white shadow-sm' : ''}`}
            >
              📋 Table
            </button>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-md"
          >
            ➕ Add Package
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search packages..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Meta Ads Promotion Modal */}
      {showPromoteModal && selectedPackage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-purple-700">
              📢 Promote "{selectedPackage.name}" on Meta Ads
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Campaign Budget ($)
                </label>
                <input
                  type="number"
                  value={promoteBudget}
                  onChange={(e) => setPromoteBudget(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (days)
                </label>
                <input
                  type="number"
                  value={promoteDuration}
                  onChange={(e) => setPromoteDuration(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="7"
                />
              </div>
              <div className="bg-purple-50 p-3 rounded">
                <p className="text-sm text-purple-700">
                  <strong>Preview:</strong><br />
                  Campaign: "{selectedPackage.name}"<br />
                  Destination: {selectedPackage.destination}<br />
                  Price: ${parseFloat(selectedPackage.base_price).toLocaleString()}<br />
                  Budget: ${promoteBudget} for {promoteDuration} days
                </p>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowPromoteModal(false);
                    setSelectedPackage(null);
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={submitMetaAdsPromotion}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                >
                  Launch Campaign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Send Modal */}
      {showWhatsAppModal && selectedPackage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-green-700">
              💬 Send "{selectedPackage.name}" via WhatsApp
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number (with country code)
                </label>
                <input
                  type="tel"
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="+1234567890"
                />
              </div>
              <div className="bg-green-50 p-3 rounded">
                <p className="text-sm text-green-700">
                  <strong>Message Preview:</strong><br />
                  Hi! Check out this amazing travel package:<br /><br />
                  🏝️ <strong>{selectedPackage.name}</strong><br />
                  📍 {selectedPackage.destination}<br />
                  💰 ${parseFloat(selectedPackage.base_price).toLocaleString()}<br />
                  ⏱️ {selectedPackage.duration} days<br /><br />
                  {selectedPackage.description}
                </p>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowWhatsAppModal(false);
                    setSelectedPackage(null);
                    setWhatsappPhone('');
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={submitWhatsAppSend}
                  disabled={!whatsappPhone}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingPackage ? 'Edit Package' : 'Add Package'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Base Price</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.base_price || ''}
                    onChange={(e) => setFormData({...formData, base_price: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Duration (days)</label>
                  <input
                    type="number"
                    value={formData.duration || ''}
                    onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value) || undefined})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Destination</label>
                <input
                  type="text"
                  value={formData.destination || ''}
                  onChange={(e) => setFormData({...formData, destination: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingPackage ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {filteredPackages.map((pkg, index) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.03 }}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300"
            >
              {/* Package Image Placeholder */}
              <div className="h-48 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 relative">
                <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                  <span className="text-white text-6xl">🏝️</span>
                </div>
                <div className="absolute top-3 right-3 bg-white bg-opacity-90 px-3 py-1 rounded-full">
                  <span className="text-sm font-bold text-purple-600">
                    ${parseFloat(pkg.base_price).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Package Content */}
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-bold text-gray-900 leading-tight">{pkg.name}</h3>
                  {pkg.duration && (
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full ml-2 whitespace-nowrap">
                      {pkg.duration} days
                    </span>
                  )}
                </div>

                {pkg.destination && (
                  <div className="flex items-center text-gray-600 mb-3">
                    <span className="mr-1">📍</span>
                    <span className="text-sm">{pkg.destination}</span>
                  </div>
                )}

                {pkg.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{pkg.description}</p>
                )}

                {/* AI Insights Badge */}
                <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                  <div className="flex items-center text-xs text-purple-700">
                    <span className="mr-1">✨</span>
                    <span className="font-medium">85% booking probability</span>
                  </div>
                  <div className="flex items-center text-xs text-pink-600 mt-1">
                    <span className="mr-1">🔥</span>
                    <span>Trending this week</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between space-x-2">
                  <button
                    onClick={() => handleEdit(pkg)}
                    className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 py-2 rounded-lg text-sm font-medium transition-colors"
                    title="Edit"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handlePromote(pkg)}
                    className="flex-1 bg-purple-50 hover:bg-purple-100 text-purple-600 py-2 rounded-lg text-sm font-medium transition-colors"
                    title="Promote"
                  >
                    📢 Ads
                  </button>
                  <button
                    onClick={() => handleSendWhatsApp(pkg)}
                    className="flex-1 bg-green-50 hover:bg-green-100 text-green-600 py-2 rounded-lg text-sm font-medium transition-colors"
                    title="WhatsApp"
                  >
                    💬 Send
                  </button>
                </div>
              </div>
            </motion.div>
          ))}

          {filteredPackages.length === 0 && (
            <div className="col-span-full text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <p className="text-gray-500 text-lg">No packages found</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
              >
                Create your first package
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destination</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredPackages.map((pkg) => (
              <tr key={pkg.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{pkg.name}</div>
                  {pkg.description && (
                    <div className="text-sm text-gray-500 truncate max-w-xs">{pkg.description}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {pkg.destination || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${parseFloat(pkg.base_price || '0').toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {pkg.duration ? `${pkg.duration} days` : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => handleEdit(pkg)}
                    className="text-blue-600 hover:text-blue-900"
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handlePromote(pkg)}
                    className="text-purple-600 hover:text-purple-900"
                    title="Promote on Meta Ads"
                  >
                    📢
                  </button>
                  <button
                    onClick={() => handleSendWhatsApp(pkg)}
                    className="text-green-600 hover:text-green-900"
                    title="Send via WhatsApp"
                  >
                    💬
                  </button>
                  <button
                    onClick={() => handleDelete(pkg.id)}
                    className="text-red-600 hover:text-red-900"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredPackages.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No packages found
          </div>
        )}
        </div>
      )}
    </div>
  );
}