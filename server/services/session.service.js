const sessionModel = require('../models/session.model');

class ServiceError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
    }
}

const getActiveSessions = async () => {
    return sessionModel.getActiveSessions();
};

const getAllSessions = async () => {
    return sessionModel.getAllSessions();
};

const emitDashboardRefresh = (io, sessionId = null) => {
    if (!io) return;

    io.emit('dashboard_refresh', {
        scope: sessionId ? 'session' : 'global',
        session_id: sessionId || null,
        at: new Date().toISOString()
    });

    if (sessionId) {
        io.to(`session_${sessionId}`).emit('dashboard_refresh', {
            scope: 'session',
            session_id: sessionId,
            at: new Date().toISOString()
        });
    }
};

const joinSession = async ({ userId, sessionId, io, socketId }) => {
    if (!Number.isInteger(sessionId) || sessionId <= 0) {
        throw new ServiceError('Invalid session_id. It must be a positive integer.', 400);
    }

    const session = await sessionModel.getActiveSessionById(sessionId);
    if (!session) {
        throw new ServiceError('Session not found or not active.', 404);
    }

    const userSession = await sessionModel.upsertUserSession(userId, sessionId);

    if (io && socketId) {
        const socket = io.sockets.sockets.get(socketId);
        if (socket) {
            const roomName = `session_${sessionId}`;
            socket.join(roomName);
            io.to(roomName).emit('user_joined_session', {
                user_id: userId,
                session_id: sessionId,
                joined_at: userSession.joined_at
            });
        }
    }

    emitDashboardRefresh(io, sessionId);

    return {
        ...session,
        joined_at: userSession.joined_at
    };
};

const getCurrentSession = async (userId) => {
    const currentSession = await sessionModel.getCurrentSessionForUser(userId);
    if (!currentSession) {
        throw new ServiceError('No active session found for this user.', 404);
    }

    return currentSession;
};

const createSession = async ({ openedBy, name, io }) => {
    const trimmedName = typeof name === 'string' ? name.trim() : '';
    if (trimmedName.length > 120) {
        throw new ServiceError('Session name must be 120 characters or less.', 400);
    }

    const createdSession = await sessionModel.createSession({
        openedBy,
        name: trimmedName || null
    });

    if (io) {
        io.emit('session_created', createdSession);
    }

    emitDashboardRefresh(io);

    return createdSession;
};

const stopSession = async ({ sessionId, io }) => {
    if (!Number.isInteger(sessionId) || sessionId <= 0) {
        throw new ServiceError('Invalid session id.', 400);
    }

    const activeSession = await sessionModel.getActiveSessionById(sessionId);
    if (!activeSession) {
        throw new ServiceError('Session not found or already stopped.', 404);
    }

    const stoppedSession = await sessionModel.stopSessionById(sessionId);

    if (io) {
        io.emit('session_stopped', stoppedSession);
    }

    emitDashboardRefresh(io, sessionId);

    return stoppedSession;
};

const updateSessionPaymentSettings = async ({ sessionId, payload, io }) => {
    if (!Number.isInteger(sessionId) || sessionId <= 0) {
        throw new ServiceError('Invalid session id.', 400);
    }

    const activeSession = await sessionModel.getActiveSessionById(sessionId);
    if (!activeSession) {
        throw new ServiceError('Session not found or already stopped.', 404);
    }

    const allowCash = Boolean(payload.allow_cash);
    const allowDigital = Boolean(payload.allow_digital);
    const allowUpi = Boolean(payload.allow_upi);
    const upiIdRaw = typeof payload.upi_id === 'string' ? payload.upi_id.trim() : '';
    const upiId = allowUpi ? upiIdRaw : null;

    if (!allowCash && !allowDigital && !allowUpi) {
        throw new ServiceError('At least one payment mode must be enabled.', 400);
    }

    if (allowUpi && !upiId) {
        throw new ServiceError('UPI ID is required when UPI payment is enabled.', 400);
    }

    if (upiId && upiId.length > 120) {
        throw new ServiceError('UPI ID must be 120 characters or less.', 400);
    }

    const updatedSession = await sessionModel.updateSessionPaymentSettings({
        sessionId,
        allowCash,
        allowDigital,
        allowUpi,
        upiId
    });

    if (io) {
        io.emit('session_payment_settings_updated', updatedSession);
    }

    emitDashboardRefresh(io, sessionId);

    return updatedSession;
};

module.exports = {
    ServiceError,
    getActiveSessions,
    getAllSessions,
    joinSession,
    getCurrentSession,
    createSession,
    stopSession,
    updateSessionPaymentSettings
};
