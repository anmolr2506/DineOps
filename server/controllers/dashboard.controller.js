const pool = require('../config/db');
const { emitToSession } = require('../realtime');

const toNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const parseSessionId = async (req) => {
    const requested = Number.parseInt(req.query.session_id || req.query.sessionId, 10);
    if (Number.isInteger(requested) && requested > 0) {
        return requested;
    }

    const openSession = await pool.query(
        "SELECT id FROM pos_sessions WHERE status = 'open' ORDER BY start_time DESC LIMIT 1"
    );

    if (openSession.rows[0]?.id) {
        return openSession.rows[0].id;
    }

    const latestSession = await pool.query(
        'SELECT id FROM pos_sessions ORDER BY start_time DESC LIMIT 1'
    );

    return latestSession.rows[0]?.id ?? null;
};

const loadKpisForSession = async (sessionId) => {
    const kpiResult = await pool.query(
        'SELECT * FROM dashboard_kpis WHERE session_id = $1 LIMIT 1',
        [sessionId]
    );

    const row = kpiResult.rows[0];
    if (!row) {
        return {
            session_id: sessionId,
            total_orders: 0,
            pending_orders: 0,
            paid_orders: 0,
            incoming_orders: 0,
            preparing_orders: 0,
            active_tables: 0,
            total_tables: 0,
            today_revenue: 0,
            avg_order_value: 0,
            status_updates: 0,
        };
    }

    const activityResult = await pool.query(
        'SELECT COUNT(*)::int AS status_updates FROM live_activity WHERE session_id = $1',
        [sessionId]
    );

    return {
        session_id: row.session_id,
        total_orders: toNumber(row.total_orders),
        pending_orders: toNumber(row.pending_orders),
        paid_orders: toNumber(row.paid_orders),
        incoming_orders: toNumber(row.incoming_orders),
        preparing_orders: toNumber(row.preparing_orders),
        active_tables: toNumber(row.active_tables),
        total_tables: toNumber(row.total_tables),
        today_revenue: toNumber(row.today_revenue),
        avg_order_value: toNumber(row.avg_order_value),
        status_updates: toNumber(activityResult.rows[0]?.status_updates),
    };
};

