const pool = require('../config/db');
require('dotenv').config();

class MenuSeedError extends Error {
    constructor(message) {
        super(message);
        this.name = 'MenuSeedError';
    }
}

const resolveMenuSessionId = async (client) => {
    const result = await client.query(`
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
        LIMIT 1;
    `);

    const sessionId = Number(result.rows[0]?.id);
    if (sessionId > 0) return sessionId;

    const adminRes = await client.query("SELECT id FROM users WHERE role IN ('admin', 'staff') ORDER BY id ASC LIMIT 1");
    const userId = Number(adminRes.rows[0]?.id);
    if (!userId) {
        throw new MenuSeedError('No admin/staff user found.');
    }

    const created = await client.query(
        `INSERT INTO pos_sessions (opened_by, name, status) VALUES ($1, $2, 'active') RETURNING id`,
        [userId, 'Menu Showcase Session']
    );

    return Number(created.rows[0].id);
};

const ensureAdminUserId = async (client) => {
    const result = await client.query("SELECT id FROM users WHERE role IN ('admin', 'staff') ORDER BY CASE WHEN role='admin' THEN 0 ELSE 1 END, id ASC LIMIT 1");
    const userId = Number(result.rows[0]?.id);
    if (!userId) {
        throw new MenuSeedError('No admin/staff user found.');
    }
    return userId;
};

