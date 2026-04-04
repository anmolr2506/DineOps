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

    return stoppedSession;
};

module.exports = {
    ServiceError,
    getActiveSessions,
    joinSession,
    getCurrentSession,
    createSession,
    stopSession
};
