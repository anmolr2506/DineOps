const pool = require('../config/db');

const parsePositiveInt = (value) => {
	const parsed = Number(value);
	return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const toKitchenStatus = (status) => {
	if (status === 'completed') return 'served';
	if (status === 'paid' || status === 'pending') return 'received';
	return status;
};

const getOrdersQuery = (withPreparedColumn = true) => {
	const preparedField = withPreparedColumn ? 'COALESCE(oi.is_prepared, false)' : 'false';
	return `
		SELECT
			o.id,
			o.session_id,
			o.table_id,
			o.status,
			o.created_at,
			COALESCE(
				json_agg(
					json_build_object(
						'id', oi.id,
						'order_id', oi.order_id,
						'product_name', p.name,
						'category_name', c.name,
						'quantity', oi.quantity,
						'is_prepared', ${preparedField}
					)
					ORDER BY oi.id
				) FILTER (WHERE oi.id IS NOT NULL),
				'[]'::json
			) AS items
		FROM orders o
		LEFT JOIN order_items oi ON oi.order_id = o.id
		LEFT JOIN products p ON p.id = oi.product_id
		LEFT JOIN categories c ON c.id = p.category_id
		WHERE o.session_id = $1
		  AND o.status IN ('pending', 'paid', 'preparing', 'completed')
		GROUP BY o.id
		ORDER BY o.created_at ASC
	`;
};

const getKitchenOrders = async (req, res) => {
	const sessionId = parsePositiveInt(req.query.session_id);
	if (!sessionId) {
		return res.status(400).json({ error: 'session_id must be a positive integer.' });
	}

	try {
		let result;
		try {
			result = await pool.query(getOrdersQuery(true), [sessionId]);
		} catch (error) {
			if (error.code !== '42703') {
				throw error;
			}
			result = await pool.query(getOrdersQuery(false), [sessionId]);
		}

		const orders = result.rows.map((row) => ({
			id: row.id,
			session_id: row.session_id,
			table_id: row.table_id,
			status: toKitchenStatus(row.status),
			created_at: row.created_at,
			items: Array.isArray(row.items) ? row.items : []
		}));

		return res.status(200).json({ orders });
	} catch (error) {
		return res.status(500).json({ error: error.message || 'Failed to fetch kitchen orders.' });
	}
};

const updateOrderStatus = async (req, res) => {
	const orderId = parsePositiveInt(req.params.id);
	const incomingStatus = String(req.body?.status || '').trim().toLowerCase();

	if (!orderId) {
		return res.status(400).json({ error: 'Order id must be a positive integer.' });
	}

	if (!['preparing', 'served'].includes(incomingStatus)) {
		return res.status(400).json({ error: 'status must be preparing or served.' });
	}

	const dbStatus = incomingStatus === 'served' ? 'completed' : incomingStatus;

	try {
		const result = await pool.query(
			`
			UPDATE orders
			SET status = $1
			WHERE id = $2
			RETURNING id, session_id, table_id, status, created_at
			`,
			[dbStatus, orderId]
		);

		if (!result.rows[0]) {
			return res.status(404).json({ error: 'Order not found.' });
		}

		const updatedOrder = {
			...result.rows[0],
			status: toKitchenStatus(result.rows[0].status)
		};

		await pool.query(
			'INSERT INTO order_status_history (order_id, status) VALUES ($1, $2)',
			[orderId, dbStatus]
		);

		const io = req.app.locals.io;
		if (io) {
			io.to(`session_${updatedOrder.session_id}`).emit('update_order_status', updatedOrder);
			io.to(`session_${updatedOrder.session_id}`).emit('order_status_updated', {
				order_id: updatedOrder.id,
				session_id: updatedOrder.session_id,
				status: updatedOrder.status,
				at: new Date().toISOString()
			});
		}

		return res.status(200).json({ order: updatedOrder });
	} catch (error) {
		return res.status(500).json({ error: error.message || 'Failed to update order status.' });
	}
};

const updateOrderItemPrepared = async (req, res) => {
	const orderItemId = parsePositiveInt(req.params.id);
	const isPrepared = Boolean(req.body?.is_prepared);

	if (!orderItemId) {
		return res.status(400).json({ error: 'Order item id must be a positive integer.' });
	}

	try {
		const result = await pool.query(
			`
			UPDATE order_items oi
			SET is_prepared = $1
			WHERE oi.id = $2
			RETURNING oi.id, oi.order_id, oi.is_prepared
			`,
			[isPrepared, orderItemId]
		);

		if (!result.rows[0]) {
			return res.status(404).json({ error: 'Order item not found.' });
		}

		const item = result.rows[0];
		const orderResult = await pool.query(
			'SELECT id, session_id FROM orders WHERE id = $1 LIMIT 1',
			[item.order_id]
		);

		const sessionId = orderResult.rows[0]?.session_id;
		const io = req.app.locals.io;
		if (io && sessionId) {
			io.to(`session_${sessionId}`).emit('update_item_status', {
				id: item.id,
				order_id: item.order_id,
				is_prepared: item.is_prepared
			});
		}

		return res.status(200).json({ item });
	} catch (error) {
		if (error.code === '42703') {
			return res.status(400).json({
				error: 'is_prepared column is missing. Run server/database/kitchen_update.sql.'
			});
		}
		return res.status(500).json({ error: error.message || 'Failed to update item status.' });
	}
};

module.exports = {
	getKitchenOrders,
	updateOrderStatus,
	updateOrderItemPrepared
};
