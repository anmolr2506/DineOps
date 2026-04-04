const pool = require('../config/db');

class DashboardServiceError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
    }
}

const normalizeGlobalFilters = (filters = {}) => {
    const sessionId = Number(filters.session_id);
    const hasSessionFilter = Number.isInteger(sessionId) && sessionId > 0;

    const dateFrom = typeof filters.date_from === 'string' && filters.date_from.trim() ? filters.date_from.trim() : null;
    const dateTo = typeof filters.date_to === 'string' && filters.date_to.trim() ? filters.date_to.trim() : null;

    return {
        sessionId: hasSessionFilter ? sessionId : null,
        dateFrom,
        dateTo
    };
};

const validateSessionAccess = async ({ userId, role, sessionId }) => {
    if (!Number.isInteger(sessionId) || sessionId <= 0) {
        throw new DashboardServiceError('Invalid session_id.', 400);
    }

    if (role === 'admin') {
        const adminSession = await pool.query('SELECT id FROM pos_sessions WHERE id = $1 LIMIT 1', [sessionId]);
        if (!adminSession.rows[0]) {
            throw new DashboardServiceError('Session not found.', 404);
        }
        return;
    }

    const activeSession = await pool.query(
        `
            SELECT id
            FROM pos_sessions
            WHERE id = $1
              AND status = 'active'
            LIMIT 1;
        `,
        [sessionId]
    );

    if (!activeSession.rows[0]) {
        throw new DashboardServiceError('Session not found or inactive.', 404);
    }

    const result = await pool.query(
        `
            SELECT us.id
            FROM user_sessions us
            JOIN pos_sessions ps ON ps.id = us.session_id
            WHERE us.user_id = $1
              AND us.session_id = $2
              AND ps.status = 'active'
            LIMIT 1;
        `,
        [userId, sessionId]
    );

    if (!result.rows[0]) {
        // Self-heal stale/missing user-session links to avoid session mismatch loops.
        await pool.query(
            `
                INSERT INTO user_sessions (user_id, session_id)
                VALUES ($1, $2)
                ON CONFLICT (user_id, session_id)
                DO UPDATE SET joined_at = CURRENT_TIMESTAMP;
            `,
            [userId, sessionId]
        );
    }
};

const getGlobalStats = async (filters = {}) => {
    const { sessionId, dateFrom, dateTo } = normalizeGlobalFilters(filters);

    const query = `
        SELECT
            (
                SELECT COUNT(*)::int
                FROM orders o
                WHERE ($1::int IS NULL OR o.session_id = $1)
                  AND ($2::date IS NULL OR DATE(o.created_at) >= $2::date)
                  AND ($3::date IS NULL OR DATE(o.created_at) <= $3::date)
            ) AS total_orders,
            (
                SELECT COALESCE(SUM(p.amount), 0)::numeric
                FROM payments p
                JOIN orders o ON o.id = p.order_id
                WHERE p.status = 'completed'
                  AND ($1::int IS NULL OR o.session_id = $1)
                  AND ($2::date IS NULL OR DATE(o.created_at) >= $2::date)
                  AND ($3::date IS NULL OR DATE(o.created_at) <= $3::date)
            ) AS total_revenue,
            (
                SELECT COUNT(*)::int
                FROM pos_sessions ps
                WHERE ps.status = 'active'
                  AND ($1::int IS NULL OR ps.id = $1)
            ) AS active_sessions,
            (
                SELECT COUNT(*)::int
                FROM orders o
                WHERE o.status IN ('approved', 'preparing')
                  AND ($1::int IS NULL OR o.session_id = $1)
                  AND ($2::date IS NULL OR DATE(o.created_at) >= $2::date)
                  AND ($3::date IS NULL OR DATE(o.created_at) <= $3::date)
            ) AS orders_in_kitchen;
    `;

    const result = await pool.query(query, [sessionId, dateFrom, dateTo]);
    return result.rows[0] || {
        total_orders: 0,
        total_revenue: 0,
        active_sessions: 0,
        orders_in_kitchen: 0
    };
};

