import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

import LandingPage from './pages/LandingPage';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Placeholder Dashboards
const AdminDashboard = () => <div className="p-10 font-bold text-2xl">Admin Dashboard (Protected)</div>;
const StaffDashboard = () => <div className="p-10 font-bold text-2xl">Staff Dashboard (Protected)</div>;
const KitchenDashboard = () => <div className="p-10 font-bold text-2xl">Kitchen Dashboard (Protected)</div>;
const Unauthorized = () => <div className="p-10 text-red-500 font-bold text-2xl">401 Unauthorized</div>;

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />

          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['admin', 'staff']} />}>
            <Route path="/staff/dashboard" element={<StaffDashboard />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['admin', 'kitchen']} />}>
            <Route path="/kitchen/dashboard" element={<KitchenDashboard />} />
          </Route>

          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
