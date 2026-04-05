const pool = require('../config/db');
require('dotenv').config();

class SeedError extends Error {
    constructor(message) {
        super(message);
        this.name = 'SeedError';
    }
}

const PROFILE_PRESETS = {
    demo: { days: 30, minOrdersPerDay: 20, maxOrdersPerDay: 40 },
    judge: { days: 180, minOrdersPerDay: 80, maxOrdersPerDay: 180 },
    extreme: { days: 365, minOrdersPerDay: 180, maxOrdersPerDay: 350 }
};

const DEFAULT_PROFILE = 'judge';
const MAX_DAYS = 730;
const MAX_ORDERS_PER_DAY = 2000;
const DEFAULT_COMMIT_EVERY_DAYS = 7;
const DEFAULT_CUSTOMERS = 2400;

const round2 = (value) => Number(Number(value || 0).toFixed(2));
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pickOne = (arr) => arr[Math.floor(Math.random() * arr.length)];

const parseIntFlag = (argv, key) => {
    const prefix = `--${key}=`;
    const raw = argv.find((entry) => entry.startsWith(prefix));
    if (!raw) return null;

    const parsed = Number(raw.slice(prefix.length));
    if (!Number.isInteger(parsed)) {
        throw new SeedError(`${key} must be an integer.`);
    }

    return parsed;
};

const parseStringFlag = (argv, key) => {
    const prefix = `--${key}=`;
    const raw = argv.find((entry) => entry.startsWith(prefix));
    if (!raw) return null;
    return String(raw.slice(prefix.length)).trim();
};

const hasFlag = (argv, key) => argv.includes(`--${key}`);

const parseOptions = (argv) => {
    const requestedProfile = (parseStringFlag(argv, 'profile') || DEFAULT_PROFILE).toLowerCase();
    const profile = PROFILE_PRESETS[requestedProfile];

    if (!profile) {
        throw new SeedError(`profile must be one of: ${Object.keys(PROFILE_PRESETS).join(', ')}`);
    }

    const days = parseIntFlag(argv, 'days') ?? profile.days;
    const minOrdersPerDay = parseIntFlag(argv, 'minOrdersPerDay') ?? profile.minOrdersPerDay;
    const maxOrdersPerDay = parseIntFlag(argv, 'maxOrdersPerDay') ?? profile.maxOrdersPerDay;
    const commitEveryDays = parseIntFlag(argv, 'commitEveryDays') ?? DEFAULT_COMMIT_EVERY_DAYS;
    const customers = parseIntFlag(argv, 'customers') ?? DEFAULT_CUSTOMERS;
    const fresh = hasFlag(argv, 'fresh');

    if (!Number.isInteger(days) || days < 1 || days > MAX_DAYS) {
        throw new SeedError(`days must be between 1 and ${MAX_DAYS}.`);
    }

    if (!Number.isInteger(minOrdersPerDay) || minOrdersPerDay < 1 || minOrdersPerDay > MAX_ORDERS_PER_DAY) {
        throw new SeedError(`minOrdersPerDay must be between 1 and ${MAX_ORDERS_PER_DAY}.`);
    }

    if (!Number.isInteger(maxOrdersPerDay) || maxOrdersPerDay < 1 || maxOrdersPerDay > MAX_ORDERS_PER_DAY) {
        throw new SeedError(`maxOrdersPerDay must be between 1 and ${MAX_ORDERS_PER_DAY}.`);
    }

    if (minOrdersPerDay > maxOrdersPerDay) {
        throw new SeedError('minOrdersPerDay cannot be greater than maxOrdersPerDay.');
    }

    if (!Number.isInteger(commitEveryDays) || commitEveryDays < 1 || commitEveryDays > 60) {
        throw new SeedError('commitEveryDays must be between 1 and 60.');
    }

    if (!Number.isInteger(customers) || customers < 50 || customers > 50000) {
        throw new SeedError('customers must be between 50 and 50000.');
    }

    return {
        profile: requestedProfile,
        days,
        minOrdersPerDay,
        maxOrdersPerDay,
        commitEveryDays,
        customers,
        fresh
    };
};

const buildTimestampForDay = (daysAgo) => {
    const now = new Date();
    const base = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    base.setDate(base.getDate() - daysAgo);

    const hour = randomInt(8, 23);
    const minute = randomInt(0, 59);
    const second = randomInt(0, 59);

    base.setHours(hour, minute, second, 0);
    return base;
};

