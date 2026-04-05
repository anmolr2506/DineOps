const pool = require('../config/db');
require('dotenv').config();

class SeedError extends Error {
    constructor(message) {
        super(message);
        this.name = 'SeedError';
    }
}

const DEFAULT_DAYS = 30;
const DEFAULT_MIN_ORDERS = 4;
const DEFAULT_MAX_ORDERS = 9;
const MAX_DAYS = 180;

const round2 = (value) => Number(Number(value || 0).toFixed(2));

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const pickOne = (arr) => arr[Math.floor(Math.random() * arr.length)];

const parseIntFlag = (argv, key, defaultValue) => {
    const prefix = `--${key}=`;
    const raw = argv.find((entry) => entry.startsWith(prefix));
    if (!raw) return defaultValue;

    const parsed = Number(raw.slice(prefix.length));
    if (!Number.isInteger(parsed)) {
        throw new SeedError(`${key} must be an integer.`);
    }
    return parsed;
};

const validateOptions = (options) => {
    const { days, minOrdersPerDay, maxOrdersPerDay } = options;

    if (!Number.isInteger(days) || days < 1 || days > MAX_DAYS) {
        throw new SeedError(`days must be between 1 and ${MAX_DAYS}.`);
    }

    if (!Number.isInteger(minOrdersPerDay) || minOrdersPerDay < 1 || minOrdersPerDay > 50) {
        throw new SeedError('minOrdersPerDay must be between 1 and 50.');
    }

    if (!Number.isInteger(maxOrdersPerDay) || maxOrdersPerDay < 1 || maxOrdersPerDay > 80) {
        throw new SeedError('maxOrdersPerDay must be between 1 and 80.');
    }

    if (minOrdersPerDay > maxOrdersPerDay) {
        throw new SeedError('minOrdersPerDay cannot be greater than maxOrdersPerDay.');
    }
};

const parseOptions = (argv) => {
    const options = {
        days: parseIntFlag(argv, 'days', DEFAULT_DAYS),
        minOrdersPerDay: parseIntFlag(argv, 'minOrdersPerDay', DEFAULT_MIN_ORDERS),
        maxOrdersPerDay: parseIntFlag(argv, 'maxOrdersPerDay', DEFAULT_MAX_ORDERS)
    };

    validateOptions(options);
    return options;
};

const ensureBaseData = async (client, sessionId, actingUserId) => {
    const ensureFloor = async (name) => {
        const existing = await client.query('SELECT id FROM floors WHERE name = $1 LIMIT 1;', [name]);
        if (existing.rows[0]) return Number(existing.rows[0].id);

        const inserted = await client.query('INSERT INTO floors (name) VALUES ($1) RETURNING id;', [name]);
        return Number(inserted.rows[0].id);
    };

    const firstFloor = await ensureFloor('Ground Floor');
    const secondFloor = await ensureFloor('First Floor');

    if (!firstFloor) {
        throw new SeedError('Could not create or find floors.');
    }

    const ensureTable = async (floorId, tableNumber, seats) => {
        const existing = await client.query(
            'SELECT id FROM tables WHERE floor_id = $1 AND table_number = $2 LIMIT 1;',
            [floorId, tableNumber]
        );

        if (existing.rows[0]) {
            await client.query(
                'UPDATE tables SET seats = $1, is_active = true WHERE id = $2;',
                [seats, Number(existing.rows[0].id)]
            );
            return;
        }

        await client.query(
            'INSERT INTO tables (floor_id, table_number, seats, is_active) VALUES ($1, $2, $3, true);',
            [floorId, tableNumber, seats]
        );
    };

    const tableBlueprint = [
        [firstFloor, 1, 2],
        [firstFloor, 2, 4],
        [firstFloor, 3, 4],
        [secondFloor, 1, 4],
        [secondFloor, 2, 6],
        [secondFloor, 3, 8]
    ];

    for (const [floorId, tableNumber, seats] of tableBlueprint) {
        await ensureTable(floorId, tableNumber, seats);
    }

    const ensureCategory = async (name) => {
        const existing = await client.query(
            'SELECT id FROM categories WHERE name = $1 AND session_id = $2 LIMIT 1;',
            [name, sessionId]
        );
        if (existing.rows[0]) return Number(existing.rows[0].id);

        const inserted = await client.query(
            `
            INSERT INTO categories (name, session_id, created_by)
            VALUES ($1, $2, $3)
            RETURNING id;
            `,
            [name, sessionId, actingUserId]
        );
        return Number(inserted.rows[0].id);
    };

    await ensureCategory('Pizza');
    await ensureCategory('Beverages');
    await ensureCategory('Snacks');
    await ensureCategory('Desserts');

    const categoryRows = await client.query('SELECT id, name FROM categories WHERE session_id = $1;', [sessionId]);
    const categoryByName = new Map(categoryRows.rows.map((row) => [String(row.name), Number(row.id)]));

    const requiredCategories = ['Pizza', 'Beverages', 'Snacks', 'Desserts'];
    for (const name of requiredCategories) {
        if (!categoryByName.has(name)) {
            throw new SeedError(`Missing category: ${name}`);
        }
    }

    const products = [
        ['Margherita Pizza', 'Pizza', 240, 5],
        ['Farmhouse Pizza', 'Pizza', 320, 5],
        ['Paneer Tikka Pizza', 'Pizza', 360, 5],
        ['Cold Coffee', 'Beverages', 150, 5],
        ['Lemon Soda', 'Beverages', 90, 5],
        ['Masala Chai', 'Beverages', 60, 5],
        ['French Fries', 'Snacks', 120, 5],
        ['Veg Burger', 'Snacks', 140, 5],
        ['Garlic Bread', 'Snacks', 110, 5],
        ['Brownie', 'Desserts', 130, 5],
        ['Ice Cream Sundae', 'Desserts', 170, 5],
        ['Cheesecake Slice', 'Desserts', 190, 5]
    ];

    for (const [name, categoryName, price, taxPercent] of products) {
        const existing = await client.query(
            'SELECT id FROM products WHERE name = $1 AND session_id = $2 LIMIT 1;',
            [name, sessionId]
        );
        if (existing.rows[0]) {
            await client.query(
                `
                UPDATE products
                SET category_id = $1,
                    price = $2,
                    tax_percent = $3,
                    session_id = $4,
                    created_by = $5,
                    updated_at = CURRENT_TIMESTAMP,
                    is_available = true
                WHERE id = $6;
                `,
                [
                    categoryByName.get(categoryName),
                    price,
                    taxPercent,
                    sessionId,
                    actingUserId,
                    Number(existing.rows[0].id)
                ]
            );
        } else {
            await client.query(
                `
                INSERT INTO products (name, category_id, price, tax_percent, session_id, created_by, is_available)
                VALUES ($1, $2, $3, $4, $5, $6, true);
                `,
                [name, categoryByName.get(categoryName), price, taxPercent, sessionId, actingUserId]
            );
        }
    }
};

