import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SessionProvider } from './context/SessionContext';
import { ProtectedRoute } from './components/ProtectedRoute';

import LandingPage from './pages/LandingPage';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import SessionSelection from './pages/SessionSelection';
import SessionBadge from './components/SessionBadge';

import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './pages/dashboard/Dashboard';

// Placeholder Dashboards
const StaffDashboard = () => (
  <div className="min-h-screen bg-[#081325] p-6 sm:p-10 text-[#f4ead2]">
    <SessionBadge />
    <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-2xl font-bold">Staff Dashboard (Protected)</div>
  </div>
);
const KitchenDashboard = () => (
  <div className="min-h-screen bg-[#081325] p-6 sm:p-10 text-[#f4ead2]">
    <SessionBadge />
    <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-2xl font-bold">Kitchen Dashboard (Protected)</div>
  </div>
);
const Unauthorized = () => <div className="p-10 text-red-500 font-bold text-2xl">401 Unauthorized</div>;

function App() {
  return (
    <AuthProvider>
      <SessionProvider>
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />

            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route element={<ProtectedRoute requireSession={false} />}>
              <Route path="/sessions/select" element={<SessionSelection />} />
            </Route>

            {/* Dashboard Layout Routes */}
            <Route path="/" element={<DashboardLayout />}>
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="admin/dashboard" element={<Navigate to="/dashboard" replace />} />
                <Route path="inventory" element={<div className="text-white">Inventory Placeholder</div>} />
                <Route path="transactions" element={<div className="text-white">Transactions Placeholder</div>} />
                <Route path="sommelier" element={<div className="text-white">Sommelier AI Placeholder</div>} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['staff']} />}>
              <Route path="/pos" element={<StaffDashboard />} />
              <Route path="/staff/dashboard" element={<Navigate to="/pos" replace />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['kitchen']} />}>
              <Route path="/kitchen" element={<KitchenDashboard />} />
              <Route path="/kitchen/dashboard" element={<Navigate to="/kitchen" replace />} />
            </Route>

            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </SessionProvider>
    </AuthProvider>
  );
}

export default App;