const chooseStatus = () => {
    const roll = Math.random();
    if (roll < 0.58) return 'paid';
    if (roll < 0.78) return 'completed';
    if (roll < 0.88) return 'preparing';
    if (roll < 0.95) return 'approved';
    return 'pending';
};

const ensureCoreData = async (client) => {
    const actingUserRes = await client.query(
        `
        SELECT id
        FROM users
        WHERE role IN ('admin', 'staff')
        ORDER BY CASE WHEN role = 'admin' THEN 0 ELSE 1 END, id ASC
        LIMIT 1;
        `
    );

    const actingUserId = Number(actingUserRes.rows[0]?.id);
    if (!actingUserId) {
        throw new SeedError('No admin/staff user found. Run base setup first.');
    }

    const floorNames = ['Ground Floor', 'First Floor', 'Rooftop'];
    const floorIds = [];

    for (const floorName of floorNames) {
        const floorRes = await client.query(
            `
            INSERT INTO floors (name)
            VALUES ($1)
            ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
            RETURNING id;
            `,
            [floorName]
        );
        floorIds.push(Number(floorRes.rows[0].id));
    }

    for (let floorIndex = 0; floorIndex < floorIds.length; floorIndex += 1) {
        const floorId = floorIds[floorIndex];
        for (let tableNo = 1; tableNo <= 16; tableNo += 1) {
            await client.query(
                `
                INSERT INTO tables (floor_id, table_number, seats, is_active)
                VALUES ($1, $2, $3, true)
                ON CONFLICT (floor_id, table_number)
                DO UPDATE SET seats = EXCLUDED.seats, is_active = true;
                `,
                [floorId, tableNo, pickOne([2, 4, 4, 6, 8])]
            );
        }
    }

    const menuSessionRes = await client.query(
        `
        SELECT id
        FROM pos_sessions
        ORDER BY id ASC
        LIMIT 1;
        `
    );

    let menuSessionId = Number(menuSessionRes.rows[0]?.id);
    if (!menuSessionId) {
        const bootstrapSession = await client.query(
            `
            INSERT INTO pos_sessions (opened_by, name, status)
            VALUES ($1, $2, 'active')
            RETURNING id;
            `,
            [actingUserId, 'Menu Scope Session']
        );
        menuSessionId = Number(bootstrapSession.rows[0].id);
    }

    const activeSessionRes = await client.query(
        `
        INSERT INTO pos_sessions (opened_by, name, start_time, status)
        VALUES ($1, $2, NOW() - INTERVAL '2 hour', 'active')
        RETURNING id;
        `,
        [actingUserId, 'Judge Load Test Active Session']
    );

    const activeSessionId = Number(activeSessionRes.rows[0].id);

    const categories = ['Pizza', 'Beverages', 'Snacks', 'Desserts', 'Main Course', 'Combos', 'Hot Drinks'];
    const categoryIds = new Map();

    for (const categoryName of categories) {
        const categoryRes = await client.query(
            `
            INSERT INTO categories (name, session_id, created_by, status)
            VALUES ($1, $2, $3, 'active')
            ON CONFLICT (name, session_id)
            DO UPDATE SET status = 'active'
            RETURNING id;
            `,
            [categoryName, menuSessionId, actingUserId]
        );
        categoryIds.set(categoryName, Number(categoryRes.rows[0].id));
    }

    const products = [
        ['Margherita Pizza', 'Pizza', 220, 5],
        ['Farmhouse Pizza', 'Pizza', 320, 5],
        ['Paneer Loaded Pizza', 'Pizza', 390, 5],
        ['Classic Burger', 'Snacks', 160, 5],
        ['French Fries', 'Snacks', 120, 5],
        ['Nachos', 'Snacks', 180, 5],
        ['Cold Coffee', 'Beverages', 150, 5],
        ['Lemon Iced Tea', 'Beverages', 130, 5],
        ['Fresh Lime Soda', 'Beverages', 95, 5],
        ['Sizzling Brownie', 'Desserts', 210, 5],
        ['Cheesecake Slice', 'Desserts', 190, 5],
        ['Pasta Alfredo', 'Main Course', 280, 5],
        ['Paneer Rice Bowl', 'Main Course', 260, 5],
        ['Family Combo A', 'Combos', 540, 5],
        ['Family Combo B', 'Combos', 620, 5],
        ['Masala Chai', 'Hot Drinks', 60, 5],
        ['Cappuccino', 'Hot Drinks', 140, 5],
        ['Mocha', 'Hot Drinks', 160, 5]
    ];

    for (const [name, categoryName, price, taxPercent] of products) {
        await client.query(
            `
            INSERT INTO products (
                name,
                category_id,
                price,
                tax_percent,
                value_type,
                is_available,
                description,
                session_id,
                created_by
            )
            VALUES ($1, $2, $3, $4, 'unit', true, 'Auto-generated for load testing', $5, $6)
            ON CONFLICT (name, session_id)
            DO UPDATE SET
                category_id = EXCLUDED.category_id,
                price = EXCLUDED.price,
                tax_percent = EXCLUDED.tax_percent,
                is_available = true,
                updated_at = CURRENT_TIMESTAMP;
            `,
            [name, categoryIds.get(categoryName), price, taxPercent, activeSessionId, actingUserId]
        );
    }

    const variantBlueprint = [
        {
            name: 'Size',
            description: 'Portion size choices',
            categories: ['Pizza', 'Main Course', 'Combos'],
            values: [
                ['Regular', 0],
                ['Medium', 25],
                ['Large', 60]
            ]
        },
        {
            name: 'Spice Level',
            description: 'Spice intensity preference',
            categories: ['Snacks', 'Main Course'],
            values: [
                ['Mild', 0],
                ['Medium', 0],
                ['Hot', 0]
            ]
        },
        {
            name: 'Add Ons',
            description: 'Premium add-ons for customizations',
            categories: ['Pizza', 'Snacks', 'Beverages', 'Hot Drinks', 'Desserts'],
            values: [
                ['Extra Cheese', 35],
                ['Sauce Dip', 20],
                ['Ice Cream Scoop', 45]
            ]
        },
        {
            name: 'Sweetness',
            description: 'Sugar preferences for drinks',
            categories: ['Beverages', 'Hot Drinks'],
            values: [
                ['No Sugar', 0],
                ['Regular', 0],
                ['Extra Sweet', 0]
            ]
        }
    ];

    for (const group of variantBlueprint) {
        const groupRes = await client.query(
            `
            INSERT INTO variant_groups (name, description, status, session_id, created_by)
            VALUES ($1, $2, 'active', $3, $4)
            ON CONFLICT (name, session_id)
            DO UPDATE SET description = EXCLUDED.description, status = 'active', updated_at = CURRENT_TIMESTAMP
            RETURNING id;
            `,
            [group.name, group.description, menuSessionId, actingUserId]
        );

        const variantGroupId = Number(groupRes.rows[0].id);

        for (const [valueName, extraPrice] of group.values) {
            await client.query(
                `
                INSERT INTO variant_group_values (variant_group_id, name, extra_price)
                VALUES ($1, $2, $3)
                ON CONFLICT (variant_group_id, name)
                DO UPDATE SET extra_price = EXCLUDED.extra_price;
                `,
                [variantGroupId, valueName, extraPrice]
            );
        }

        for (const categoryName of group.categories) {
            const categoryId = categoryIds.get(categoryName);
            if (!categoryId) continue;

            await client.query(
                `
                INSERT INTO category_variant_groups (category_id, variant_group_id, session_id)
                VALUES ($1, $2, $3)
                ON CONFLICT (category_id, variant_group_id) DO NOTHING;
                `,
                [categoryId, variantGroupId, menuSessionId]
            );
        }
    }

    const tableRes = await client.query('SELECT id FROM tables WHERE is_active = true ORDER BY id ASC;');
    const productRes = await client.query(
        `
        SELECT id, category_id, price, tax_percent
        FROM products
        WHERE is_available = true
          AND session_id = $1
        ORDER BY id ASC;
        `,
        [menuSessionId]
    );

    return {
        actingUserId,
        menuSessionId,
        activeSessionId,
        tableIds: tableRes.rows.map((row) => Number(row.id)),
        products: productRes.rows.map((row) => ({
            id: Number(row.id),
            categoryId: Number(row.category_id),
            price: Number(row.price || 0),
            taxPercent: Number(row.tax_percent || 0)
        })),
        categoryIds
    };
};

