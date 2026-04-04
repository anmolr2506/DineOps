const posTerminalService = require('../services/posTerminal.service');

const getCustomers = async (req, res) => {
    try {
        const phone = typeof req.query.phone === 'string' ? req.query.phone.trim() : '';
        const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';

        if (phone) {
            const customer = await posTerminalService.findCustomerByPhone({ phone });
            return res.status(200).json({ customer });
        }

        const customers = await posTerminalService.listCustomers({ search });
        return res.status(200).json({ customers });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message || 'Failed to fetch customers.' });
    }
};

const createCustomer = async (req, res) => {
    try {
        const customer = await posTerminalService.createCustomer({
            name: req.body?.name,
            phone: req.body?.phone
        });
        return res.status(201).json({ customer });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message || 'Failed to create customer.' });
    }
};

const createOrder = async (req, res) => {
    try {
        const order = await posTerminalService.createOrder({
            userId: req.user.id,
            payload: req.body || {},
            io: req.app.locals.io
        });

        return res.status(201).json({ order });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message || 'Failed to create order.' });
    }
};

const listOrders = async (req, res) => {
    try {
        const orders = await posTerminalService.getOrders({
            sessionId: req.query.session_id,
            date: req.query.date,
            tableId: req.query.table_id
        });

        return res.status(200).json({ orders });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message || 'Failed to fetch orders.' });
    }
};

const createPayment = async (req, res) => {
    try {
        const payload = await posTerminalService.createPayment({
            userId: req.user.id,
            payload: req.body || {},
            io: req.app.locals.io
        });

        return res.status(201).json(payload);
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message || 'Failed to create payment.' });
    }
};

const decideOrder = async (req, res) => {
    try {
        const orderId = Number(req.params.orderId);
        const action = req.body?.action;

        const result = await posTerminalService.decideOrder({
            userId: req.user.id,
            orderId,
            action,
            io: req.app.locals.io
        });

        return res.status(200).json(result);
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message || 'Failed to update order decision.' });
    }
};

module.exports = {
    getCustomers,
    createCustomer,
    createOrder,
    listOrders,
    createPayment,
    decideOrder
};