const getAllSessionsSummary = async (filters = {}) => {
    const { sessionId, dateFrom, dateTo } = normalizeGlobalFilters(filters);

    const query = `
        SELECT
            ps.id,
            COALESCE(ps.name, 'Session #' || ps.id::text) AS name,
            ps.status,
            ps.start_time,
            ps.end_time,
            COALESCE(SUM(CASE WHEN o.status = 'paid' THEN o.total_amount ELSE 0 END), 0)::numeric AS revenue,
            COUNT(o.id)::int AS order_count
        FROM pos_sessions ps
        LEFT JOIN orders o
          ON o.session_id = ps.id
         AND ($2::date IS NULL OR DATE(o.created_at) >= $2::date)
         AND ($3::date IS NULL OR DATE(o.created_at) <= $3::date)
        WHERE ($1::int IS NULL OR ps.id = $1)
        GROUP BY ps.id
        ORDER BY ps.start_time DESC, ps.id DESC;
    `;

    const result = await pool.query(query, [sessionId, dateFrom, dateTo]);
    return result.rows;
};

const getGlobalTrend = async (filters = {}) => {
    const { sessionId, dateFrom, dateTo } = normalizeGlobalFilters(filters);

    const query = `
        SELECT
            DATE(o.created_at) AS date,
            COALESCE(SUM(o.total_amount), 0)::numeric AS revenue
        FROM orders o
        WHERE o.status = 'paid'
          AND ($1::int IS NULL OR o.session_id = $1)
          AND ($2::date IS NULL OR DATE(o.created_at) >= $2::date)
          AND ($3::date IS NULL OR DATE(o.created_at) <= $3::date)
        GROUP BY DATE(o.created_at)
        ORDER BY DATE(o.created_at) DESC
        LIMIT 7;
    `;

    const result = await pool.query(query, [sessionId, dateFrom, dateTo]);
    return result.rows.reverse();
};

const getDashboardStats = async (sessionId) => {
    const query = `
        SELECT
            COUNT(*)::int AS total_orders,
            COUNT(*) FILTER (WHERE status = 'pending')::int AS pending_approval,
            COUNT(*) FILTER (WHERE status = 'paid')::int AS paid_orders,
            COALESCE(SUM(total_amount) FILTER (WHERE status = 'paid'), 0)::numeric AS revenue,
            COUNT(DISTINCT table_id) FILTER (WHERE status IN ('pending', 'approved', 'preparing'))::int AS active_tables,
            COUNT(*) FILTER (WHERE status = 'preparing')::int AS in_kitchen
        FROM orders
        WHERE session_id = $1;
    `;

    const result = await pool.query(query, [sessionId]);
    return result.rows[0] || {
        total_orders: 0,
        pending_approval: 0,
        paid_orders: 0,
        revenue: 0,
        active_tables: 0,
        in_kitchen: 0
    };
};

const getRecentOrders = async (sessionId) => {
    const query = `
        SELECT
            o.id,
            o.status,
            o.total_amount,
            o.created_at,
            t.table_number
        FROM orders o
        LEFT JOIN tables t ON t.id = o.table_id
        WHERE o.session_id = $1
        ORDER BY o.created_at DESC
        LIMIT 10;
    `;

    const result = await pool.query(query, [sessionId]);
    return result.rows;
};

const getLiveActivity = async (sessionId) => {
    const query = `
        SELECT
            al.id,
            al.type,
            al.message,
            al.reference_id,
            al.created_at
        FROM activity_logs al
        LEFT JOIN orders o ON o.id = al.reference_id
        WHERE o.session_id = $1 OR al.reference_id IS NULL
        ORDER BY al.created_at DESC
        LIMIT 20;
    `;

    const result = await pool.query(query, [sessionId]);
    return result.rows;
};

const getSalesTrend = async (sessionId) => {
    const query = `
        SELECT
            DATE(created_at) AS date,
            COALESCE(SUM(total_amount), 0)::numeric AS revenue
        FROM orders
        WHERE session_id = $1
          AND status = 'paid'
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at) DESC
        LIMIT 7;
    `;

    const result = await pool.query(query, [sessionId]);
    return result.rows.reverse();
};

module.exports = {
    DashboardServiceError,
    validateSessionAccess,
    getGlobalStats,
    getAllSessionsSummary,
    getGlobalTrend,
    getDashboardStats,
    getRecentOrders,
    getLiveActivity,
    getSalesTrend
};
