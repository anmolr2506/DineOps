const pool = require('../config/db');

class PosTerminalError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
    }
}

const sanitizePhone = (phone) => String(phone || '').replace(/\D/g, '').slice(0, 10);

const ensureSessionActive = async (client, sessionId) => {
    const result = await client.query(
        `
        SELECT id, status, allow_cash, allow_digital, allow_upi, upi_id
        FROM pos_sessions
        WHERE id = $1
        LIMIT 1
        `,
        [sessionId]
    );

    if (!result.rows[0]) {
        throw new PosTerminalError('Session not found.', 404);
    }

    if (result.rows[0].status !== 'active') {
        throw new PosTerminalError('Session is not active.', 400);
    }

    return result.rows[0];
};

const ensureTableActive = async (client, tableId, sessionId) => {
    const tableResult = await client.query(
        `
        SELECT t.id, t.table_number, t.floor_id, t.is_active
        FROM tables t
        WHERE t.id = $1
        LIMIT 1
        `,
        [tableId]
    );

    if (!tableResult.rows[0]) {
        throw new PosTerminalError('Table not found.', 404);
    }

    if (!tableResult.rows[0].is_active) {
        throw new PosTerminalError('Selected table is inactive.', 400);
    }

    const existingSessionBooking = await client.query(
        `
        SELECT id
        FROM table_reservations
        WHERE table_id = $1
          AND status = 'confirmed'
          AND NOW() BETWEEN reservation_start AND reservation_end
        LIMIT 1
        `,
        [tableId]
    );

    if (existingSessionBooking.rows.length > 0) {
        throw new PosTerminalError('Selected table is currently reserved.', 409);
    }

    const existingOrder = await client.query(
        `
        SELECT id
        FROM orders
        WHERE table_id = $1
          AND session_id = $2
                    AND status IN ('pending', 'approved', 'preparing')
        ORDER BY id DESC
        LIMIT 1
        `,
        [tableId, sessionId]
    );

    if (existingOrder.rows.length > 0) {
        throw new PosTerminalError('An active order already exists for this table in this session.', 409);
    }

    return tableResult.rows[0];
};

const findCustomerByPhone = async ({ phone }) => {
    const normalizedPhone = sanitizePhone(phone);
    if (!/^\d{10}$/.test(normalizedPhone)) {
        throw new PosTerminalError('phone must be a valid 10-digit number.', 400);
    }

    const result = await pool.query(
        `
        SELECT id, name, phone, created_at
        FROM customers
        WHERE phone = $1
        LIMIT 1
        `,
        [normalizedPhone]
    );

    return result.rows[0] || null;
};

const listCustomers = async ({ search = '' }) => {
    const term = String(search || '').trim();
    const like = term ? `%${term}%` : '';

    const result = await pool.query(
        `
        SELECT id, name, phone, created_at
        FROM customers
        WHERE ($1 = '' OR name ILIKE $1 OR phone ILIKE $1)
        ORDER BY created_at DESC, id DESC
        LIMIT 200
        `,
        [like]
    );

    return result.rows;
};

const createCustomer = async ({ name, phone }) => {
    const customerName = String(name || '').trim();
    const normalizedPhone = sanitizePhone(phone);

    if (!customerName) {
        throw new PosTerminalError('Customer name is required.', 400);
    }

    if (customerName.length > 120) {
        throw new PosTerminalError('Customer name must be 120 characters or less.', 400);
    }

    if (!/^\d{10}$/.test(normalizedPhone)) {
        throw new PosTerminalError('phone must be a valid 10-digit number.', 400);
    }

    const result = await pool.query(
        `
        INSERT INTO customers (name, phone)
        VALUES ($1, $2)
        ON CONFLICT (phone)
        DO UPDATE SET name = EXCLUDED.name
        RETURNING id, name, phone, created_at
        `,
        [customerName, normalizedPhone]
    );

    return result.rows[0];
};

