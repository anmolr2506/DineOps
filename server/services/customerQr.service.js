const crypto = require('crypto');
const Razorpay = require('razorpay');
const pool = require('../config/db');

class CustomerQrError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
    }
}

const sessionTokenRegistry = new Map();
let razorpayClient = null;

const getClientOrigin = () => {
    const configured = String(process.env.CLIENT_ORIGIN || '').trim();
    if (configured) {
        return configured.replace(/\/+$/, '');
    }
    return 'http://localhost:5173';
};

const generateToken = () => crypto.randomBytes(16).toString('hex');

const parsePositiveInt = (value) => {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const requireActiveSession = async (sessionId) => {
    const parsed = parsePositiveInt(sessionId);
    if (!parsed) {
        throw new CustomerQrError('session_id must be a positive integer.', 400);
    }

    const result = await pool.query(
        `
        SELECT id, status, allow_upi, upi_id
        FROM pos_sessions
        WHERE id = $1
        LIMIT 1
        `,
        [parsed]
    );

    if (!result.rows[0]) {
        throw new CustomerQrError('Session not found.', 404);
    }

    if (result.rows[0].status !== 'active') {
        throw new CustomerQrError('Session is not active.', 400);
    }

    return result.rows[0];
};

const requireActiveTable = async (tableId) => {
    const parsed = parsePositiveInt(tableId);
    if (!parsed) {
        throw new CustomerQrError('table_id must be a positive integer.', 400);
    }

    const result = await pool.query(
        `
        SELECT t.id, t.table_number, t.floor_id, t.is_active
        FROM tables t
        WHERE t.id = $1
        LIMIT 1
        `,
        [parsed]
    );

    if (!result.rows[0]) {
        throw new CustomerQrError('Table not found.', 404);
    }

    if (!result.rows[0].is_active) {
        throw new CustomerQrError('Table is inactive.', 400);
    }

    return result.rows[0];
};

const getOrCreateSessionToken = (sessionId) => {
    const key = Number(sessionId);
    const existing = sessionTokenRegistry.get(key);
    if (existing?.token) {
        return existing.token;
    }

    const token = generateToken();
    sessionTokenRegistry.set(key, {
        token,
        created_at: new Date().toISOString()
    });
    return token;
};

const refreshSessionToken = (sessionId) => {
    const key = Number(sessionId);
    const token = generateToken();
    sessionTokenRegistry.set(key, {
        token,
        created_at: new Date().toISOString()
    });
    return token;
};

const clearSessionToken = (sessionId) => {
    sessionTokenRegistry.delete(Number(sessionId));
};

const validateSessionToken = ({ sessionId, token }) => {
    const expected = getOrCreateSessionToken(sessionId);
    const provided = String(token || '').trim();

    if (!provided || provided !== expected) {
        throw new CustomerQrError('Invalid or expired QR token.', 401);
    }

    return true;
};

const buildCustomerUrl = ({ sessionId, tableId, token }) => {
    const origin = getClientOrigin();
    const params = new URLSearchParams({
        session_id: String(sessionId),
        table_id: String(tableId),
        token
    });
    return `${origin}/customer?${params.toString()}`;
};

const buildQrImageUrl = (customerUrl) => {
    const encoded = encodeURIComponent(customerUrl);
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&format=png&data=${encoded}`;
};

const getRazorpayClient = () => {
    if (razorpayClient) return razorpayClient;

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
        throw new CustomerQrError('Razorpay credentials are not configured.', 500);
    }

    razorpayClient = new Razorpay({
        key_id: keyId,
        key_secret: keySecret
    });

    return razorpayClient;
};

const parseLocalOrderIdFromReceipt = (receipt) => {
    const value = String(receipt || '');
    const match = value.match(/^dineops_customer_order_(\d+)_\d+$/);
    if (!match) return null;
    const localOrderId = Number(match[1]);
    return Number.isInteger(localOrderId) && localOrderId > 0 ? localOrderId : null;
};

const listTables = async () => {
    const result = await pool.query(
        `
        SELECT t.id, t.table_number, t.floor_id, f.name AS floor_name
        FROM tables t
        LEFT JOIN floors f ON f.id = t.floor_id
        WHERE t.is_active = true
        ORDER BY t.table_number ASC, t.id ASC
        `
    );

    return result.rows;
};

const generateSessionQrs = async ({ sessionId, refresh = false }) => {
    const session = await requireActiveSession(sessionId);
    const token = refresh ? refreshSessionToken(session.id) : getOrCreateSessionToken(session.id);

    const tables = await listTables();

    return {
        session_id: session.id,
        token,
        generated_at: new Date().toISOString(),
        tables: tables.map((table) => {
            const customerUrl = buildCustomerUrl({
                sessionId: session.id,
                tableId: table.id,
                token
            });
            return {
                table_id: table.id,
                table_number: table.table_number,
                floor_id: table.floor_id,
                floor_name: table.floor_name,
                customer_url: customerUrl,
                qr_image_url: buildQrImageUrl(customerUrl)
            };
        })
    };
};

const getCustomerContext = async ({ sessionId, tableId, token }) => {
    const session = await requireActiveSession(sessionId);
    const table = await requireActiveTable(tableId);
    validateSessionToken({ sessionId: session.id, token });

    const [categoriesResult, productsResult] = await Promise.all([
        pool.query(
            `
            SELECT id, name, description, image_url
            FROM categories
            WHERE session_id = $1
              AND status = 'active'
            ORDER BY created_at ASC, id ASC
            `,
            [session.id]
        ),
        pool.query(
            `
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
                p.is_available
            FROM products p
            LEFT JOIN categories c ON c.id = p.category_id AND c.session_id = p.session_id
            WHERE p.session_id = $1
              AND p.is_available = true
            ORDER BY p.created_at ASC, p.id ASC
            `,
            [session.id]
        )
    ]);

    return {
        session: {
            id: session.id,
            allow_upi: Boolean(session.allow_upi),
            upi_id: session.upi_id || null
        },
        table: {
            id: table.id,
            table_number: table.table_number
        },
        categories: categoriesResult.rows,
        products: productsResult.rows
    };
};

const createCustomerOrder = async ({ payload, io }) => {
    const sessionId = parsePositiveInt(payload.session_id);
    const tableId = parsePositiveInt(payload.table_id);
    const token = String(payload.token || '').trim();
    const customerName = String(payload.customer_name || '').trim();
    const rawItems = Array.isArray(payload.items) ? payload.items : [];

    if (!sessionId) {
        throw new CustomerQrError('session_id must be a positive integer.', 400);
    }
    if (!tableId) {
        throw new CustomerQrError('table_id must be a positive integer.', 400);
    }
    if (!customerName) {
        throw new CustomerQrError('Customer name is required.', 400);
    }
    if (rawItems.length === 0) {
        throw new CustomerQrError('At least one item is required.', 400);
    }

    await requireActiveSession(sessionId);
    await requireActiveTable(tableId);
    validateSessionToken({ sessionId, token });

    const items = rawItems.map((item) => ({
        product_id: parsePositiveInt(item.product_id),
        quantity: Number(item.quantity)
    }));

    if (items.some((item) => !item.product_id || !Number.isInteger(item.quantity) || item.quantity <= 0)) {
        throw new CustomerQrError('Invalid order items payload.', 400);
    }

    const productIds = [...new Set(items.map((item) => item.product_id))];

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const productsResult = await client.query(
            `
            SELECT id, name, price, tax_percent, is_available
            FROM products
            WHERE session_id = $1
              AND id = ANY($2::int[])
            `,
            [sessionId, productIds]
        );

        if (productsResult.rows.length !== productIds.length) {
            throw new CustomerQrError('One or more products are invalid for this session.', 400);
        }

        const productsById = new Map();
        productsResult.rows.forEach((row) => {
            productsById.set(Number(row.id), row);
        });

        const normalizedItems = items.map((item) => {
            const product = productsById.get(Number(item.product_id));
            if (!product || product.is_available === false) {
                throw new CustomerQrError(`Product ${item.product_id} is unavailable.`, 409);
            }

            const basePrice = Number(product.price || 0);
            const taxPercent = Number(product.tax_percent || 0);
            const unitPrice = Number((basePrice + (basePrice * taxPercent / 100)).toFixed(2));
            const subtotal = Number((unitPrice * item.quantity).toFixed(2));

            return {
                product_id: item.product_id,
                product_name: product.name,
                quantity: item.quantity,
                price: unitPrice,
                subtotal,
                tax_percent: taxPercent
            };
        });

        const totalAmount = Number(normalizedItems.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2));

        const orderResult = await client.query(
            `
            INSERT INTO orders (table_id, session_id, source, status, total_amount)
            VALUES ($1, $2, 'QR', 'pending', $3)
            RETURNING id, table_id, session_id, source, status, total_amount, created_at
            `,
            [tableId, sessionId, totalAmount]
        );

        const order = orderResult.rows[0];

        for (const item of normalizedItems) {
            await client.query(
                `
                INSERT INTO order_items (order_id, product_id, quantity, price, subtotal, tax_percent)
                VALUES ($1, $2, $3, $4, $5, $6)
                `,
                [order.id, item.product_id, item.quantity, item.price, item.subtotal, item.tax_percent]
            );
        }

        await client.query(
            `INSERT INTO order_status_history (order_id, status) VALUES ($1, 'pending')`,
            [order.id]
        );

        await client.query(
            `INSERT INTO activity_logs (type, message, reference_id) VALUES ('order_created', $1, $2)`,
            [`QR order #${order.id} created for table ${tableId} by ${customerName}`, order.id]
        );

        await client.query('COMMIT');

        if (io) {
            io.to(`session_${sessionId}`).emit('customer_order_created', {
                order_id: order.id,
                session_id: sessionId,
                table_id: tableId,
                source: 'QR'
            });
            io.to(`session_${sessionId}`).emit('metrics_update', {
                session_id: sessionId,
                at: new Date().toISOString()
            });
            io.emit('dashboard_refresh', {
                scope: 'session',
                session_id: sessionId,
                at: new Date().toISOString()
            });
        }

        return {
            ...order,
            customer_name: customerName,
            items: normalizedItems
        };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

const completeCustomerPayment = async ({ orderId, payload, io }) => {
    const normalizedOrderId = parsePositiveInt(orderId);
    const sessionId = parsePositiveInt(payload.session_id);
    const tableId = parsePositiveInt(payload.table_id);
    const token = String(payload.token || '').trim();
    const method = ['cash', 'card', 'upi', 'razorpay'].includes(String(payload.method || '').toLowerCase())
        ? String(payload.method || '').toLowerCase()
        : 'upi';
    const transactionRef = String(payload.transaction_ref || `QR-${Date.now()}`).slice(0, 120);

    if (!normalizedOrderId) {
        throw new CustomerQrError('order id must be a positive integer.', 400);
    }
    if (!sessionId || !tableId) {
        throw new CustomerQrError('session_id and table_id are required.', 400);
    }

    await requireActiveSession(sessionId);
    await requireActiveTable(tableId);
    validateSessionToken({ sessionId, token });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const orderResult = await client.query(
            `
            SELECT id, session_id, table_id, status, total_amount, source
            FROM orders
            WHERE id = $1
              AND session_id = $2
              AND table_id = $3
            LIMIT 1
            `,
            [normalizedOrderId, sessionId, tableId]
        );

        if (!orderResult.rows[0]) {
            throw new CustomerQrError('Order not found for this table/session.', 404);
        }

        const order = orderResult.rows[0];
        if (order.source !== 'QR') {
            throw new CustomerQrError('Only QR orders can be paid from customer flow.', 400);
        }

        if (order.status === 'paid' || order.status === 'preparing' || order.status === 'completed') {
            await client.query('COMMIT');
            return {
                order: {
                    id: order.id,
                    status: order.status,
                    session_id: order.session_id,
                    table_id: order.table_id,
                    total_amount: Number(order.total_amount || 0)
                }
            };
        }

        await client.query(
            `
            INSERT INTO payments (order_id, method, amount, status, transaction_ref, handled_by)
            VALUES ($1, $2, $3, 'completed', $4, NULL)
            `,
            [order.id, method, Number(order.total_amount || 0), transactionRef]
        );

        await client.query(`UPDATE orders SET status = 'paid' WHERE id = $1`, [order.id]);
        await client.query(`INSERT INTO order_status_history (order_id, status) VALUES ($1, 'paid')`, [order.id]);

        await client.query(
            `INSERT INTO activity_logs (type, message, reference_id) VALUES ('payment_recorded', $1, $2)`,
            [`Customer payment completed for QR order #${order.id}`, order.id]
        );

        const orderItems = await client.query(
            `
            SELECT oi.id, oi.order_id, oi.product_id, oi.quantity, oi.price, oi.subtotal
            FROM order_items oi
            WHERE oi.order_id = $1
            ORDER BY oi.id ASC
            `,
            [order.id]
        );

        await client.query('COMMIT');

        if (io) {
            io.to(`session_${sessionId}`).emit('new_order', {
                order_id: order.id,
                session_id: sessionId,
                table_id: tableId,
                items: orderItems.rows
            });
            io.to(`session_${sessionId}`).emit('payment_recorded', {
                order_id: order.id,
                session_id: sessionId,
                method,
                amount: Number(order.total_amount || 0),
                at: new Date().toISOString()
            });
            io.to(`session_${sessionId}`).emit('order_status_updated', {
                order_id: order.id,
                session_id: sessionId,
                status: 'paid',
                at: new Date().toISOString()
            });
            io.to(`session_${sessionId}`).emit('metrics_update', {
                session_id: sessionId,
                at: new Date().toISOString()
            });
            io.emit('dashboard_refresh', {
                scope: 'session',
                session_id: sessionId,
                at: new Date().toISOString()
            });
        }

        return {
            order: {
                id: order.id,
                status: 'paid',
                session_id: sessionId,
                table_id: tableId,
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

const createCustomerRazorpayOrder = async ({ orderId, payload }) => {
    const normalizedOrderId = parsePositiveInt(orderId);
    const sessionId = parsePositiveInt(payload.session_id);
    const tableId = parsePositiveInt(payload.table_id);
    const token = String(payload.token || '').trim();

    if (!normalizedOrderId) {
        throw new CustomerQrError('order id must be a positive integer.', 400);
    }
    if (!sessionId || !tableId) {
        throw new CustomerQrError('session_id and table_id are required.', 400);
    }

    await requireActiveSession(sessionId);
    await requireActiveTable(tableId);
    validateSessionToken({ sessionId, token });

    const orderResult = await pool.query(
        `
        SELECT id, session_id, table_id, status, total_amount, source
        FROM orders
        WHERE id = $1
          AND session_id = $2
          AND table_id = $3
        LIMIT 1
        `,
        [normalizedOrderId, sessionId, tableId]
    );

    const order = orderResult.rows[0];
    if (!order) {
        throw new CustomerQrError('Order not found for this table/session.', 404);
    }

    if (order.source !== 'QR') {
        throw new CustomerQrError('Only QR orders can be paid from customer flow.', 400);
    }

    if (order.status === 'paid' || order.status === 'preparing' || order.status === 'completed') {
        throw new CustomerQrError('Order is already paid.', 409);
    }

    const amountInPaise = Math.round(Number(order.total_amount || 0) * 100);
    const receipt = `dineops_customer_order_${order.id}_${Date.now()}`;
    const razorpay = getRazorpayClient();
    const gatewayOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt,
        notes: {
            source: 'customer_qr',
            session_id: String(sessionId),
            table_id: String(tableId),
            local_order_id: String(order.id)
        }
    });

    return {
        key_id: process.env.RAZORPAY_KEY_ID,
        order_id: gatewayOrder.id,
        amount: gatewayOrder.amount,
        currency: gatewayOrder.currency,
        receipt: gatewayOrder.receipt,
        order: {
            id: order.id,
            total_amount: Number(order.total_amount || 0),
            session_id: order.session_id,
            table_id: order.table_id
        }
    };
};

const verifyCustomerRazorpayPayment = async ({ orderId, payload, io }) => {
    const normalizedOrderId = parsePositiveInt(orderId);
    const sessionId = parsePositiveInt(payload.session_id);
    const tableId = parsePositiveInt(payload.table_id);
    const token = String(payload.token || '').trim();
    const razorpayOrderId = String(payload.razorpay_order_id || '').trim();
    const razorpayPaymentId = String(payload.razorpay_payment_id || '').trim();
    const razorpaySignature = String(payload.razorpay_signature || '').trim();

    if (!normalizedOrderId) {
        throw new CustomerQrError('order id must be a positive integer.', 400);
    }
    if (!sessionId || !tableId) {
        throw new CustomerQrError('session_id and table_id are required.', 400);
    }
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        throw new CustomerQrError('razorpay_order_id, razorpay_payment_id, and razorpay_signature are required.', 400);
    }

    await requireActiveSession(sessionId);
    await requireActiveTable(tableId);
    validateSessionToken({ sessionId, token });

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
        throw new CustomerQrError('Razorpay secret is not configured.', 500);
    }

    const expectedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

    if (expectedSignature !== razorpaySignature) {
        throw new CustomerQrError('Invalid Razorpay signature.', 400);
    }

    const razorpay = getRazorpayClient();
    const gatewayOrder = await razorpay.orders.fetch(razorpayOrderId);
    const parsedOrderId = parseLocalOrderIdFromReceipt(gatewayOrder.receipt);

    if (parsedOrderId && parsedOrderId !== normalizedOrderId) {
        throw new CustomerQrError('Payment does not match this order.', 400);
    }

    const result = await completeCustomerPayment({
        orderId: normalizedOrderId,
        payload: {
            session_id: sessionId,
            table_id: tableId,
            token,
            method: 'razorpay',
            transaction_ref: razorpayPaymentId
        },
        io
    });

    return {
        verified: true,
        gateway_order_id: razorpayOrderId,
        gateway_payment_id: razorpayPaymentId,
        ...result
    };
};

