import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRoleHomeRoute } from '../utils/roleRoutes';

export const ProtectedRoute = ({ allowedRoles, requireSession = true }) => {
    const { user, token } = useAuth();
    const selectedSessionId = localStorage.getItem('session_id');

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    if (requireSession && !selectedSessionId) {
        return <Navigate to="/sessions/select" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user?.role)) {
        return <Navigate to={getRoleHomeRoute(user?.role)} replace />;
    }

    return <Outlet />;
};