const seed = async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const createdBy = await ensureAdminUserId(client);
        const sessionId = await resolveMenuSessionId(client);

        const categories = [
            ['Coffee', 'Hot and cold coffee-based beverages'],
            ['Pizza', 'Classic and premium pizzas'],
            ['Beverages', 'Refreshers and cold drinks'],
            ['Snacks', 'Quick bites and finger food'],
            ['Desserts', 'Sweet endings']
        ];

        const categoryByName = new Map();
        for (const [name, description] of categories) {
            const res = await client.query(
                `
                INSERT INTO categories (name, description, status, session_id, created_by)
                VALUES ($1, $2, 'active', $3, $4)
                ON CONFLICT (name, session_id)
                DO UPDATE SET description = EXCLUDED.description, status = 'active'
                RETURNING id;
                `,
                [name, description, sessionId, createdBy]
            );
            categoryByName.set(name, Number(res.rows[0].id));
        }

        const variantGroups = [
            {
                name: 'Sugar Preference',
                description: 'Sugar selection for drinks',
                categories: ['Coffee', 'Beverages'],
                values: [
                    ['No Sugar', 0],
                    ['Regular Sugar', 0],
                    ['Brown Sugar', 5]
                ]
            },
            {
                name: 'Coffee Size',
                description: 'Cup size options',
                categories: ['Coffee'],
                values: [
                    ['Regular', 0],
                    ['Large', 30]
                ]
            },
            {
                name: 'Pizza Size',
                description: 'Choose pizza size',
                categories: ['Pizza'],
                values: [
                    ['Small', 0],
                    ['Medium', 80],
                    ['Large', 160]
                ]
            },
            {
                name: 'Pizza Extras',
                description: 'Extra toppings and cheese',
                categories: ['Pizza'],
                values: [
                    ['Extra Cheese', 40],
                    ['Stuffed Crust', 70],
                    ['Extra Toppings', 55]
                ]
            },
            {
                name: 'Spice Level',
                description: 'Adjust spiciness',
                categories: ['Snacks'],
                values: [
                    ['Mild', 0],
                    ['Medium', 0],
                    ['Hot', 0]
                ]
            }
        ];

        for (const group of variantGroups) {
            const groupRes = await client.query(
                `
                INSERT INTO variant_groups (name, description, status, session_id, created_by)
                VALUES ($1, $2, 'active', $3, $4)
                ON CONFLICT (name, session_id)
                DO UPDATE SET description = EXCLUDED.description, status = 'active', updated_at = CURRENT_TIMESTAMP
                RETURNING id;
                `,
                [group.name, group.description, sessionId, createdBy]
            );

            const groupId = Number(groupRes.rows[0].id);

            for (const [valueName, extraPrice] of group.values) {
                await client.query(
                    `
                    INSERT INTO variant_group_values (variant_group_id, name, extra_price)
                    VALUES ($1, $2, $3)
                    ON CONFLICT (variant_group_id, name)
                    DO UPDATE SET extra_price = EXCLUDED.extra_price;
                    `,
                    [groupId, valueName, Number(extraPrice)]
                );
            }

            for (const categoryName of group.categories) {
                const categoryId = categoryByName.get(categoryName);
                if (!categoryId) continue;
                await client.query(
                    `
                    INSERT INTO category_variant_groups (category_id, variant_group_id, session_id)
                    VALUES ($1, $2, $3)
                    ON CONFLICT (category_id, variant_group_id) DO NOTHING;
                    `,
                    [categoryId, groupId, sessionId]
                );
            }
        }

        const products = [
            ['Coffee', 'Cappuccino', 140, 5],
            ['Coffee', 'Mocha', 160, 5],
            ['Coffee', 'Latte', 150, 5],
            ['Coffee', 'Americano', 130, 5],
            ['Coffee', 'Masala Chai', 65, 5],
            ['Pizza', 'Margherita Pizza', 260, 5],
            ['Pizza', 'Farmhouse Pizza', 340, 5],
            ['Pizza', 'Paneer Tikka Pizza', 380, 5],
            ['Pizza', 'Veggie Supreme Pizza', 410, 5],
            ['Beverages', 'Lemon Soda', 95, 5],
            ['Beverages', 'Lemon Iced Tea', 130, 5],
            ['Beverages', 'Cold Coffee', 150, 5],
            ['Snacks', 'Nachos', 190, 5],
            ['Snacks', 'French Fries', 120, 5],
            ['Snacks', 'Veg Burger', 150, 5],
            ['Desserts', 'Brownie', 130, 5],
            ['Desserts', 'Cheesecake Slice', 200, 5]
        ];

        for (const [categoryName, productName, price, tax] of products) {
            const categoryId = categoryByName.get(categoryName);
            if (!categoryId) continue;

            await client.query(
                `
                INSERT INTO products (
                    category_id,
                    name,
                    description,
                    price,
                    tax_percent,
                    value_type,
                    is_available,
                    session_id,
                    created_by
                )
                VALUES ($1, $2, $3, $4, $5, 'unit', true, $6, $7)
                ON CONFLICT (name, session_id)
                DO UPDATE SET
                    category_id = EXCLUDED.category_id,
                    description = EXCLUDED.description,
                    price = EXCLUDED.price,
                    tax_percent = EXCLUDED.tax_percent,
                    is_available = true,
                    updated_at = CURRENT_TIMESTAMP;
                `,
                [
                    categoryId,
                    productName,
                    `Showcase item for ${categoryName}`,
                    Number(price),
                    Number(tax),
                    sessionId,
                    createdBy
                ]
            );
        }

        await client.query('COMMIT');

        const summary = await client.query(
            `
            SELECT
                (SELECT COUNT(*)::int FROM categories WHERE session_id = $1) AS categories,
                (SELECT COUNT(*)::int FROM products WHERE session_id = $1) AS products,
                (SELECT COUNT(*)::int FROM variant_groups WHERE session_id = $1) AS variant_groups
            `,
            [sessionId]
        );

        console.log('Menu showcase data seeded successfully.');
        console.log(`Menu session: ${sessionId}`);
        console.log(`Categories: ${summary.rows[0].categories}`);
        console.log(`Products: ${summary.rows[0].products}`);
        console.log(`Variant groups: ${summary.rows[0].variant_groups}`);
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
};

seed().catch((error) => {
    if (error instanceof MenuSeedError) {
        console.error(`Validation error: ${error.message}`);
    } else {
        console.error('Failed to seed menu showcase data:', error.message || error);
    }
    process.exit(1);
});
