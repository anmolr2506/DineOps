import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ allowedRoles }) => {
    const { user, token } = useAuth();

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user?.role)) {
        // Redirect completely if role doesn't match
        if (user?.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
        if (user?.role === 'staff') return <Navigate to="/staff/dashboard" replace />;
        if (user?.role === 'kitchen') return <Navigate to="/kitchen/dashboard" replace />;
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};
