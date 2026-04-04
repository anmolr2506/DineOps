const reservationService = require('../services/customerReservation.service');

const getCustomerFloorPlan = async (req, res) => {
    try {
        const data = await reservationService.getCustomerFloorPlan({
            date: req.query.date,
            time: req.query.time,
            durationMinutes: req.query.duration_minutes,
            holdToken: req.query.hold_token
        });
        return res.status(200).json(data);
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message || 'Failed to load customer floor plan.' });
    }
};

const acquireTableHold = async (req, res) => {
    try {
        const tableId = Number(req.body?.table_id);
        if (!Number.isInteger(tableId) || tableId <= 0) {
            return res.status(400).json({ error: 'table_id must be a positive integer.' });
        }

        const hold = await reservationService.acquireTableHold({
            tableId,
            date: req.body?.date,
            time: req.body?.time,
            durationMinutes: req.body?.duration_minutes,
            holdToken: req.body?.hold_token,
            io: req.app.locals.io
        });

        return res.status(200).json({ hold });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message || 'Failed to acquire table hold.' });
    }
};

const releaseTableHold = async (req, res) => {
    try {
        await reservationService.releaseTableHold({
            holdToken: req.body?.hold_token,
            io: req.app.locals.io
        });

        return res.status(200).json({ message: 'Hold released.' });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message || 'Failed to release table hold.' });
    }
};

const createReservation = async (req, res) => {
    try {
        const reservation = await reservationService.createReservation({
            payload: req.body || {},
            io: req.app.locals.io
        });

        return res.status(201).json({ reservation });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message || 'Failed to create reservation.' });
    }
};

module.exports = {
    getCustomerFloorPlan,
    acquireTableHold,
    releaseTableHold,
    createReservation
};
