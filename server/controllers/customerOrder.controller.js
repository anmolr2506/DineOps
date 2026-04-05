const customerQrService = require('../services/customerQr.service');

const generateSessionQrs = async (req, res) => {
    try {
        const sessionId = Number(req.params.sessionId);
        const refresh = String(req.query.refresh || '').trim() === '1' || String(req.query.refresh || '').trim().toLowerCase() === 'true';

        const payload = await customerQrService.generateSessionQrs({ sessionId, refresh });
        return res.status(200).json(payload);
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message || 'Failed to generate QR codes.' });
    }
};

const getCustomerContext = async (req, res) => {
    try {
        const payload = await customerQrService.getCustomerContext({
            sessionId: req.query.session_id,
            tableId: req.query.table_id,
            token: req.query.token
        });

        return res.status(200).json(payload);
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message || 'Failed to load customer context.' });
    }
};

const createCustomerOrder = async (req, res) => {
    try {
        const order = await customerQrService.createCustomerOrder({
            payload: req.body || {},
            io: req.app.locals.io
        });

        return res.status(201).json({ order });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message || 'Failed to create customer order.' });
    }
};

const createCustomerRazorpayOrder = async (req, res) => {
    try {
        const payload = await customerQrService.createCustomerRazorpayOrder({
            orderId: req.params.id,
            payload: req.body || {}
        });

        return res.status(200).json(payload);
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message || 'Failed to create Razorpay order.' });
    }
};

const completeCustomerPayment = async (req, res) => {
    try {
        const payload = await customerQrService.completeCustomerPayment({
            orderId: req.params.id,
            payload: req.body || {},
            io: req.app.locals.io
        });

        return res.status(200).json(payload);
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message || 'Failed to complete payment.' });
    }
};

const verifyCustomerRazorpayPayment = async (req, res) => {
    try {
        const payload = await customerQrService.verifyCustomerRazorpayPayment({
            orderId: req.params.id,
            payload: req.body || {},
            io: req.app.locals.io
        });

        return res.status(200).json(payload);
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message || 'Failed to verify Razorpay payment.' });
    }
};

const getCustomerOrderStatus = async (req, res) => {
    try {
        const statusPayload = await customerQrService.getCustomerOrderStatus({
            orderId: req.params.id,
            sessionId: req.query.session_id,
            tableId: req.query.table_id,
            token: req.query.token
        });

        return res.status(200).json(statusPayload);
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message || 'Failed to load order status.' });
    }
};

module.exports = {
    generateSessionQrs,
    getCustomerContext,
    createCustomerOrder,
    createCustomerRazorpayOrder,
    completeCustomerPayment,
    verifyCustomerRazorpayPayment,
    getCustomerOrderStatus
};
