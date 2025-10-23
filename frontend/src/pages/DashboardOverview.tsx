import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  Users,
  DollarSign,
  Briefcase,
  Package,
  Calendar,
  TrendingUp,
  Plus,
  Target,
  MapPin,
  Clock,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import api from '../api';

interface Stats {
  leads: number;
  customers: number;
  deals: number;
  packages: number;
  bookings: number;
  totalRevenue: number;
}

interface RevenueData {
  date: string;
  revenue: number;
}

interface LeadSourceData {
  name: string;
  value: number;
  color: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5
    }
  }
};

export default function DashboardOverview() {
  const [stats, setStats] = useState<Stats>({
    leads: 0,
    customers: 0,
    deals: 0,
    packages: 0,
    bookings: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [leadSourceData, setLeadSourceData] = useState<LeadSourceData[]>([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [leadsRes, customersRes, dealsRes, packagesRes, bookingsRes] = await Promise.all([
        api.get('/leads'),
        api.get('/customers'),
        api.get('/deals'),
        api.get('/packages'),
        api.get('/bookings'),
      ]);

      const totalRevenue = bookingsRes.data.bookings.reduce((sum: number, booking: any) => sum + parseFloat(booking.total_amount || '0'), 0);

      setStats({
        leads: leadsRes.data.leads.length,
        customers: customersRes.data.customers.length,
        deals: dealsRes.data.deals.length,
        packages: packagesRes.data.packages.length,
        bookings: bookingsRes.data.bookings.length,
        totalRevenue,
      });

      // Generate mock revenue data (last 7 days)
      const mockRevenueData: RevenueData[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        mockRevenueData.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          revenue: Math.floor(Math.random() * 5000) + 2000
        });
      }
      setRevenueData(mockRevenueData);

      // Generate lead source data
      setLeadSourceData([
        { name: 'WhatsApp', value: Math.floor(leadsRes.data.leads.length * 0.45), color: '#10B981' },
        { name: 'Meta Ads', value: Math.floor(leadsRes.data.leads.length * 0.30), color: '#8B5CF6' },
        { name: 'Website', value: Math.floor(leadsRes.data.leads.length * 0.15), color: '#3B82F6' },
        { name: 'Referral', value: Math.floor(leadsRes.data.leads.length * 0.10), color: '#F59E0B' },
      ]);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Leads',
      value: stats.leads,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      trend: '+12%',
      trendUp: true
    },
    {
      title: 'Total Customers',
      value: stats.customers,
      icon: Users,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      trend: '+8%',
      trendUp: true
    },
    {
      title: 'Active Deals',
      value: stats.deals,
      icon: Briefcase,
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600',
      trend: '+5%',
      trendUp: true
    },
    {
      title: 'Travel Packages',
      value: stats.packages,
      icon: Package,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      trend: '0%',
      trendUp: true
    },
    {
      title: 'Total Bookings',
      value: stats.bookings,
      icon: Calendar,
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-600',
      trend: '+18%',
      trendUp: true
    },
    {
      title: 'Total Revenue',
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
      trend: '+24%',
      trendUp: true
    },
  ];

  return (
    <motion.div
      className="p-6 space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div
        className="flex items-center justify-between"
        variants={itemVariants}
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-600 mt-2">Welcome to your Travel CRM SaaS dashboard</p>
        </div>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
            <Plus className="w-4 h-4 mr-2" />
            Quick Add
          </Button>
        </motion.div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        variants={containerVariants}
      >
        {statCards.map((card, index) => (
          <motion.div key={index} variants={itemVariants}>
            <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300" hover>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                    <p className="text-3xl font-bold text-gray-900">{card.value}</p>
                    <div className="flex items-center mt-2">
                      {card.trendUp ? (
                        <ArrowUp className="w-4 h-4 text-green-500 mr-1" />
                      ) : (
                        <ArrowDown className="w-4 h-4 text-red-500 mr-1" />
                      )}
                      <span className={`text-sm font-medium ${card.trendUp ? 'text-green-500' : 'text-red-500'}`}>
                        {card.trend}
                      </span>
                      <span className="text-sm text-gray-500 ml-1">vs last month</span>
                    </div>
                  </div>
                  <div className={`p-4 rounded-2xl ${card.bgColor}`}>
                    <card.icon className={`w-8 h-8 ${card.textColor}`} />
                  </div>
                </div>
                <div className={`h-2 bg-gradient-to-r ${card.color} rounded-full`} />
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts Section */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        variants={containerVariants}
      >
        {/* Revenue Trend Chart */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                Revenue Trend (Last 7 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#3B82F6" 
                    strokeWidth={3}
                    dot={{ fill: '#3B82F6', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Lead Sources Pie Chart */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2 text-purple-600" />
                Lead Sources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={leadSourceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {leadSourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {leadSourceData.map((source, index) => (
                  <div key={index} className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: source.color }} />
                    <span className="text-sm text-gray-700">{source.name}: {source.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Bottom Section */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        variants={containerVariants}
      >
        {/* Quick Actions */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 mr-2 text-blue-600" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto p-4 hover:bg-blue-50 hover:border-blue-200"
                >
                  <div className="flex items-center">
                    <Users className="w-5 h-5 mr-3 text-blue-600" />
                    <div className="text-left">
                      <div className="font-medium text-blue-700">Add New Lead</div>
                      <div className="text-sm text-blue-600">Create a new potential customer</div>
                    </div>
                  </div>
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto p-4 hover:bg-green-50 hover:border-green-200"
                >
                  <div className="flex items-center">
                    <Briefcase className="w-5 h-5 mr-3 text-green-600" />
                    <div className="text-left">
                      <div className="font-medium text-green-700">Create Deal</div>
                      <div className="text-sm text-green-600">Start a new sales opportunity</div>
                    </div>
                  </div>
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant="outline"
                  className="w-full justify-start h-auto p-4 hover:bg-purple-50 hover:border-purple-200"
                >
                  <div className="flex items-center">
                    <Package className="w-5 h-5 mr-3 text-purple-600" />
                    <div className="text-left">
                      <div className="font-medium text-purple-700">Add Package</div>
                      <div className="text-sm text-purple-600">Create a new travel package</div>
                    </div>
                  </div>
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2 text-gray-600" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <motion.div
                  className="flex items-start space-x-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">New lead created</p>
                    <p className="text-xs text-gray-500 flex items-center mt-1">
                      <Clock className="w-3 h-3 mr-1" />
                      2 hours ago
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  className="flex items-start space-x-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Deal closed successfully</p>
                    <p className="text-xs text-gray-500 flex items-center mt-1">
                      <Clock className="w-3 h-3 mr-1" />
                      4 hours ago
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  className="flex items-start space-x-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Booking confirmed</p>
                    <p className="text-xs text-gray-500 flex items-center mt-1">
                      <Clock className="w-3 h-3 mr-1" />
                      1 day ago
                    </p>
                  </div>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}