const chooseStatus = (indexInDay) => {
    if (indexInDay === 0) return 'paid';

    const roll = Math.random();
    if (roll < 0.70) return 'paid';
    if (roll < 0.80) return 'completed';
    if (roll < 0.90) return 'preparing';
    if (roll < 0.96) return 'approved';
    return 'pending';
};

const buildDayTimestamp = (daysAgo) => {
    const now = new Date();
    const base = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    base.setDate(base.getDate() - daysAgo);

    const hour = randomInt(11, 22);
    const minute = randomInt(0, 59);
    const second = randomInt(0, 59);

    base.setHours(hour, minute, second, 0);
    return base;
};

const seed = async () => {
    const options = parseOptions(process.argv.slice(2));
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const userResult = await client.query(
            `
            SELECT id, role
            FROM users
            WHERE role IN ('admin', 'staff')
            ORDER BY CASE WHEN role = 'admin' THEN 0 ELSE 1 END, id ASC
            LIMIT 1;
            `
        );

        const actingUserId = Number(userResult.rows[0]?.id);
        if (!actingUserId) {
            throw new SeedError('No admin/staff user found. Run base setup first.');
        }

        const activeSessionRes = await client.query(
            `
            INSERT INTO pos_sessions (opened_by, name, start_time, status)
            VALUES ($1, $2, NOW() - INTERVAL '2 hour', 'active')
            RETURNING id;
            `,
            [actingUserId, 'Review Session Active']
        );
        const activeSessionId = Number(activeSessionRes.rows[0].id);

        await ensureBaseData(client, activeSessionId, actingUserId);

        const tableResult = await client.query('SELECT id FROM tables WHERE is_active = true ORDER BY id ASC;');
        if (!tableResult.rows.length) {
            throw new SeedError('No active tables found.');
        }
        const tableIds = tableResult.rows.map((row) => Number(row.id));

        const productResult = await client.query(
            `
            SELECT id, price, tax_percent
            FROM products
            WHERE is_available = true
            ORDER BY id ASC;
            `
        );

        if (!productResult.rows.length) {
            throw new SeedError('No available products found.');
        }

        const products = productResult.rows.map((row) => ({
            id: Number(row.id),
            price: Number(row.price || 0),
            taxPercent: Number(row.tax_percent || 0)
        }));

        const closedSessionIds = [];
        for (let week = 1; week <= 4; week += 1) {
            const closedRes = await client.query(
                `
                INSERT INTO pos_sessions (opened_by, name, start_time, end_time, status)
                VALUES (
                    $1,
                    $2,
                    NOW() - ($3::text || ' days')::interval,
                    NOW() - (($3::text || ' days')::interval - INTERVAL '8 hour'),
                    'closed'
                )
                RETURNING id;
                `,
                [actingUserId, `Review Session Week ${week}`, week * 7]
            );
            closedSessionIds.push(Number(closedRes.rows[0].id));
        }

        const allSessionIds = [activeSessionId, ...closedSessionIds];

        for (const sessionId of allSessionIds) {
            await client.query(
                `
                INSERT INTO user_sessions (user_id, session_id)
                VALUES ($1, $2)
                ON CONFLICT (user_id, session_id) DO NOTHING;
                `,
                [actingUserId, sessionId]
            );
        }

        const oldSeedOrdersRes = await client.query(
            `
            SELECT DISTINCT p.order_id
            FROM payments p
            WHERE p.transaction_ref LIKE 'review-seed-%';
            `
        );

        const oldSeedOrderIds = oldSeedOrdersRes.rows.map((row) => Number(row.order_id)).filter(Boolean);
        if (oldSeedOrderIds.length) {
            await client.query('DELETE FROM orders WHERE id = ANY($1::int[]);', [oldSeedOrderIds]);
        }

        await client.query("DELETE FROM activity_logs WHERE message LIKE 'Review seed:%';");

        let totalOrders = 0;
        let paidOrders = 0;
        let completedPayments = 0;

        for (let daysAgo = options.days - 1; daysAgo >= 0; daysAgo -= 1) {
            const ordersToday = randomInt(options.minOrdersPerDay, options.maxOrdersPerDay);

            for (let orderIndex = 0; orderIndex < ordersToday; orderIndex += 1) {
                const status = chooseStatus(orderIndex);
                const source = Math.random() < 0.85 ? 'POS' : 'QR';

                const createdAt = buildDayTimestamp(daysAgo);
                const tableId = pickOne(tableIds);
                const sessionId = allSessionIds[(daysAgo + orderIndex) % allSessionIds.length];

                const itemCount = randomInt(1, 4);
                const selected = [];
                const selectedIds = new Set();

                while (selected.length < itemCount) {
                    const product = pickOne(products);
                    if (selectedIds.has(product.id)) continue;
                    selectedIds.add(product.id);
                    selected.push(product);
                }

                const orderInsertRes = await client.query(
                    `
                    INSERT INTO orders (table_id, session_id, source, status, total_amount, approved_by, created_at)
                    VALUES ($1, $2, $3, $4, 0, $5, $6)
                    RETURNING id;
                    `,
                    [tableId, sessionId, source, status, actingUserId, createdAt]
                );

                const orderId = Number(orderInsertRes.rows[0].id);
                let orderTotal = 0;

                for (const product of selected) {
                    const quantity = randomInt(1, 3);
                    const preTax = Number(product.price || 0);
                    const taxPercent = Number(product.taxPercent || 0);
                    const unitPrice = round2(preTax * (1 + (taxPercent / 100)));
                    const subtotal = round2(unitPrice * quantity);

                    await client.query(
                        `
                        INSERT INTO order_items (order_id, product_id, quantity, price, subtotal, tax_percent)
                        VALUES ($1, $2, $3, $4, $5, $6);
                        `,
                        [orderId, product.id, quantity, unitPrice, subtotal, taxPercent]
                    );

                    orderTotal += subtotal;
                }

                orderTotal = round2(orderTotal);

                await client.query('UPDATE orders SET total_amount = $1 WHERE id = $2;', [orderTotal, orderId]);

                await client.query(
                    `
                    INSERT INTO order_status_history (order_id, status, changed_at)
                    VALUES ($1, $2, $3);
                    `,
                    [orderId, status, new Date(createdAt.getTime() + randomInt(5, 45) * 60000)]
                );

                if (status === 'paid' || status === 'completed') {
                    const method = pickOne(['cash', 'upi', 'card']);
                    const paymentCreatedAt = new Date(createdAt.getTime() + randomInt(10, 60) * 60000);
                    const txRef = `review-seed-${orderId}-${paymentCreatedAt.getTime()}`;

                    await client.query(
                        `
                        INSERT INTO payments (order_id, method, amount, status, transaction_ref, handled_by, created_at)
                        VALUES ($1, $2, $3, 'completed', $4, $5, $6);
                        `,
                        [orderId, method, orderTotal, txRef, actingUserId, paymentCreatedAt]
                    );

                    completedPayments += 1;
                    if (status === 'paid') {
                        paidOrders += 1;
                    }
                }

                if (Math.random() < 0.35) {
                    await client.query(
                        `
                        INSERT INTO activity_logs (type, message, reference_id, created_at)
                        VALUES ($1, $2, $3, $4);
                        `,
                        ['order_created', `Review seed: Order #${orderId} generated for demo`, orderId, createdAt]
                    );
                }

                totalOrders += 1;
            }
        }

        await client.query('COMMIT');

        console.log('Review seed complete.');
        console.log(`Days seeded: ${options.days}`);
        console.log(`Orders inserted: ${totalOrders}`);
        console.log(`Paid orders inserted: ${paidOrders}`);
        console.log(`Completed payments inserted: ${completedPayments}`);
        console.log(`Sessions used: ${allSessionIds.join(', ')}`);
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
};

seed().catch((error) => {
    if (error instanceof SeedError) {
        console.error(`Validation error: ${error.message}`);
    } else {
        console.error('Failed to seed review data:', error.message || error);
    }
    process.exit(1);
});
