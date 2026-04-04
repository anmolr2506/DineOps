const crypto = require('crypto');
const Razorpay = require('razorpay');
const pool = require('../config/db');
const posTerminalService = require('./posTerminal.service');

class PaymentServiceError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
    }
}

let razorpayClient = null;

const getRazorpayClient = () => {
    if (razorpayClient) return razorpayClient;

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
        throw new PaymentServiceError('Razorpay credentials are not configured.', 500);
    }

    razorpayClient = new Razorpay({
        key_id: keyId,
        key_secret: keySecret
    });

    return razorpayClient;
};

const parseLocalOrderIdFromReceipt = (receipt) => {
    const value = String(receipt || '');
    const match = value.match(/^dineops_order_(\d+)_\d+$/);
    if (!match) return null;
    const localOrderId = Number(match[1]);
    return Number.isInteger(localOrderId) && localOrderId > 0 ? localOrderId : null;
};

const createRazorpayOrder = async ({ amount, orderId }) => {
    const inputAmount = Number(amount);
    const localOrderId = Number(orderId);

    if (!Number.isFinite(inputAmount) || inputAmount <= 0) {
        throw new PaymentServiceError('amount must be a positive number.', 400);
    }

    if (!Number.isInteger(localOrderId) || localOrderId <= 0) {
        throw new PaymentServiceError('order_id must be a positive integer.', 400);
    }

    const orderResult = await pool.query(
        `
        SELECT id, total_amount, status
        FROM orders
        WHERE id = $1
        LIMIT 1
        `,
        [localOrderId]
    );

    const localOrder = orderResult.rows[0];
    if (!localOrder) {
        throw new PaymentServiceError('Order not found.', 404);
    }

    if (localOrder.status === 'paid') {
        throw new PaymentServiceError('Order is already paid.', 409);
    }

    if (localOrder.status === 'cancelled') {
        throw new PaymentServiceError('Cancelled orders cannot be paid.', 409);
    }

    const expectedAmount = Number(localOrder.total_amount || 0);
    if (Math.abs(expectedAmount - inputAmount) > 0.01) {
        throw new PaymentServiceError('Amount mismatch with order total.', 400);
    }

    const amountInPaise = Math.round(expectedAmount * 100);
    const receipt = `dineops_order_${localOrderId}_${Date.now()}`;

    const razorpay = getRazorpayClient();
    const gatewayOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt
    });

    return {
        order_id: gatewayOrder.id,
        amount: gatewayOrder.amount,
        currency: gatewayOrder.currency,
        key_id: process.env.RAZORPAY_KEY_ID
    };
};

const verifyRazorpayPayment = async ({ payload, userId, io }) => {
    const razorpayOrderId = String(payload.razorpay_order_id || '').trim();
    const razorpayPaymentId = String(payload.razorpay_payment_id || '').trim();
    const razorpaySignature = String(payload.razorpay_signature || '').trim();
    const fallbackOrderId = Number(payload.order_id);

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        throw new PaymentServiceError('razorpay_order_id, razorpay_payment_id, and razorpay_signature are required.', 400);
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
        throw new PaymentServiceError('Razorpay secret is not configured.', 500);
    }

    const expectedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

    if (expectedSignature !== razorpaySignature) {
        throw new PaymentServiceError('Invalid Razorpay signature.', 400);
    }

    const razorpay = getRazorpayClient();
    const gatewayOrder = await razorpay.orders.fetch(razorpayOrderId);

    const parsedOrderId = parseLocalOrderIdFromReceipt(gatewayOrder.receipt);
    const localOrderId = parsedOrderId || (Number.isInteger(fallbackOrderId) && fallbackOrderId > 0 ? fallbackOrderId : null);

    if (!localOrderId) {
        throw new PaymentServiceError('Unable to map Razorpay order to local POS order.', 400);
    }

    try {
        const result = await posTerminalService.createPayment({
            userId,
            payload: {
                order_id: localOrderId,
                method: 'upi',
                transaction_ref: razorpayPaymentId
            },
            io
        });

        return {
            verified: true,
            local_order_id: localOrderId,
            ...result
        };
    } catch (error) {
        if (error?.statusCode === 409 && /already paid/i.test(String(error.message || ''))) {
            return {
                verified: true,
                local_order_id: localOrderId,
                message: 'Payment already verified earlier.'
            };
        }
        throw error;
    }
};

const getOrderPaymentContext = async ({ orderId }) => {
    const parsedOrderId = Number(orderId);
    if (!Number.isInteger(parsedOrderId) || parsedOrderId <= 0) {
        throw new PaymentServiceError('order_id must be a positive integer.', 400);
    }

    const result = await pool.query(
        `
        SELECT
            o.id AS order_id,
            o.session_id,
            o.table_id,
            o.status,
            o.total_amount,
            ps.allow_cash,
            ps.allow_digital,
            ps.allow_upi,
            ps.upi_id
        FROM orders o
        JOIN pos_sessions ps ON ps.id = o.session_id
        WHERE o.id = $1
        LIMIT 1
        `,
        [parsedOrderId]
    );

    if (!result.rows[0]) {
        throw new PaymentServiceError('Order not found.', 404);
    }

    return result.rows[0];
};

module.exports = {
    PaymentServiceError,
    createRazorpayOrder,
    verifyRazorpayPayment,
    getOrderPaymentContext
};
