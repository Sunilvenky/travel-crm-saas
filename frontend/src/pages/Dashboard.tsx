import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    navigate('/login');
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/leads', label: 'Leads', icon: '👥' },
    { path: '/customers', label: 'Customers', icon: '🤝' },
    { path: '/deals', label: 'Deals', icon: '💼' },
    { path: '/packages', label: 'Packages', icon: '�' },
    { path: '/bookings', label: 'Bookings', icon: '📅' },
    { path: '/ads-dashboard', label: 'Ads Dashboard', icon: '📢' },
    { path: '/integrations', label: 'Integrations', icon: '🔌' },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Enhanced Sidebar - Keeping Original Structure */}
      <motion.div
        className="w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col"
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Enhanced Header with Gradient */}
        <motion.div
          className="flex items-center justify-center h-16 bg-gradient-to-r from-blue-600 to-blue-700 shadow-sm"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <h1 className="text-white text-xl font-bold">Travel CRM</h1>
        </motion.div>

        {/* Enhanced Navigation */}
        <nav className="flex-1 mt-8">
          <div className="px-4 space-y-2">
            {navItems.map((item, index) => {
              const isActive = location.pathname === item.path;
              return (
                <motion.div
                  key={item.path}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link
                    to={item.path}
                    className={`flex items-center px-4 py-3 rounded-lg transition-all duration-300 group relative overflow-hidden ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 shadow-sm border-r-4 border-blue-600'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:shadow-md'
                    }`}
                  >
                    {/* Animated background on hover */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-blue-50 to-transparent opacity-0 group-hover:opacity-100"
                      initial={false}
                      transition={{ duration: 0.3 }}
                    />

                    <motion.span
                      className="mr-3 text-lg relative z-10"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.2 }}
                    >
                      {item.icon}
                    </motion.span>
                    <span className="font-medium relative z-10">{item.label}</span>

                    {/* Active indicator */}
                    {isActive && (
                      <motion.div
                        className="absolute right-2 w-2 h-2 bg-blue-600 rounded-full"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                      />
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </nav>

        {/* Enhanced Logout Button */}
        <motion.div
          className="p-4 border-t border-gray-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.3 }}
        >
          <motion.button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-700 rounded-lg transition-all duration-300 group"
            whileHover={{
              scale: 1.02,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.span
              className="mr-3 text-lg group-hover:scale-110 transition-transform duration-200"
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.3 }}
            >
              🚪
            </motion.span>
            <span className="font-medium">Logout</span>
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Enhanced Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <motion.header
          className="bg-white shadow-sm h-16 flex items-center px-6 border-b border-gray-200"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <motion.h2
            className="text-xl font-semibold text-gray-800"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          >
            Travel CRM SaaS
          </motion.h2>
        </motion.header>

        <motion.main
          className="flex-1 overflow-y-auto bg-gray-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </motion.main>
      </div>
    </div>
  );
}