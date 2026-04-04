const pool = require('../config/db');

class CategoryServiceError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
    }
}

const validateSessionAccess = async (userId, sessionId) => {
    if (!Number.isInteger(sessionId) || sessionId <= 0) {
        throw new CategoryServiceError('Invalid session_id.', 400);
    }

    const query = `
        SELECT us.id
        FROM user_sessions us
        JOIN pos_sessions ps ON ps.id = us.session_id
        WHERE us.user_id = $1
          AND us.session_id = $2
          AND ps.status = 'active'
        LIMIT 1;
    `;

    const result = await pool.query(query, [userId, sessionId]);
    if (!result.rows[0]) {
        throw new CategoryServiceError('User has no access to this session.', 403);
    }
};

const normalizeSearchTerm = (value) => {
    const search = typeof value === 'string' ? value.trim() : '';
    return search.length > 0 ? `%${search}%` : '';
};

const parseVariantGroupIds = (value) => {
    if (!Array.isArray(value)) {
        return [];
    }

    return [...new Set(
        value
            .map((item) => Number(item))
            .filter((item) => Number.isInteger(item) && item > 0)
    )];
};

const validateVariantGroupIdsForSession = async (sessionId, variantGroupIds) => {
    if (variantGroupIds.length === 0) {
        return [];
    }

    const result = await pool.query(
        'SELECT id FROM variant_groups WHERE session_id = $1 AND id = ANY($2::int[])',
        [sessionId, variantGroupIds]
    );

    const validIds = result.rows.map((row) => row.id);
    if (validIds.length !== variantGroupIds.length) {
        throw new CategoryServiceError('One or more selected variant groups are invalid for this session.', 400);
    }

    return validIds;
};

const syncCategoryVariantGroups = async (categoryId, sessionId, variantGroupIds) => {
    const normalizedIds = parseVariantGroupIds(variantGroupIds);
    await validateVariantGroupIdsForSession(sessionId, normalizedIds);

    await pool.query(
        'DELETE FROM category_variant_groups WHERE category_id = $1 AND session_id = $2',
        [categoryId, sessionId]
    );

    for (const variantGroupId of normalizedIds) {
        await pool.query(
            `
                INSERT INTO category_variant_groups (category_id, variant_group_id, session_id)
                VALUES ($1, $2, $3)
                ON CONFLICT (category_id, variant_group_id) DO NOTHING
            `,
            [categoryId, variantGroupId, sessionId]
        );
    }
};

const listCategories = async ({ userId, sessionId, search = '', page = 1, limit = 6 }) => {
    await validateSessionAccess(userId, sessionId);

    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.max(1, Math.min(24, Number(limit) || 6));
    const offset = (safePage - 1) * safeLimit;
    const searchTerm = normalizeSearchTerm(search);

    const query = `
        SELECT
            c.id,
            c.name,
            c.description,
            c.image_url,
            c.status,
            c.session_id,
            c.created_at,
            COUNT(p.id)::int AS product_count,
            COALESCE(
                (
                    SELECT json_agg(
                        jsonb_build_object(
                            'id', vg.id,
                            'name', vg.name,
                            'description', vg.description,
                            'status', vg.status,
                            'values', COALESCE(
                                (
                                    SELECT json_agg(
                                        jsonb_build_object(
                                            'id', vgv.id,
                                            'name', vgv.name,
                                            'extra_price', vgv.extra_price
                                        )
                                        ORDER BY vgv.id
                                    )
                                    FROM variant_group_values vgv
                                    WHERE vgv.variant_group_id = vg.id
                                ),
                                '[]'::json
                            )
                        )
                        ORDER BY vg.created_at, vg.id
                    )
                    FROM category_variant_groups cvg
                    JOIN variant_groups vg ON vg.id = cvg.variant_group_id AND vg.session_id = c.session_id
                    WHERE cvg.category_id = c.id AND cvg.session_id = c.session_id
                ),
                '[]'::json
            ) AS variant_groups
        FROM categories c
        LEFT JOIN products p
            ON p.category_id = c.id
           AND p.session_id = c.session_id
        WHERE c.session_id = $1
          AND (
            $2 = ''
            OR c.name ILIKE $2
            OR COALESCE(c.description, '') ILIKE $2
          )
        GROUP BY c.id
        ORDER BY c.created_at DESC
        LIMIT $3 OFFSET $4;
    `;

    const countQuery = `
        SELECT COUNT(*)::int AS total_count
        FROM categories c
        WHERE c.session_id = $1
          AND (
            $2 = ''
            OR c.name ILIKE $2
            OR COALESCE(c.description, '') ILIKE $2
          );
    `;

    const [result, countResult] = await Promise.all([
        pool.query(query, [sessionId, searchTerm, safeLimit, offset]),
        pool.query(countQuery, [sessionId, searchTerm])
    ]);

    return {
        categories: result.rows,
        pagination: {
            page: safePage,
            limit: safeLimit,
            total: countResult.rows[0]?.total_count || 0
        }
    };
};

