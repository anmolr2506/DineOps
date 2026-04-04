const pool = require('../config/db');

const VALID_ROLES = ['admin', 'staff', 'kitchen'];

const toApprovalStatus = (row) => {
    if (row.approval_status) return row.approval_status;
    if (typeof row.is_approved === 'boolean') {
        return row.is_approved ? 'approved' : 'pending';
    }
    return 'pending';
};

async function getPendingUsers() {
    const query = `
        SELECT id, name, email, created_at,
               COALESCE(approval_status, CASE WHEN is_approved THEN 'approved' ELSE 'pending' END) AS approval_status
        FROM users
        WHERE COALESCE(approval_status, CASE WHEN is_approved THEN 'approved' ELSE 'pending' END) = 'pending'
        ORDER BY created_at ASC
    `;
    const result = await pool.query(query);
    return result.rows;
}

async function getPendingUsersCount() {
    const query = `
        SELECT COUNT(*)::int AS pending_count
        FROM users
        WHERE COALESCE(approval_status, CASE WHEN is_approved THEN 'approved' ELSE 'pending' END) = 'pending'
    `;
    const result = await pool.query(query);
    return result.rows[0]?.pending_count || 0;
}

async function approveUser(userId, role) {
    if (!VALID_ROLES.includes(role)) {
        const error = new Error('Invalid role selected.');
        error.statusCode = 400;
        throw error;
    }

    const query = `
        UPDATE users
        SET role = $2,
            approval_status = 'approved',
            is_approved = TRUE
        WHERE id = $1
          AND COALESCE(approval_status, CASE WHEN is_approved THEN 'approved' ELSE 'pending' END) = 'pending'
        RETURNING id, name, email, role, approval_status, created_at
    `;

    const result = await pool.query(query, [userId, role]);
    if (result.rows.length === 0) {
        const error = new Error('Pending user not found or already processed.');
        error.statusCode = 404;
        throw error;
    }

    return result.rows[0];
}

async function rejectUser(userId) {
    const query = `
        UPDATE users
        SET role = NULL,
            approval_status = 'rejected',
            is_approved = FALSE
        WHERE id = $1
          AND COALESCE(approval_status, CASE WHEN is_approved THEN 'approved' ELSE 'pending' END) = 'pending'
        RETURNING id, name, email, role, approval_status, created_at
    `;

    const result = await pool.query(query, [userId]);
    if (result.rows.length === 0) {
        const error = new Error('Pending user not found or already processed.');
        error.statusCode = 404;
        throw error;
    }

    return result.rows[0];
}

async function getMyApprovalStatus(userId) {
    const query = `
        SELECT id, name, email, role, is_approved, approval_status, created_at
        FROM users
        WHERE id = $1
        LIMIT 1
    `;

    const result = await pool.query(query, [userId]);
    if (result.rows.length === 0) {
        const error = new Error('User not found.');
        error.statusCode = 404;
        throw error;
    }

    const row = result.rows[0];
    return {
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.role,
        approval_status: toApprovalStatus(row),
        created_at: row.created_at
    };
}

module.exports = {
    getPendingUsers,
    getPendingUsersCount,
    approveUser,
    rejectUser,
    getMyApprovalStatus,
    VALID_ROLES
};