const createSessionPool = async ({ client, actingUserId, days, activeSessionId }) => {
    const closedCount = Math.max(8, Math.ceil(days / 14));
    const sessionIds = [activeSessionId];

    for (let i = 0; i < closedCount; i += 1) {
        const ageDays = Math.max(1, Math.floor(((i + 1) * days) / (closedCount + 1)));
        const closedSessionRes = await client.query(
            `
            INSERT INTO pos_sessions (opened_by, name, start_time, end_time, status)
            VALUES (
                $1,
                $2,
                NOW() - ($3::text || ' days')::interval,
                NOW() - (($3::text || ' days')::interval - INTERVAL '10 hour'),
                'closed'
            )
            RETURNING id;
            `,
            [actingUserId, `Judge Load Test Session ${i + 1}`, ageDays]
        );

        sessionIds.push(Number(closedSessionRes.rows[0].id));
    }

    for (const sessionId of sessionIds) {
        await client.query(
            `
            INSERT INTO user_sessions (user_id, session_id)
            VALUES ($1, $2)
            ON CONFLICT (user_id, session_id) DO NOTHING;
            `,
            [actingUserId, sessionId]
        );
    }

    return sessionIds;
};

const purgeOldJudgeSeed = async (client) => {
    const oldOrdersRes = await client.query(
        `
        SELECT DISTINCT order_id
        FROM payments
        WHERE transaction_ref LIKE 'judge-seed-%';
        `
    );

    const oldOrderIds = oldOrdersRes.rows.map((row) => Number(row.order_id)).filter(Boolean);
    if (oldOrderIds.length) {
        await client.query('DELETE FROM orders WHERE id = ANY($1::int[]);', [oldOrderIds]);
    }

    await client.query("DELETE FROM activity_logs WHERE message LIKE 'Judge seed:%';");
};