const createCategory = async ({ userId, sessionId, payload }) => {
    await validateSessionAccess(userId, sessionId);

    const name = payload.name?.trim();
    if (!name) {
        throw new CategoryServiceError('Category name is required.', 400);
    }

    const description = payload.description?.trim() || '';
    const imageUrl = payload.image_url?.trim() || null;
    const status = payload.status === 'inactive' ? 'inactive' : 'active';
    const variantGroupIds = parseVariantGroupIds(payload.variant_group_ids);
    await validateVariantGroupIdsForSession(sessionId, variantGroupIds);

    const query = `
        INSERT INTO categories (name, description, image_url, status, session_id, created_by)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, name, description, image_url, status, session_id, created_at;
    `;

    try {
        const result = await pool.query(query, [name, description, imageUrl, status, sessionId, userId]);
        await syncCategoryVariantGroups(result.rows[0].id, sessionId, variantGroupIds);
        result.rows[0].variant_group_ids = variantGroupIds;
        return result.rows[0];
    } catch (err) {
        if (err.code === '23505') {
            throw new CategoryServiceError('Category name already exists in this session.', 409);
        }
        throw err;
    }
};

const updateCategory = async ({ userId, sessionId, categoryId, payload }) => {
    await validateSessionAccess(userId, sessionId);

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
        throw new CategoryServiceError('Invalid category id.', 400);
    }

    const existing = await pool.query('SELECT id FROM categories WHERE id = $1 AND session_id = $2 LIMIT 1', [categoryId, sessionId]);
    if (!existing.rows[0]) {
        throw new CategoryServiceError('Category not found in this session.', 404);
    }

    const name = payload.name?.trim();
    if (!name) {
        throw new CategoryServiceError('Category name is required.', 400);
    }

    const description = payload.description?.trim() || '';
    const imageUrl = payload.image_url?.trim() || null;
    const status = payload.status === 'inactive' ? 'inactive' : 'active';
    const variantGroupIds = parseVariantGroupIds(payload.variant_group_ids);
    await validateVariantGroupIdsForSession(sessionId, variantGroupIds);

    const query = `
        UPDATE categories
        SET name = $1,
            description = $2,
            image_url = $3,
            status = $4
        WHERE id = $5 AND session_id = $6
        RETURNING id, name, description, image_url, status, session_id, created_at;
    `;

    try {
        const result = await pool.query(query, [name, description, imageUrl, status, categoryId, sessionId]);
        await syncCategoryVariantGroups(categoryId, sessionId, variantGroupIds);
        result.rows[0].variant_group_ids = variantGroupIds;
        return result.rows[0];
    } catch (err) {
        if (err.code === '23505') {
            throw new CategoryServiceError('Category name already exists in this session.', 409);
        }
        throw err;
    }
};

const deleteCategory = async ({ userId, sessionId, categoryId }) => {
    await validateSessionAccess(userId, sessionId);

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
        throw new CategoryServiceError('Invalid category id.', 400);
    }

    const result = await pool.query(
        'DELETE FROM categories WHERE id = $1 AND session_id = $2 RETURNING id',
        [categoryId, sessionId]
    );

    if (!result.rows[0]) {
        throw new CategoryServiceError('Category not found in this session.', 404);
    }
};

const listProducts = async ({ userId, sessionId, categoryId, search = '' }) => {
    await validateSessionAccess(userId, sessionId);

    const safeCategoryId = Number(categoryId);
    if (categoryId !== undefined && categoryId !== null && (!Number.isInteger(safeCategoryId) || safeCategoryId <= 0)) {
        throw new CategoryServiceError('Invalid category_id.', 400);
    }

    if (Number.isInteger(safeCategoryId) && safeCategoryId > 0) {
        const category = await pool.query(
            'SELECT id FROM categories WHERE id = $1 AND session_id = $2 LIMIT 1',
            [safeCategoryId, sessionId]
        );

        if (!category.rows[0]) {
            throw new CategoryServiceError('Category not found in this session.', 404);
        }
    }

    const searchTerm = normalizeSearchTerm(search);

    const query = `
        SELECT
            p.id,
            p.category_id,
            c.name AS category_name,
            p.name,
            p.description,
            p.image_url,
            p.price,
            p.tax_percent,
            p.value_type,
            p.is_available,
            p.session_id,
            p.created_at
                FROM products p
        LEFT JOIN categories c ON c.id = p.category_id
        WHERE p.session_id = $1
          AND ($2::int IS NULL OR p.category_id = $2)
          AND (
              $3 = ''
              OR p.name ILIKE $3
              OR COALESCE(p.description, '') ILIKE $3
          )
        ORDER BY created_at DESC NULLS LAST, id DESC;
    `;

    const result = await pool.query(query, [sessionId, Number.isInteger(safeCategoryId) ? safeCategoryId : null, searchTerm]);
    return result.rows;
};