const getCustomerOrderStatus = async ({ orderId, sessionId, tableId, token }) => {
    const normalizedOrderId = parsePositiveInt(orderId);
    const normalizedSessionId = parsePositiveInt(sessionId);
    const normalizedTableId = parsePositiveInt(tableId);

    if (!normalizedOrderId || !normalizedSessionId || !normalizedTableId) {
        throw new CustomerQrError('order_id, session_id, and table_id are required.', 400);
    }

    await requireActiveSession(normalizedSessionId);
    await requireActiveTable(normalizedTableId);
    validateSessionToken({ sessionId: normalizedSessionId, token });

    const orderResult = await pool.query(
        `
        SELECT id, session_id, table_id, status, total_amount, source, created_at
        FROM orders
        WHERE id = $1
          AND session_id = $2
          AND table_id = $3
        LIMIT 1
        `,
        [normalizedOrderId, normalizedSessionId, normalizedTableId]
    );

    if (!orderResult.rows[0]) {
        throw new CustomerQrError('Order not found.', 404);
    }

    const order = orderResult.rows[0];
    if (order.source !== 'QR') {
        throw new CustomerQrError('Order is not from QR flow.', 400);
    }

    let items;
    try {
        const itemsResult = await pool.query(
            `
            SELECT
                oi.id,
                oi.order_id,
                oi.product_id,
                p.name AS product_name,
                oi.quantity,
                COALESCE(oi.is_prepared, false) AS is_prepared
            FROM order_items oi
            LEFT JOIN products p ON p.id = oi.product_id
            WHERE oi.order_id = $1
            ORDER BY oi.id ASC
            `,
            [order.id]
        );
        items = itemsResult.rows;
    } catch (error) {
        if (error.code !== '42703') {
            throw error;
        }

        const fallbackItemsResult = await pool.query(
            `
            SELECT
                oi.id,
                oi.order_id,
                oi.product_id,
                p.name AS product_name,
                oi.quantity,
                false AS is_prepared
            FROM order_items oi
            LEFT JOIN products p ON p.id = oi.product_id
            WHERE oi.order_id = $1
            ORDER BY oi.id ASC
            `,
            [order.id]
        );
        items = fallbackItemsResult.rows;
    }

    const hasPreparedItems = items.some((item) => Boolean(item.is_prepared));

    return {
        order: {
            id: order.id,
            session_id: order.session_id,
            table_id: order.table_id,
            status: order.status,
            total_amount: Number(order.total_amount || 0),
            created_at: order.created_at
        },
        tracking: {
            received: ['pending', 'approved', 'paid', 'preparing', 'completed'].includes(order.status),
            preparing: hasPreparedItems || ['preparing', 'completed'].includes(order.status),
            completed: order.status === 'completed'
        },
        items
    };
};

module.exports = {
    CustomerQrError,
    generateSessionQrs,
    getCustomerContext,
    createCustomerOrder,
    completeCustomerPayment,
    createCustomerRazorpayOrder,
    verifyCustomerRazorpayPayment,
    getCustomerOrderStatus,
    refreshSessionToken,
    clearSessionToken
};