exports.getKpis = async (req, res) => {
    try {
        const sessionId = await parseSessionId(req);
        if (!sessionId) {
            return res.json({
                session_id: null,
                total_orders: 0,
                pending_orders: 0,
                paid_orders: 0,
                incoming_orders: 0,
                preparing_orders: 0,
                active_tables: 0,
                total_tables: 0,
                today_revenue: 0,
                avg_order_value: 0,
                status_updates: 0,
            });
        }

        const kpis = await loadKpisForSession(sessionId);
        res.json(kpis);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getRevenueTrend = async (req, res) => {
    try {
        const sessionId = await parseSessionId(req);
        if (!sessionId) {
            return res.json([]);
        }

        const result = await pool.query(
            'SELECT date, revenue FROM revenue_trend WHERE session_id = $1 ORDER BY date ASC',
            [sessionId]
        );

        res.json(result.rows.map((row) => ({
            date: row.date,
            revenue: toNumber(row.revenue),
        })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getDailySales = async (req, res) => {
    try {
        const sessionId = await parseSessionId(req);
        if (!sessionId) {
            return res.json([]);
        }

        const result = await pool.query(
            'SELECT date, orders_count, total_sales FROM daily_sales WHERE session_id = $1 ORDER BY date ASC',
            [sessionId]
        );

        res.json(result.rows.map((row) => ({
            date: row.date,
            orders_count: toNumber(row.orders_count),
            total_sales: toNumber(row.total_sales),
        })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getTopProducts = async (req, res) => {
    try {
        const sessionId = await parseSessionId(req);
        if (!sessionId) {
            return res.json([]);
        }

        const result = await pool.query(
            'SELECT name, total_sold, revenue FROM top_products WHERE session_id = $1 ORDER BY total_sold DESC LIMIT 8',
            [sessionId]
        );

        res.json(result.rows.map((row) => ({
            name: row.name,
            total_sold: toNumber(row.total_sold),
            revenue: toNumber(row.revenue),
        })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getCategoryPerformance = async (req, res) => {
    try {
        const sessionId = await parseSessionId(req);
        if (!sessionId) {
            return res.json([]);
        }

        const result = await pool.query(
            'SELECT category, revenue, percentage FROM category_performance WHERE session_id = $1 ORDER BY revenue DESC',
            [sessionId]
        );

        res.json(result.rows.map((row) => ({
            category: row.category,
            revenue: toNumber(row.revenue),
            percentage: toNumber(row.percentage),
        })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getRecentOrders = async (req, res) => {
    try {
        const sessionId = await parseSessionId(req);
        if (!sessionId) {
            return res.json([]);
        }

        const result = await pool.query(
            `SELECT id, table_number, source, status, total_amount, created_at
             FROM recent_orders
             WHERE session_id = $1
             ORDER BY created_at DESC
             LIMIT 10`,
            [sessionId]
        );

        res.json(result.rows.map((row) => ({
            id: row.id,
            table_number: row.table_number,
            source: row.source,
            status: row.status,
            total_amount: toNumber(row.total_amount),
            created_at: row.created_at,
        })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getLiveActivity = async (req, res) => {
    try {
        const sessionId = await parseSessionId(req);
        if (!sessionId) {
            return res.json([]);
        }

        const result = await pool.query(
            `SELECT id, type, message, reference_id, created_at
             FROM live_activity
             WHERE session_id = $1
             ORDER BY created_at DESC
             LIMIT 20`,
            [sessionId]
        );

        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getOngoingPreparation = async (req, res) => {
    try {
        const sessionId = await parseSessionId(req);
        if (!sessionId) {
            return res.json([]);
        }

        const result = await pool.query(
            `SELECT order_id, session_id, table_number, status, source, created_at
             FROM ongoing_preparation
             WHERE session_id = $1
             ORDER BY created_at ASC`,
            [sessionId]
        );

        res.json(result.rows.map((row) => ({
            order_id: row.order_id,
            session_id: row.session_id,
            table_number: row.table_number,
            status: row.status,
            source: row.source,
            created_at: row.created_at,
        })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updatePreparationStatus = async (req, res) => {
    const client = await pool.connect();
    try {
        const orderId = Number.parseInt(req.params.orderId, 10);
        const nextStatus = (req.body.status || 'completed').toLowerCase();

        if (!Number.isInteger(orderId)) {
            return res.status(400).json({ error: 'Invalid order id.' });
        }

        if (!['completed', 'preparing'].includes(nextStatus)) {
            return res.status(400).json({ error: 'Invalid status update.' });
        }

        await client.query('BEGIN');

        const current = await client.query(
            'SELECT id, status, session_id FROM orders WHERE id = $1 FOR UPDATE',
            [orderId]
        );

        const order = current.rows[0];
        if (!order) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Order not found.' });
        }

        await client.query(
            'UPDATE orders SET status = $1 WHERE id = $2',
            [nextStatus, orderId]
        );

        await client.query(
            'INSERT INTO order_status_history (order_id, status) VALUES ($1, $2)',
            [orderId, nextStatus]
        );

        await client.query(
            'INSERT INTO activity_logs (type, message, reference_id) VALUES ($1, $2, $3)',
            [
                'kitchen_update',
                `Order #${orderId} status updated to ${nextStatus}.`,
                orderId,
            ]
        );

        await client.query('COMMIT');

        emitToSession(order.session_id, 'dashboard:update', {
            reason: 'kitchen-status-updated',
            order_id: orderId,
            status: nextStatus,
        });

        res.json({
            message: 'Order status updated.',
            order_id: orderId,
            status: nextStatus,
            session_id: order.session_id,
        });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
};

