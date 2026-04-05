const pool = require('../config/db');

class RestaurantConfigError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
    }
}

const DEFAULT_CONFIG = {
    id: 1,
    name: 'DineOps Restaurant',
    logo_url: null,
    address: null,
    contact_info: null,
    gst_percent: 5
};

const ensureConfigRow = async () => {
    await pool.query(
        `
        INSERT INTO restaurant_config (id, name, logo_url, address, contact_info, gst_percent)
        VALUES (1, $1, NULL, NULL, NULL, 5)
        ON CONFLICT (id) DO NOTHING
        `,
        [DEFAULT_CONFIG.name]
    );
};

const getRestaurantConfig = async () => {
    await ensureConfigRow();

    const result = await pool.query(
        `
        SELECT id, name, logo_url, address, contact_info, gst_percent
        FROM restaurant_config
        WHERE id = 1
        LIMIT 1
        `
    );

    return result.rows[0] || { ...DEFAULT_CONFIG };
};

const updateRestaurantConfig = async ({ payload }) => {
    await ensureConfigRow();

    const name = String(payload?.name || '').trim();
    const logoUrl = payload?.logo_url ? String(payload.logo_url).trim() : null;
    const address = payload?.address ? String(payload.address).trim() : null;
    const contactInfo = payload?.contact_info ? String(payload.contact_info).trim() : null;
    const gstPercent = payload?.gst_percent === undefined || payload?.gst_percent === null || payload?.gst_percent === ''
        ? null
        : Number(payload.gst_percent);

    if (!name) {
        throw new RestaurantConfigError('Restaurant name is required.', 400);
    }

    if (name.length > 160) {
        throw new RestaurantConfigError('Restaurant name must be 160 characters or less.', 400);
    }

    if (logoUrl && logoUrl.length > 2000) {
        throw new RestaurantConfigError('Logo URL is too long.', 400);
    }

    if (logoUrl) {
        const normalized = logoUrl.toLowerCase();
        if (!(normalized.endsWith('.png') || normalized.endsWith('.jpg') || normalized.endsWith('.jpeg'))) {
            throw new RestaurantConfigError('Logo format not supported. Please upload PNG or JPG/JPEG.', 400);
        }
    }

    if (address && address.length > 600) {
        throw new RestaurantConfigError('Address must be 600 characters or less.', 400);
    }

    if (contactInfo && contactInfo.length > 200) {
        throw new RestaurantConfigError('Contact info must be 200 characters or less.', 400);
    }

    if (gstPercent !== null && (!Number.isFinite(gstPercent) || gstPercent < 0 || gstPercent > 100)) {
        throw new RestaurantConfigError('gst_percent must be a number between 0 and 100.', 400);
    }

    const result = await pool.query(
        `
        UPDATE restaurant_config
        SET
            name = $1,
            logo_url = $2,
            address = $3,
            contact_info = $4,
            gst_percent = COALESCE($5, gst_percent),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = 1
        RETURNING id, name, logo_url, address, contact_info, gst_percent
        `,
        [name, logoUrl, address, contactInfo, gstPercent]
    );

    return result.rows[0];
};

module.exports = {
    RestaurantConfigError,
    getRestaurantConfig,
    updateRestaurantConfig
};
