const pool = require('../config/db');
const { CategoryServiceError } = require('./category.service');

const resolveMenuScopeSessionId = async () => {
    const result = await pool.query(
        `
        SELECT ps.id
        FROM pos_sessions ps
        LEFT JOIN categories c ON c.session_id = ps.id
        LEFT JOIN products p ON p.session_id = ps.id
        LEFT JOIN variant_groups vg ON vg.session_id = ps.id
        GROUP BY ps.id
        ORDER BY
            (COUNT(DISTINCT c.id) * 5 + COUNT(DISTINCT p.id) * 2 + COUNT(DISTINCT vg.id) * 3) DESC,
            GREATEST(
                COALESCE(MAX(c.created_at), 'epoch'::timestamp),
                COALESCE(MAX(p.created_at), 'epoch'::timestamp),
                COALESCE(MAX(vg.created_at), 'epoch'::timestamp)
            ) DESC,
            ps.id ASC
        LIMIT 1
        `
    );
    const sessionId = result.rows[0]?.id;
    if (!Number.isInteger(sessionId) || sessionId <= 0) {
        throw new CategoryServiceError('No session available to anchor global menu scope.', 400);
    }
    return sessionId;
};

const normalizeSearchTerm = (value) => {
    const search = typeof value === 'string' ? value.trim() : '';
    return search.length > 0 ? `%${search}%` : '';
};

const listVariantGroups = async ({ search = '', page = 1, limit = 8 }) => {
    const menuSessionId = await resolveMenuScopeSessionId();

    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.max(1, Math.min(24, Number(limit) || 8));
    const offset = (safePage - 1) * safeLimit;
    const searchTerm = normalizeSearchTerm(search);

    const groupsQuery = `
        SELECT
            vg.id,
            vg.name,
            vg.description,
            vg.status,
            vg.session_id,
            vg.created_at,
            COALESCE(
                json_agg(
                    DISTINCT jsonb_build_object('id', vgv.id, 'name', vgv.name, 'extra_price', vgv.extra_price, 'value_type', vgv.value_type)
                ) FILTER (WHERE vgv.id IS NOT NULL),
                '[]'::json
            ) AS values,
            (SELECT COUNT(*)::int FROM category_variant_groups cvg WHERE cvg.variant_group_id = vg.id AND cvg.session_id = vg.session_id) AS category_count
        FROM variant_groups vg
        LEFT JOIN variant_group_values vgv ON vgv.variant_group_id = vg.id
        WHERE vg.session_id = $1
          AND (
            $2 = ''
            OR vg.name ILIKE $2
            OR COALESCE(vg.description, '') ILIKE $2
          )
        GROUP BY vg.id
        ORDER BY vg.created_at DESC
        LIMIT $3 OFFSET $4;
    `;

    const countQuery = `
        SELECT COUNT(*)::int AS total_count
        FROM variant_groups vg
        WHERE vg.session_id = $1
          AND (
            $2 = ''
            OR vg.name ILIKE $2
            OR COALESCE(vg.description, '') ILIKE $2
          );
    `;

    const [groupsResult, countResult] = await Promise.all([
        pool.query(groupsQuery, [menuSessionId, searchTerm, safeLimit, offset]),
        pool.query(countQuery, [menuSessionId, searchTerm])
    ]);

    return {
        groups: groupsResult.rows,
        pagination: {
            page: safePage,
            limit: safeLimit,
            total: countResult.rows[0]?.total_count || 0
        }
    };
};

const createVariantGroup = async ({ userId, payload }) => {
    const menuSessionId = await resolveMenuScopeSessionId();

    const name = payload.name?.trim();
    if (!name) {
        throw new CategoryServiceError('Variant group name is required.', 400);
    }

    const description = payload.description?.trim() || '';
    const status = payload.status === 'inactive' ? 'inactive' : 'active';
    const values = Array.isArray(payload.values) ? payload.values : [];

    const groupResult = await pool.query(
        `
            INSERT INTO variant_groups (name, description, status, session_id, created_by)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, name, description, status, session_id, created_at;
        `,
        [name, description, status, menuSessionId, userId]
    );

    const group = groupResult.rows[0];
    for (const value of values) {
        const normalizedValue = typeof value?.name === 'string' ? value.name.trim() : '';
        if (!normalizedValue) continue;
        const extraPrice = Number(value.extra_price || 0);
        const valueType = value.value_type || 'unit';
        await pool.query(
            `
                INSERT INTO variant_group_values (variant_group_id, name, extra_price, value_type)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (variant_group_id, name) DO NOTHING;
            `,
            [group.id, normalizedValue, Number.isFinite(extraPrice) ? extraPrice : 0, valueType]
        );
    }

    return group;
};

