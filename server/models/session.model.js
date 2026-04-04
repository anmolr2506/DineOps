const pool = require('../config/db');

const getActiveSessions = async () => {
    const query = `
        SELECT
            id,
            COALESCE(name, 'Session #' || id::text) AS name,
            start_time,
            end_time,
            status
        FROM pos_sessions
        WHERE status = 'active'
        ORDER BY start_time DESC;
    `;
    const result = await pool.query(query);
    return result.rows;
};

const getActiveSessionById = async (sessionId) => {
    const query = `
        SELECT
            id,
            COALESCE(name, 'Session #' || id::text) AS name,
            start_time,
            end_time,
            status
        FROM pos_sessions
        WHERE id = $1 AND status = 'active'
        LIMIT 1;
    `;
    const result = await pool.query(query, [sessionId]);
    return result.rows[0] || null;
};

const upsertUserSession = async (userId, sessionId) => {
    const query = `
        INSERT INTO user_sessions (user_id, session_id)
        VALUES ($1, $2)
        ON CONFLICT (user_id, session_id)
        DO UPDATE SET joined_at = CURRENT_TIMESTAMP
        RETURNING id, user_id, session_id, joined_at;
    `;
    const result = await pool.query(query, [userId, sessionId]);
    return result.rows[0];
};

const getCurrentSessionForUser = async (userId) => {
    const query = `
        SELECT
            us.session_id,
            us.joined_at,
            ps.start_time,
            ps.end_time,
            ps.status,
            COALESCE(ps.name, 'Session #' || ps.id::text) AS name
        FROM user_sessions us
        JOIN pos_sessions ps ON ps.id = us.session_id
        WHERE us.user_id = $1
          AND ps.status = 'active'
        ORDER BY us.joined_at DESC
        LIMIT 1;
    `;

    const result = await pool.query(query, [userId]);
    return result.rows[0] || null;
};

const createSession = async ({ openedBy, name }) => {
    const query = `
        INSERT INTO pos_sessions (opened_by, name, status)
        VALUES ($1, $2, 'active')
        RETURNING
            id,
            COALESCE(name, 'Session #' || id::text) AS name,
            start_time,
            end_time,
            status;
    `;
    const result = await pool.query(query, [openedBy, name]);
    return result.rows[0];
};

const stopSessionById = async (sessionId) => {
    const query = `
        UPDATE pos_sessions
        SET status = 'closed', end_time = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING
            id,
            COALESCE(name, 'Session #' || id::text) AS name,
            start_time,
            end_time,
            status;
    `;

    const result = await pool.query(query, [sessionId]);
    return result.rows[0] || null;
};

module.exports = {
    getActiveSessions,
    getActiveSessionById,
    upsertUserSession,
    getCurrentSessionForUser,
    createSession,
    stopSessionById
};
