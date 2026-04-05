const sessionService = require('../services/session.service');

const getActiveSessions = async (req, res) => {
    try {
        const sessions = await sessionService.getActiveSessions();
        return res.status(200).json({ sessions });
    } catch (err) {
        return res.status(500).json({ error: err.message || 'Failed to fetch active sessions.' });
    }
};

const getAllSessions = async (req, res) => {
    try {
        const sessions = await sessionService.getAllSessions();
        return res.status(200).json({ sessions });
    } catch (err) {
        return res.status(500).json({ error: err.message || 'Failed to fetch sessions.' });
    }
};

const joinSession = async (req, res) => {
    try {
        const sessionId = Number(req.body.session_id);
        const socketId = req.body.socket_id;

        const session = await sessionService.joinSession({
            userId: req.user.id,
            sessionId,
            io: req.app.locals.io,
            socketId
        });

        return res.status(200).json({
            message: 'Session joined successfully.',
            session
        });
    } catch (err) {
        const statusCode = err.statusCode || 500;
        return res.status(statusCode).json({ error: err.message || 'Failed to join session.' });
    }
};

const getCurrentSession = async (req, res) => {
    try {
        const currentSession = await sessionService.getCurrentSession(req.user.id);
        return res.status(200).json({ session: currentSession });
    } catch (err) {
        const statusCode = err.statusCode || 500;
        return res.status(statusCode).json({ error: err.message || 'Failed to fetch current session.' });
    }
};

const createSession = async (req, res) => {
    try {
        const sessionName = req.body?.name;
        const createdSession = await sessionService.createSession({
            openedBy: req.user.id,
            name: sessionName,
            io: req.app.locals.io
        });

        return res.status(201).json({
            message: 'Session created successfully.',
            session: createdSession
        });
    } catch (err) {
        const statusCode = err.statusCode || 500;
        return res.status(statusCode).json({ error: err.message || 'Failed to create session.' });
    }
};

const stopSession = async (req, res) => {
    try {
        const sessionId = Number(req.params.sessionId);
        const stoppedSession = await sessionService.stopSession({
            sessionId,
            io: req.app.locals.io
        });

        return res.status(200).json({
            message: 'Session stopped successfully.',
            session: stoppedSession
        });
    } catch (err) {
        const statusCode = err.statusCode || 500;
        return res.status(statusCode).json({ error: err.message || 'Failed to stop session.' });
    }
};

const updatePaymentSettings = async (req, res) => {
    try {
        const sessionId = Number(req.params.sessionId);
        const updatedSession = await sessionService.updateSessionPaymentSettings({
            sessionId,
            payload: req.body || {},
            io: req.app.locals.io
        });

        return res.status(200).json({
            message: 'Session payment settings updated successfully.',
            session: updatedSession
        });
    } catch (err) {
        const statusCode = err.statusCode || 500;
        return res.status(statusCode).json({ error: err.message || 'Failed to update session payment settings.' });
    }
};

module.exports = {
    getActiveSessions,
    getAllSessions,
    joinSession,
    getCurrentSession,
    createSession,
    stopSession,
    updatePaymentSettings
};