const createProduct = async ({ userId, sessionId, payload }) => {
    await validateSessionAccess(userId, sessionId);

    const categoryId = Number(payload.category_id);
    const name = payload.name?.trim();
    const price = Number(payload.price);
    const taxPercent = payload.tax_percent !== undefined ? Number(payload.tax_percent) : 0;
    const valueType = payload.value_type || 'unit';

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
        throw new CategoryServiceError('Valid category_id is required.', 400);
    }
    if (!name) {
        throw new CategoryServiceError('Product name is required.', 400);
    }
    if (!Number.isFinite(price) || price < 0) {
        throw new CategoryServiceError('Valid price is required.', 400);
    }
    if (!Number.isFinite(taxPercent) || taxPercent < 0 || taxPercent > 100) {
        throw new CategoryServiceError('Valid tax_percent is required (0-100).', 400);
    }
    if (!['kg', 'unit', 'liter'].includes(valueType)) {
        throw new CategoryServiceError('Valid value_type is required (kg, unit, liter).', 400);
    }

    const category = await pool.query(
        'SELECT id FROM categories WHERE id = $1 AND session_id = $2 LIMIT 1',
        [categoryId, sessionId]
    );

    if (!category.rows[0]) {
        throw new CategoryServiceError('Category not found in this session.', 404);
    }

    const description = payload.description?.trim() || '';
    const imageUrl = payload.image_url?.trim() || null;

    const query = `
        INSERT INTO products (category_id, name, price, tax_percent, value_type, description, image_url, session_id, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, category_id, name, description, image_url, price, tax_percent, value_type, is_available, session_id, created_at;
    `;

    try {
        const result = await pool.query(query, [categoryId, name, price, taxPercent, valueType, description, imageUrl, sessionId, userId]);
        return result.rows[0];
    } catch (err) {
        if (err.code === '23505') {
            throw new CategoryServiceError('Product name already exists in this session.', 409);
        }
        throw err;
    }
};

const updateProduct = async ({ userId, sessionId, productId, payload }) => {
    await validateSessionAccess(userId, sessionId);

    if (!Number.isInteger(productId) || productId <= 0) {
        throw new CategoryServiceError('Invalid product id.', 400);
    }

    const existing = await pool.query('SELECT id FROM products WHERE id = $1 AND session_id = $2 LIMIT 1', [productId, sessionId]);
    if (!existing.rows[0]) {
        throw new CategoryServiceError('Product not found in this session.', 404);
    }

    const name = payload.name?.trim();
    const price = Number(payload.price);
    const taxPercent = payload.tax_percent !== undefined ? Number(payload.tax_percent) : undefined;
    const valueType = payload.value_type;
    if (!name) {
        throw new CategoryServiceError('Product name is required.', 400);
    }
    if (!Number.isFinite(price) || price < 0) {
        throw new CategoryServiceError('Valid price is required.', 400);
    }
    if (taxPercent !== undefined && (!Number.isFinite(taxPercent) || taxPercent < 0 || taxPercent > 100)) {
        throw new CategoryServiceError('Valid tax_percent is required (0-100).', 400);
    }
    if (valueType !== undefined && !['kg', 'unit', 'liter'].includes(valueType)) {
        throw new CategoryServiceError('Valid value_type is required (kg, unit, liter).', 400);
    }

    const description = payload.description?.trim() || '';
    const imageUrl = payload.image_url?.trim() || null;
    const isAvailable = payload.is_available === false ? false : true;
    const nextCategoryId = payload.category_id !== undefined ? Number(payload.category_id) : null;

    if (payload.category_id !== undefined) {
        if (!Number.isInteger(nextCategoryId) || nextCategoryId <= 0) {
            throw new CategoryServiceError('Invalid category_id.', 400);
        }

        const category = await pool.query('SELECT id FROM categories WHERE id = $1 AND session_id = $2 LIMIT 1', [nextCategoryId, sessionId]);
        if (!category.rows[0]) {
            throw new CategoryServiceError('Category not found in this session.', 404);
        }
    }

    const query = `
        UPDATE products
        SET name = $1,
            price = $2,
            tax_percent = COALESCE($3, tax_percent),
            value_type = COALESCE($4, value_type),
            description = $5,
            image_url = $6,
            is_available = $7,
            category_id = COALESCE($8, category_id),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $9 AND session_id = $10
        RETURNING id, category_id, name, description, image_url, price, tax_percent, value_type, is_available, session_id, created_at;
    `;

    try {
        const result = await pool.query(query, [name, price, taxPercent, valueType, description, imageUrl, isAvailable, nextCategoryId, productId, sessionId]);
        return result.rows[0];
    } catch (err) {
        if (err.code === '23505') {
            throw new CategoryServiceError('Product name already exists in this session.', 409);
        }
        throw err;
    }
};

module.exports = {
    CategoryServiceError,
    listCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    listProducts,
    createProduct,
    updateProduct
};
