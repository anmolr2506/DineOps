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
import DashboardSidebar from './components/layout/DashboardSidebar';
import MenuPage from './pages/MenuPage';
import PosPage from './pages/PosPage';

const DashboardView = ({ title }) => (
  <div className="min-h-screen bg-linear-to-br from-[#050b17] via-[#0b1a30] to-[#0f2442] text-[#f8efe0] md:flex">
    <DashboardSidebar />
    <main className="flex-1 p-4 sm:p-8">
      <SessionBadge />
      <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-2xl font-bold">{title}</div>
    </main>
  </div>
);

// Placeholder Dashboards
const AdminDashboard = () => <DashboardView title="Admin Dashboard (Protected)" />;
const StaffDashboard = () => <DashboardView title="Staff Dashboard (Protected)" />;
const KitchenDashboard = () => <DashboardView title="Kitchen Dashboard (Protected)" />;
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

            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/dashboard" element={<Navigate to="/dashboard" replace />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['admin', 'staff']} />}>
              <Route path="/pos" element={<PosPage />} />
              <Route path="/staff/dashboard" element={<Navigate to="/pos" replace />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['kitchen']} />}>
              <Route path="/kitchen" element={<KitchenDashboard />} />
              <Route path="/kitchen/dashboard" element={<Navigate to="/kitchen" replace />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['admin', 'staff', 'kitchen']} />}>
              <Route path="/menu" element={<MenuPage />} />
              <Route path="/categories" element={<Navigate to="/menu?tab=categories" replace />} />
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