const getOrderItemsWithVariants = async (client, orderId) => {
    try {
        const orderItems = await client.query(
            `
            SELECT
                oi.product_id,
                oi.quantity,
                oi.price,
                COALESCE(
                    (
                        SELECT json_agg(
                            json_build_object(
                                'value_id', vgv.id,
                                'value_name', vgv.name,
                                'group_name', vg.name,
                                'extra_price', vgv.extra_price
                            )
                            ORDER BY vg.name ASC, vgv.name ASC
                        )
                        FROM order_item_variants oiv
                        JOIN variant_group_values vgv ON vgv.id = oiv.variant_value_id
                        JOIN variant_groups vg ON vg.id = vgv.variant_group_id
                        WHERE oiv.order_item_id = oi.id
                    ),
                    '[]'::json
                ) AS variants
            FROM order_items oi
            WHERE oi.order_id = $1
            ORDER BY oi.id ASC
            `,
            [orderId]
        );

        return orderItems.rows;
    } catch (error) {
        // Backward-compatible fallback when variant persistence migration has not run yet.
        if (error.code === '42P01') {
            const fallbackItems = await client.query(
                `
                SELECT
                    oi.product_id,
                    oi.quantity,
                    oi.price,
                    '[]'::json AS variants
                FROM order_items oi
                WHERE oi.order_id = $1
                ORDER BY oi.id ASC
                `,
                [orderId]
            );
            return fallbackItems.rows;
        }

        throw error;
    }
};