const updateVariantGroup = async ({ groupId, payload }) => {
    const menuSessionId = await resolveMenuScopeSessionId();

    if (!Number.isInteger(groupId) || groupId <= 0) {
        throw new CategoryServiceError('Invalid variant group id.', 400);
    }

    const existing = await pool.query('SELECT id FROM variant_groups WHERE id = $1 AND session_id = $2 LIMIT 1', [groupId, menuSessionId]);
    if (!existing.rows[0]) {
        throw new CategoryServiceError('Variant group not found.', 404);
    }

    const name = payload.name?.trim();
    if (!name) {
        throw new CategoryServiceError('Variant group name is required.', 400);
    }

    const description = payload.description?.trim() || '';
    const status = payload.status === 'inactive' ? 'inactive' : 'active';
    const values = Array.isArray(payload.values) ? payload.values : [];

    const result = await pool.query(
        `
            UPDATE variant_groups
            SET name = $1,
                description = $2,
                status = $3,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $4 AND session_id = $5
            RETURNING id, name, description, status, session_id, created_at;
        `,
        [name, description, status, groupId, menuSessionId]
    );

    await pool.query('DELETE FROM variant_group_values WHERE variant_group_id = $1', [groupId]);

    for (const value of values) {
        const normalizedName = typeof value?.name === 'string' ? value.name.trim() : '';
        if (!normalizedName) {
            continue;
        }

        const extraPrice = Number(value.extra_price || 0);
        const valueType = value.value_type || 'unit';
        await pool.query(
            `
                INSERT INTO variant_group_values (variant_group_id, name, extra_price, value_type)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (variant_group_id, name) DO UPDATE SET extra_price = EXCLUDED.extra_price, value_type = EXCLUDED.value_type;
            `,
            [groupId, normalizedName, Number.isFinite(extraPrice) ? extraPrice : 0, valueType]
        );
    }

    return result.rows[0];
};

const deleteVariantGroup = async ({ groupId }) => {
    const menuSessionId = await resolveMenuScopeSessionId();

    if (!Number.isInteger(groupId) || groupId <= 0) {
        throw new CategoryServiceError('Invalid variant group id.', 400);
    }

    const result = await pool.query('DELETE FROM variant_groups WHERE id = $1 AND session_id = $2 RETURNING id', [groupId, menuSessionId]);
    if (!result.rows[0]) {
        throw new CategoryServiceError('Variant group not found.', 404);
    }
};

const addVariantValue = async ({ groupId, payload }) => {
    const menuSessionId = await resolveMenuScopeSessionId();

    const name = payload.name?.trim();
    if (!name) {
        throw new CategoryServiceError('Variant value name is required.', 400);
    }

    const extraPrice = Number(payload.extra_price || 0);
    const group = await pool.query('SELECT id FROM variant_groups WHERE id = $1 AND session_id = $2 LIMIT 1', [groupId, menuSessionId]);
    if (!group.rows[0]) {
        throw new CategoryServiceError('Variant group not found.', 404);
    }

    const result = await pool.query(
        `
            INSERT INTO variant_group_values (variant_group_id, name, extra_price)
            VALUES ($1, $2, $3)
            ON CONFLICT (variant_group_id, name) DO UPDATE SET extra_price = EXCLUDED.extra_price
            RETURNING id, variant_group_id, name, extra_price, created_at;
        `,
        [groupId, name, Number.isFinite(extraPrice) ? extraPrice : 0]
    );

    return result.rows[0];
};

module.exports = {
    listVariantGroups,
    createVariantGroup,
    updateVariantGroup,
    deleteVariantGroup,
    addVariantValue
};
