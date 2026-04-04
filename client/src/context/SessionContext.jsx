import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SessionContext = createContext();

export const useSession = () => useContext(SessionContext);

export const SessionProvider = ({ children }) => {
    const { token, user } = useAuth();
    const [currentSession, setCurrentSession] = useState(null);
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        if (!token) {
            setCurrentSession(null);
            localStorage.removeItem('session_id');
            localStorage.removeItem('session_data');
            return;
        }

        const socketClient = io('http://localhost:5000', {
            autoConnect: true,
            transports: ['websocket']
        });

        setSocket(socketClient);

        return () => {
            socketClient.disconnect();
            setSocket(null);
        };
    }, [token]);

    useEffect(() => {
        const cachedSession = localStorage.getItem('session_data');
        if (cachedSession) {
            try {
                setCurrentSession(JSON.parse(cachedSession));
            } catch (error) {
                localStorage.removeItem('session_data');
            }
        }
    }, []);

    useEffect(() => {
        if (socket && currentSession?.id) {
            socket.emit('join_session_room', currentSession.id);
        }
    }, [socket, currentSession]);

    const getActiveSessions = async () => {
        const response = await axios.get('http://localhost:5000/api/sessions/active');
        return response.data.sessions || [];
    };

    const joinSession = async (sessionId) => {
        const payload = { session_id: sessionId };
        if (socket?.id) {
            payload.socket_id = socket.id;
        }

        const response = await axios.post('http://localhost:5000/api/sessions/join', payload);
        const session = response.data.session;

        localStorage.setItem('session_id', String(session.id));
        localStorage.setItem('session_data', JSON.stringify(session));
        setCurrentSession(session);

        return session;
    };

    const createSession = async (name) => {
        const response = await axios.post('http://localhost:5000/api/sessions', {
            name: name || null
        });
        return response.data.session;
    };

    const stopSession = async (sessionId) => {
        const response = await axios.patch(`http://localhost:5000/api/sessions/${sessionId}/stop`);
        return response.data.session;
    };

    const updateSessionPaymentSettings = async (sessionId, payload) => {
        const response = await axios.patch(`http://localhost:5000/api/sessions/${sessionId}/payment-settings`, payload);
        return response.data.session;
    };

    const loadCurrentSession = async () => {
        const response = await axios.get('http://localhost:5000/api/sessions/current');
        const session = response.data.session;
        if (session) {
            localStorage.setItem('session_id', String(session.session_id || session.id));
            localStorage.setItem('session_data', JSON.stringify(session));
            setCurrentSession(session);
        }
        return session;
    };

    const clearSession = () => {
        localStorage.removeItem('session_id');
        localStorage.removeItem('session_data');
        setCurrentSession(null);
    };

    const value = useMemo(() => ({
        currentSession,
        getActiveSessions,
        joinSession,
        createSession,
        stopSession,
        updateSessionPaymentSettings,
        loadCurrentSession,
        clearSession,
        hasSelectedSession: Boolean(localStorage.getItem('session_id')),
        user
    }), [currentSession, user]);

    return (
        <SessionContext.Provider value={value}>
            {children}
        </SessionContext.Provider>
    );
};