const createOrder = async ({ userId, payload, io }) => {
    const sessionId = Number(payload.session_id);
    const tableId = Number(payload.table_id);
    const rawItems = Array.isArray(payload.items) ? payload.items : [];
    const customerName = String(payload.customer_name || '').trim();
    const phone = sanitizePhone(payload.phone);

    if (!Number.isInteger(sessionId) || sessionId <= 0) {
        throw new PosTerminalError('session_id must be a positive integer.', 400);
    }

    if (!Number.isInteger(tableId) || tableId <= 0) {
        throw new PosTerminalError('table_id must be a positive integer.', 400);
    }

    if (!customerName) {
        throw new PosTerminalError('customer_name is required.', 400);
    }

    if (!/^\d{10}$/.test(phone)) {
        throw new PosTerminalError('phone must be a valid 10-digit number.', 400);
    }

    if (rawItems.length === 0) {
        throw new PosTerminalError('At least one item is required.', 400);
    }

    const items = rawItems.map((item) => ({
        product_id: Number(item.product_id),
        quantity: Number(item.quantity),
        selected_values: Array.isArray(item.selected_values)
            ? [...new Set(item.selected_values.map((value) => Number(value)).filter((value) => Number.isInteger(value) && value > 0))]
            : []
    }));

    if (items.some((item) => !Number.isInteger(item.product_id) || item.product_id <= 0 || !Number.isInteger(item.quantity) || item.quantity <= 0)) {
        throw new PosTerminalError('Invalid order items payload.', 400);
    }

    const productIds = [...new Set(items.map((item) => item.product_id))];

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        await ensureSessionActive(client, sessionId);
        const table = await ensureTableActive(client, tableId, sessionId);

        const productResult = await client.query(
            `
            SELECT id, category_id, name, price, tax_percent, is_available
            FROM products
            WHERE id = ANY($1::int[])
            `,
            [productIds]
        );

        if (productResult.rows.length !== productIds.length) {
            throw new PosTerminalError('One or more items are invalid.', 400);
        }

        const productsById = new Map();
        productResult.rows.forEach((row) => {
            productsById.set(Number(row.id), row);
        });

        const recalculatedItems = items.map((item) => {
            const product = productsById.get(Number(item.product_id));
            if (!product || product.is_available === false) {
                throw new PosTerminalError(`Product ${item.product_id} is unavailable.`, 409);
            }

            let variantsExtra = 0;
            let selectedValues = [];
            if (item.selected_values.length > 0) {
                selectedValues = item.selected_values;
            }

            const basePrice = Number(product.price || 0);
            const taxPercent = Number(product.tax_percent || 0);
            const subtotalBeforeTax = basePrice + variantsExtra;
            const unitPrice = Number((subtotalBeforeTax + (subtotalBeforeTax * taxPercent / 100)).toFixed(2));
            const subtotal = Number((unitPrice * item.quantity).toFixed(2));

            return {
                product_id: item.product_id,
                product_name: product.name,
                quantity: item.quantity,
                base_price: basePrice,
                tax_percent: taxPercent,
                selected_values: selectedValues,
                variants_extra: variantsExtra,
                price: unitPrice,
                subtotal
            };
        });

        for (let index = 0; index < recalculatedItems.length; index += 1) {
            const item = recalculatedItems[index];
            if (!Array.isArray(item.selected_values) || item.selected_values.length === 0) {
                continue;
            }

            const product = productsById.get(Number(item.product_id));
            const selectedValueIds = item.selected_values;

            const variantResult = await client.query(
                `
                SELECT vgv.id, vgv.extra_price, vgv.variant_group_id
                FROM variant_group_values vgv
                JOIN variant_groups vg ON vg.id = vgv.variant_group_id
                JOIN category_variant_groups cvg
                  ON cvg.variant_group_id = vg.id
                 AND cvg.category_id = $1
                WHERE vgv.id = ANY($2::int[])
                `,
                [product.category_id, selectedValueIds]
            );

            if (variantResult.rows.length !== selectedValueIds.length) {
                throw new PosTerminalError(`Invalid variant selection for product ${item.product_id}.`, 400);
            }

            const uniqueGroups = new Set(variantResult.rows.map((row) => Number(row.variant_group_id)));
            if (uniqueGroups.size !== variantResult.rows.length) {
                throw new PosTerminalError(`Only one variant value is allowed per variant group for product ${item.product_id}.`, 400);
            }

            const variantExtra = Number(
                variantResult.rows.reduce((sum, row) => sum + Number(row.extra_price || 0), 0).toFixed(2)
            );

            const subtotalBeforeTax = Number(item.base_price) + variantExtra;
            const recalculatedUnit = Number((subtotalBeforeTax + (subtotalBeforeTax * Number(item.tax_percent) / 100)).toFixed(2));
            const recalculatedSubtotal = Number((recalculatedUnit * Number(item.quantity)).toFixed(2));

            recalculatedItems[index] = {
                ...item,
                variants_extra: variantExtra,
                price: recalculatedUnit,
                subtotal: recalculatedSubtotal
            };
        }

        const customerResult = await client.query(
            `
            INSERT INTO customers (name, phone)
            VALUES ($1, $2)
            ON CONFLICT (phone)
            DO UPDATE SET name = EXCLUDED.name
            RETURNING id, name, phone
            `,
            [customerName, phone]
        );

        const customerId = customerResult.rows[0].id;

        const totalAmount = Number(recalculatedItems.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2));

        const orderResult = await client.query(
            `
            INSERT INTO orders (table_id, session_id, source, status, total_amount, approved_by)
            VALUES ($1, $2, 'POS', 'pending', $3, $4)
            RETURNING id, table_id, session_id, source, status, total_amount, created_at
            `,
            [tableId, sessionId, totalAmount, userId]
        );

        const order = orderResult.rows[0];

        for (const item of recalculatedItems) {
            const orderItemResult = await client.query(
                `
                INSERT INTO order_items (order_id, product_id, quantity, price, subtotal)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id
                `,
                [order.id, item.product_id, item.quantity, item.price, item.subtotal]
            );

            const orderItemId = orderItemResult.rows[0]?.id;
            if (orderItemId && Array.isArray(item.selected_values) && item.selected_values.length > 0) {
                for (const variantValueId of item.selected_values) {
                    await client.query(
                        `
                        INSERT INTO order_item_variants (order_item_id, variant_value_id)
                        VALUES ($1, $2)
                        ON CONFLICT (order_item_id, variant_value_id) DO NOTHING
                        `,
                        [orderItemId, variantValueId]
                    );
                }
            }
        }

        await client.query(
            `
            INSERT INTO order_status_history (order_id, status)
            VALUES ($1, 'pending')
            `,
            [order.id]
        );

        await client.query(
            `
            INSERT INTO activity_logs (type, message, reference_id)
            VALUES ('order_created', $1, $2)
            `,
            [`Order #${order.id} created for table ${table.table_number}`, order.id]
        );

        await client.query('COMMIT');

        const orderPayload = {
            order_id: order.id,
            session_id: sessionId,
            table_id: tableId,
            customer_id: customerId,
            customer_name: customerName,
            phone,
            items: recalculatedItems.map((item) => ({
                product_id: item.product_id,
                quantity: item.quantity,
                selected_values: item.selected_values,
                price: item.price
            }))
        };

        if (io) {
            io.to(`session_${sessionId}`).emit('order_created', orderPayload);
            io.emit('dashboard_refresh', {
                scope: 'session',
                session_id: sessionId,
                at: new Date().toISOString()
            });
        }

        return {
            ...order,
            customer_id: customerId,
            customer_name: customerName,
            phone,
            items: recalculatedItems
        };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

