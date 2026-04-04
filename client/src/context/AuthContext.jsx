import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            fetchUser();
        } else {
            setLoading(false);
        }
    }, [token]);

    const fetchUser = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/auth/me');
            setUser(res.data.user);
        } catch (err) {
            console.error("Failed to fetch user, token might be invalid", err);
            setToken(null);
            localStorage.removeItem('token');
            localStorage.removeItem('session_id');
            localStorage.removeItem('session_data');
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
        setToken(res.data.token);
        localStorage.setItem('token', res.data.token);
        setUser({ role: res.data.role, name: res.data.name });
        return res.data;
    };

    const register = async (name, email, password, role) => {
        const res = await axios.post('http://localhost:5000/api/auth/signup', { name, email, password, role });
        return res.data;
    };

    const forgotPassword = async (email) => {
        const res = await axios.post('http://localhost:5000/api/auth/forgot-password', { email });
        return res.data;
    }

    const resetPassword = async (token, newPassword) => {
        const res = await axios.post('http://localhost:5000/api/auth/reset-password', { token, newPassword });
        return res.data;
    }

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('session_id');
        localStorage.removeItem('session_data');
        delete axios.defaults.headers.common['Authorization'];
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, forgotPassword, resetPassword, logout }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
