import { Navigate, Outlet } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRoleHomeRoute } from '../utils/roleRoutes';

export const ProtectedRoute = ({ allowedRoles, requireSession = true }) => {
    const { user, token } = useAuth();
    const location = useLocation();
    const selectedSessionId = localStorage.getItem('session_id');

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    if (user?.approval_status && user.approval_status !== 'approved' && location.pathname !== '/waiting') {
        return <Navigate to="/waiting" replace />;
    }

    if (user?.approval_status === 'approved' && location.pathname === '/waiting') {
        return <Navigate to={getRoleHomeRoute(user?.role)} replace />;
    }

    if (requireSession && !selectedSessionId) {
        return <Navigate to="/sessions" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user?.role)) {
        return <Navigate to={getRoleHomeRoute(user?.role)} replace />;
    }

    return <Outlet />;
};