const getOrders = async ({ sessionId, date, tableId }) => {
    const parsedSessionId = Number(sessionId);
    const parsedTableId = tableId !== undefined ? Number(tableId) : null;

    const result = await pool.query(
        `
        SELECT
            o.id,
            o.session_id,
            o.table_id,
            t.table_number,
            o.source,
            o.status,
            o.total_amount,
            o.created_at,
            COALESCE(
                json_agg(
                    json_build_object(
                        'product_id', oi.product_id,
                        'product_name', p.name,
                        'quantity', oi.quantity,
                        'price', oi.price,
                        'subtotal', oi.subtotal,
                        'variants', COALESCE(
                            (
                                SELECT json_agg(
                                    json_build_object(
                                        'value_id', vgv.id,
                                        'value_name', vgv.name,
                                        'group_name', vg.name,
                                        'extra_price', vgv.extra_price
                                    )
                                    ORDER BY vg.name ASC, vgv.name ASC
                                )
                                FROM order_item_variants oiv
                                JOIN variant_group_values vgv ON vgv.id = oiv.variant_value_id
                                JOIN variant_groups vg ON vg.id = vgv.variant_group_id
                                WHERE oiv.order_item_id = oi.id
                            ),
                            '[]'::json
                        )
                    )
                    ORDER BY oi.id
                ) FILTER (WHERE oi.id IS NOT NULL),
                '[]'::json
            ) AS items
        FROM orders o
        LEFT JOIN tables t ON t.id = o.table_id
        LEFT JOIN order_items oi ON oi.order_id = o.id
        LEFT JOIN products p ON p.id = oi.product_id
        WHERE ($1::int IS NULL OR o.session_id = $1)
          AND ($2::date IS NULL OR DATE(o.created_at) = $2::date)
          AND ($3::int IS NULL OR o.table_id = $3)
        GROUP BY o.id, t.table_number
        ORDER BY o.created_at DESC
        LIMIT 300
        `,
        [Number.isInteger(parsedSessionId) && parsedSessionId > 0 ? parsedSessionId : null, date || null, Number.isInteger(parsedTableId) && parsedTableId > 0 ? parsedTableId : null]
    );

    return result.rows;
};

