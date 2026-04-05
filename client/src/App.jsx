import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SessionProvider } from './context/SessionContext';
import { ProtectedRoute } from './components/ProtectedRoute';

import HomePage from './pages/HomePage';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import CustomerOrderPage from './pages/CustomerOrderPage';
import CustomerReservationPage from './pages/CustomerReservationPage';
import WaitingApproval from './pages/WaitingApproval';
import GlobalDashboard from './pages/GlobalDashboard';
import SessionDashboard from './pages/SessionDashboard';
import SessionSelection from './pages/SessionSelection';
import FloorPlanPage from './pages/FloorPlanPage';
import MenuPage from './pages/MenuPage';
import PosPage from './pages/PosPage';
import POSTerminal from './pages/POSTerminal';
import PaymentPage from './pages/PaymentPage';
import CustomersPage from './pages/CustomersPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import KitchenPage from './pages/KitchenPage';
import RestaurantSettings from './pages/RestaurantSettings';
import ProfileDock from './components/layout/ProfileDock';
const Unauthorized = () => <div className="p-10 text-red-500 font-bold text-2xl">401 Unauthorized</div>;

function App() {
  return (
    <AuthProvider>
      <SessionProvider>
        <Router>
          <ProfileDock />
          <Routes>
            <Route path="/" element={<HomePage />} />

            <Route path="/customer/order" element={<CustomerOrderPage />} />
            <Route path="/customer/reservation" element={<CustomerReservationPage />} />

            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route element={<ProtectedRoute requireSession={false} />}>
              <Route path="/waiting" element={<WaitingApproval />} />
            </Route>

            <Route element={<ProtectedRoute requireSession={false} />}>
              <Route path="/sessions" element={<SessionSelection />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['admin', 'staff']} requireSession={false} />}>
              <Route path="/dashboard" element={<GlobalDashboard />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['admin', 'staff', 'kitchen']} />}>
              <Route path="/session-dashboard" element={<SessionDashboard />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['admin', 'staff', 'kitchen']} requireSession={false} />}>
              <Route path="/floor-plan" element={<FloorPlanPage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['admin']} requireSession={false} />}>
              <Route path="/admin/dashboard" element={<Navigate to="/dashboard" replace />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['admin', 'staff']} />}>
              <Route path="/terminal" element={<POSTerminal />} />
              <Route path="/terminal/payment" element={<PaymentPage />} />
              <Route path="/terminal/legacy" element={<PosPage />} />
              <Route path="/pos" element={<Navigate to="/terminal" replace />} />
              <Route path="/staff/dashboard" element={<Navigate to="/pos" replace />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['admin']} requireSession={false} />}>
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/order-history" element={<OrderHistoryPage />} />
              <Route path="/restaurant-settings" element={<RestaurantSettings />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['admin', 'kitchen']} />}>
              <Route path="/kitchen" element={<KitchenPage />} />
              <Route path="/kitchen/dashboard" element={<Navigate to="/kitchen" replace />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['admin', 'staff', 'kitchen']} requireSession={false} />}>
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