const ensureDummyCustomers = async ({ client, count }) => {
    const customerIds = [];
    const batchSize = 300;

    for (let start = 0; start < count; start += batchSize) {
        const batchCount = Math.min(batchSize, count - start);
        const placeholders = [];
        const values = [];

        for (let i = 0; i < batchCount; i += 1) {
            const n = start + i + 1;
            const name = `Demo Customer ${String(n).padStart(5, '0')}`;
            const phone = String(9000000000 + n);
            const offset = i * 2;
            placeholders.push(`($${offset + 1}, $${offset + 2})`);
            values.push(name, phone);
        }

        const inserted = await client.query(
            `
            INSERT INTO customers (name, phone)
            VALUES ${placeholders.join(', ')}
            ON CONFLICT (phone)
            DO UPDATE SET name = EXCLUDED.name
            RETURNING id;
            `,
            values
        );

        inserted.rows.forEach((row) => customerIds.push(Number(row.id)));
    }

    return customerIds;
};

const buildProductVariantMap = async ({ client, menuSessionId }) => {
    const map = new Map();

    const rows = await client.query(
        `
        SELECT
            p.id AS product_id,
            vg.id AS group_id,
            vgv.id AS value_id,
            vgv.extra_price
        FROM products p
        JOIN category_variant_groups cvg
          ON cvg.category_id = p.category_id
         AND cvg.session_id = p.session_id
        JOIN variant_groups vg ON vg.id = cvg.variant_group_id
        JOIN variant_group_values vgv ON vgv.variant_group_id = vg.id
        WHERE p.session_id = $1
          AND p.is_available = true
        ORDER BY p.id, vg.id, vgv.id;
        `,
        [menuSessionId]
    );

    rows.rows.forEach((row) => {
        const productId = Number(row.product_id);
        const groupId = Number(row.group_id);
        const value = {
            valueId: Number(row.value_id),
            extraPrice: Number(row.extra_price || 0)
        };

        if (!map.has(productId)) {
            map.set(productId, new Map());
        }

        const groups = map.get(productId);
        if (!groups.has(groupId)) {
            groups.set(groupId, []);
        }
        groups.get(groupId).push(value);
    });

    return map;
};