const createPayment = async ({ userId, payload, io }) => {
    const orderId = Number(payload.order_id);
    const method = String(payload.method || '').trim().toLowerCase();
    const cashReceived = payload.cash_received !== undefined ? Number(payload.cash_received) : null;
    const transactionRef = payload.transaction_ref ? String(payload.transaction_ref).trim() : null;

    if (!Number.isInteger(orderId) || orderId <= 0) {
        throw new PosTerminalError('order_id must be a positive integer.', 400);
    }

    if (!['cash', 'card', 'upi'].includes(method)) {
        throw new PosTerminalError('method must be one of cash, card, upi.', 400);
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const orderResult = await client.query(
            `
            SELECT o.id, o.session_id, o.table_id, o.status, o.total_amount,
                   ps.allow_cash, ps.allow_digital, ps.allow_upi, ps.upi_id
            FROM orders o
            JOIN pos_sessions ps ON ps.id = o.session_id
            WHERE o.id = $1
            LIMIT 1
            `,
            [orderId]
        );

        if (!orderResult.rows[0]) {
            throw new PosTerminalError('Order not found.', 404);
        }

        const order = orderResult.rows[0];

        if (order.status === 'paid') {
            throw new PosTerminalError('Order is already paid.', 409);
        }

        if (method === 'cash' && !order.allow_cash) {
            throw new PosTerminalError('Cash payment is disabled for this session.', 400);
        }
        if (method === 'card' && !order.allow_digital) {
            throw new PosTerminalError('Card payment is disabled for this session.', 400);
        }
        if (method === 'upi' && !order.allow_upi) {
            throw new PosTerminalError('UPI payment is disabled for this session.', 400);
        }

        const total = Number(order.total_amount || 0);
        if (method === 'cash') {
            if (!Number.isFinite(cashReceived) || cashReceived < total) {
                throw new PosTerminalError('cash_received must be greater than or equal to total amount.', 400);
            }
        }

        const paymentResult = await client.query(
            `
            INSERT INTO payments (order_id, method, amount, status, transaction_ref, handled_by)
            VALUES ($1, $2, $3, 'completed', $4, $5)
            RETURNING id, order_id, method, amount, status, transaction_ref, created_at
            `,
            [orderId, method, total, transactionRef, userId]
        );

        await client.query(
            `
            UPDATE orders
            SET status = 'paid'
            WHERE id = $1
            `,
            [orderId]
        );

        await client.query(
            `
            INSERT INTO order_status_history (order_id, status)
            VALUES ($1, 'paid')
            `,
            [orderId]
        );

        await client.query(
            `
            INSERT INTO activity_logs (type, message, reference_id)
            VALUES ('payment_recorded', $1, $2)
            `,
            [`Payment completed for order #${orderId}`, orderId]
        );

        const orderItems = await getOrderItemsWithVariants(client, orderId);

        await client.query('COMMIT');

        const payloadToEmit = {
            order_id: orderId,
            session_id: order.session_id,
            table_id: order.table_id,
            items: orderItems
        };

        if (io) {
            io.to(`session_${order.session_id}`).emit('new_order', payloadToEmit);
            io.to(`session_${order.session_id}`).emit('payment_recorded', {
                order_id: orderId,
                session_id: order.session_id,
                method,
                amount: total,
                at: new Date().toISOString()
            });
            io.to(`session_${order.session_id}`).emit('order_status_updated', {
                order_id: orderId,
                session_id: order.session_id,
                status: 'paid',
                at: new Date().toISOString()
            });
            io.emit('dashboard_refresh', {
                scope: 'session',
                session_id: order.session_id,
                at: new Date().toISOString()
            });
        }

        const response = {
            payment: paymentResult.rows[0],
            order: {
                id: orderId,
                status: 'paid',
                session_id: order.session_id,
                table_id: order.table_id,
                total_amount: total
            }
        };

        if (method === 'cash') {
            response.cash_received = cashReceived;
            response.change = Number((cashReceived - total).toFixed(2));
        }

        return response;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

const decideOrder = async ({ userId, orderId, action, io }) => {
    if (!Number.isInteger(orderId) || orderId <= 0) {
        throw new PosTerminalError('orderId must be a positive integer.', 400);
    }

    const normalizedAction = String(action || '').trim().toLowerCase();
    if (!['approve', 'reject'].includes(normalizedAction)) {
        throw new PosTerminalError('action must be approve or reject.', 400);
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const orderResult = await client.query(
            `
            SELECT id, session_id, table_id, status, total_amount
            FROM orders
            WHERE id = $1
            LIMIT 1
            `,
            [orderId]
        );

        if (!orderResult.rows[0]) {
            throw new PosTerminalError('Order not found.', 404);
        }

        const order = orderResult.rows[0];

        if (normalizedAction === 'reject') {
            if (order.status === 'paid') {
                throw new PosTerminalError('Paid orders cannot be rejected.', 409);
            }

            if (order.status !== 'cancelled') {
                await client.query(`UPDATE orders SET status = 'cancelled' WHERE id = $1`, [orderId]);
                await client.query(`INSERT INTO order_status_history (order_id, status) VALUES ($1, 'cancelled')`, [orderId]);
                await client.query(
                    `INSERT INTO activity_logs (type, message, reference_id) VALUES ('order_rejected', $1, $2)`,
                    [`Order #${orderId} rejected by admin.`, orderId]
                );
            }

            await client.query('COMMIT');

            if (io) {
                io.to(`session_${order.session_id}`).emit('order_status_updated', {
                    order_id: orderId,
                    session_id: order.session_id,
                    status: 'cancelled',
                    at: new Date().toISOString()
                });
                io.emit('dashboard_refresh', {
                    scope: 'session',
                    session_id: order.session_id,
                    at: new Date().toISOString()
                });
            }

            return {
                order: {
                    id: orderId,
                    status: 'cancelled',
                    session_id: order.session_id,
                    table_id: order.table_id
                }
            };
        }

        if (order.status === 'paid') {
            await client.query('COMMIT');
            return {
                order: {
                    id: orderId,
                    status: 'paid',
                    session_id: order.session_id,
                    table_id: order.table_id
                }
            };
        }

        if (order.status === 'cancelled') {
            throw new PosTerminalError('Cancelled orders cannot be approved.', 409);
        }

        await client.query(`INSERT INTO order_status_history (order_id, status) VALUES ($1, 'approved')`, [orderId]);
        await client.query(`UPDATE orders SET status = 'paid' WHERE id = $1`, [orderId]);
        await client.query(`INSERT INTO order_status_history (order_id, status) VALUES ($1, 'paid')`, [orderId]);

        const existingPayment = await client.query(
            `
            SELECT id
            FROM payments
            WHERE order_id = $1 AND status = 'completed'
            LIMIT 1
            `,
            [orderId]
        );

        if (existingPayment.rows.length === 0) {
            await client.query(
                `
                INSERT INTO payments (order_id, method, amount, status, transaction_ref, handled_by)
                VALUES ($1, 'cash', $2, 'completed', $3, $4)
                `,
                [orderId, Number(order.total_amount || 0), `ADMIN-APPROVED-${orderId}-${Date.now()}`, userId]
            );
        }

        await client.query(
            `
            INSERT INTO activity_logs (type, message, reference_id)
            VALUES ('order_approved', $1, $2)
            `,
            [`Order #${orderId} approved and marked as paid by admin.`, orderId]
        );

        const orderItems = await getOrderItemsWithVariants(client, orderId);

        await client.query('COMMIT');

        if (io) {
            io.to(`session_${order.session_id}`).emit('new_order', {
                order_id: orderId,
                session_id: order.session_id,
                table_id: order.table_id,
                items: orderItems
            });
            io.to(`session_${order.session_id}`).emit('payment_recorded', {
                order_id: orderId,
                session_id: order.session_id,
                method: 'cash',
                amount: Number(order.total_amount || 0),
                at: new Date().toISOString()
            });
            io.to(`session_${order.session_id}`).emit('order_status_updated', {
                order_id: orderId,
                session_id: order.session_id,
                status: 'paid',
                at: new Date().toISOString()
            });
            io.emit('dashboard_refresh', {
                scope: 'session',
                session_id: order.session_id,
                at: new Date().toISOString()
            });
        }

        return {
            order: {
                id: orderId,
                status: 'paid',
                session_id: order.session_id,
                table_id: order.table_id,
                total_amount: Number(order.total_amount || 0)
            }
        };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

module.exports = {
    PosTerminalError,
    findCustomerByPhone,
    listCustomers,
    createCustomer,
    createOrder,
    getOrders,
    createPayment,
    decideOrder
};
