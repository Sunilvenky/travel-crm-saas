import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DashboardOverview from './pages/DashboardOverview';
import Leads from './pages/Leads';
import Customers from './pages/Customers';
import Deals from './pages/Deals';
import Packages from './pages/Packages';
import Bookings from './pages/Bookings';
import Integrations from './pages/Integrations';
import { ToastProvider } from './components/ui/toast';

function App() {
  const isAuthenticated = true; // Temporarily bypass authentication for testing

  return (
    <ToastProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route
              path="/login"
              element={isAuthenticated ? <Navigate to="/" /> : <Login />}
            />
            <Route
              path="/"
              element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />}
            >
              <Route index element={<DashboardOverview />} />
              <Route path="leads" element={<Leads />} />
              <Route path="customers" element={<Customers />} />
              <Route path="deals" element={<Deals />} />
              <Route path="packages" element={<Packages />} />
              <Route path="bookings" element={<Bookings />} />
              <Route path="integrations" element={<Integrations />} />
            </Route>
          </Routes>
        </div>
      </Router>
    </ToastProvider>
  );
}

export default App;