const insertOrderItems = async (client, orderId, items) => {
    for (const item of items) {
        const itemRes = await client.query(
            `
            INSERT INTO order_items (order_id, product_id, quantity, price, subtotal, tax_percent)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id;
            `,
            [orderId, item.productId, item.quantity, item.unitPrice, item.subtotal, item.taxPercent]
        );

        const orderItemId = Number(itemRes.rows[0]?.id);
        if (!orderItemId || !Array.isArray(item.selectedVariantValueIds) || !item.selectedVariantValueIds.length) {
            continue;
        }

        for (const variantValueId of item.selectedVariantValueIds) {
            await client.query(
                `
                INSERT INTO order_item_variants (order_item_id, variant_value_id)
                VALUES ($1, $2)
                ON CONFLICT (order_item_id, variant_value_id) DO NOTHING;
                `,
                [orderItemId, Number(variantValueId)]
            );
        }
    }
};

const run = async () => {
    const options = parseOptions(process.argv.slice(2));
    const client = await pool.connect();

    let inTransaction = false;

    try {
        await client.query('BEGIN');
        inTransaction = true;

        const coreData = await ensureCoreData(client);
        const customerIds = await ensureDummyCustomers({ client, count: options.customers });
        const productVariantMap = await buildProductVariantMap({
            client,
            menuSessionId: coreData.menuSessionId
        });

        const customerIdColumnRes = await client.query(
            `
            SELECT EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_name = 'orders'
                  AND column_name = 'customer_id'
            ) AS has_customer_id;
            `
        );
        const hasCustomerId = Boolean(customerIdColumnRes.rows[0]?.has_customer_id);

        const sessionIds = await createSessionPool({
            client,
            actingUserId: coreData.actingUserId,
            days: options.days,
            activeSessionId: coreData.activeSessionId
        });

        if (options.fresh) {
            await purgeOldJudgeSeed(client);
        }

        await client.query('COMMIT');
        inTransaction = false;

        let totalOrders = 0;
        let completedPayments = 0;
        let activityRows = 0;
        let daysInCurrentChunk = 0;

        await client.query('BEGIN');
        inTransaction = true;

        for (let daysAgo = options.days - 1; daysAgo >= 0; daysAgo -= 1) {
            const ordersToday = randomInt(options.minOrdersPerDay, options.maxOrdersPerDay);

            for (let orderIndex = 0; orderIndex < ordersToday; orderIndex += 1) {
                const status = chooseStatus();
                const source = Math.random() < 0.86 ? 'POS' : 'QR';
                const createdAt = buildTimestampForDay(daysAgo);
                const tableId = pickOne(coreData.tableIds);
                const sessionId = sessionIds[(daysAgo + orderIndex) % sessionIds.length];
                const customerId = Math.random() < 0.82 ? pickOne(customerIds) : null;

                const itemCount = randomInt(1, 5);
                const selectedItems = [];
                const picked = new Set();
                while (selectedItems.length < itemCount) {
                    const product = pickOne(coreData.products);
                    if (picked.has(product.id)) continue;
                    picked.add(product.id);

                    const qty = randomInt(1, 4);
                    const productGroups = productVariantMap.get(product.id);
                    const selectedVariantValueIds = [];
                    let variantExtra = 0;

                    if (productGroups && Math.random() < 0.68) {
                        for (const [, values] of productGroups.entries()) {
                            if (!Array.isArray(values) || !values.length) continue;
                            if (Math.random() < 0.72) {
                                const selected = pickOne(values);
                                selectedVariantValueIds.push(selected.valueId);
                                variantExtra += Number(selected.extraPrice || 0);
                            }
                        }
                    }

                    const preTax = Number(product.price || 0) + Number(variantExtra || 0);
                    const unitPrice = round2(preTax * (1 + (Number(product.taxPercent || 0) / 100)));
                    const subtotal = round2(unitPrice * qty);

                    selectedItems.push({
                        productId: product.id,
                        quantity: qty,
                        unitPrice,
                        subtotal,
                        taxPercent: Number(product.taxPercent || 0),
                        selectedVariantValueIds
                    });
                }

                const orderTotal = round2(selectedItems.reduce((sum, item) => sum + item.subtotal, 0));

                const orderRes = hasCustomerId
                    ? await client.query(
                        `
                        INSERT INTO orders (table_id, session_id, source, status, total_amount, approved_by, customer_id, created_at)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                        RETURNING id;
                        `,
                        [tableId, sessionId, source, status, orderTotal, coreData.actingUserId, customerId, createdAt]
                    )
                    : await client.query(
                        `
                        INSERT INTO orders (table_id, session_id, source, status, total_amount, approved_by, created_at)
                        VALUES ($1, $2, $3, $4, $5, $6, $7)
                        RETURNING id;
                        `,
                        [tableId, sessionId, source, status, orderTotal, coreData.actingUserId, createdAt]
                    );

                const orderId = Number(orderRes.rows[0].id);

                await insertOrderItems(client, orderId, selectedItems);

                await client.query(
                    `
                    INSERT INTO order_status_history (order_id, status, changed_at)
                    VALUES ($1, $2, $3);
                    `,
                    [orderId, status, new Date(createdAt.getTime() + randomInt(3, 40) * 60000)]
                );

                if (status === 'paid' || status === 'completed') {
                    const paymentAt = new Date(createdAt.getTime() + randomInt(8, 55) * 60000);
                    await client.query(
                        `
                        INSERT INTO payments (order_id, method, amount, status, transaction_ref, handled_by, created_at)
                        VALUES ($1, $2, $3, 'completed', $4, $5, $6);
                        `,
                        [
                            orderId,
                            pickOne(['cash', 'upi', 'card']),
                            orderTotal,
                            `judge-seed-${orderId}-${paymentAt.getTime()}`,
                            coreData.actingUserId,
                            paymentAt
                        ]
                    );
                    completedPayments += 1;
                }

                if (Math.random() < 0.17) {
                    await client.query(
                        `
                        INSERT INTO activity_logs (type, message, reference_id, created_at)
                        VALUES ($1, $2, $3, $4);
                        `,
                        ['order_created', `Judge seed: generated order #${orderId}`, orderId, createdAt]
                    );
                    activityRows += 1;
                }

                totalOrders += 1;
            }

            daysInCurrentChunk += 1;
            if (daysInCurrentChunk >= options.commitEveryDays) {
                await client.query('COMMIT');
                inTransaction = false;
                await client.query('BEGIN');
                inTransaction = true;
                daysInCurrentChunk = 0;
            }
        }

        await client.query('COMMIT');
        inTransaction = false;

        const verifyRes = await client.query(
            `
            SELECT
                (SELECT COUNT(*)::int FROM orders WHERE created_at >= CURRENT_DATE - ($1::text || ' days')::interval) AS orders_in_window,
                (SELECT COUNT(*)::int FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE o.created_at >= CURRENT_DATE - ($1::text || ' days')::interval) AS order_items_in_window,
                (SELECT COUNT(*)::int FROM payments WHERE status = 'completed' AND created_at >= CURRENT_DATE - ($1::text || ' days')::interval) AS payments_in_window,
                (SELECT COUNT(DISTINCT DATE(created_at))::int FROM orders WHERE created_at >= CURRENT_DATE - ($1::text || ' days')::interval) AS active_days_with_orders;
            `,
            [options.days]
        );

        const verification = verifyRes.rows[0] || {};

        console.log('Judge data seed complete.');
        console.log(`Profile: ${options.profile}`);
        console.log(`Days seeded: ${options.days}`);
        console.log(`Orders inserted: ${totalOrders}`);
        console.log(`Completed payments inserted: ${completedPayments}`);
        console.log(`Activity log rows inserted: ${activityRows}`);
        console.log(`Dummy customers available: ${customerIds.length}`);
        console.log(`Menu session id used for categories/products/variants: ${coreData.menuSessionId}`);
        console.log(`Orders in window: ${verification.orders_in_window || 0}`);
        console.log(`Order items in window: ${verification.order_items_in_window || 0}`);
        console.log(`Payments in window: ${verification.payments_in_window || 0}`);
        console.log(`Days with order activity: ${verification.active_days_with_orders || 0}`);
    } catch (error) {
        if (inTransaction) {
            try {
                await client.query('ROLLBACK');
            } catch (_) {
                // Ignore rollback failure.
            }
        }
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
};

run().catch((error) => {
    if (error instanceof SeedError) {
        console.error(`Validation error: ${error.message}`);
    } else {
        console.error('Failed to seed judge data:', error.message || error);
    }
    process.exit(1);
});
