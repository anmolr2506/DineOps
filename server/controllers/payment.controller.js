const paymentService = require('../services/payment.service');
const pdfService = require('../services/pdf.service');

const createOrder = async (req, res) => {
    try {
        const payload = await paymentService.createRazorpayOrder({
            amount: req.body?.amount,
            orderId: req.body?.order_id
        });

        return res.status(200).json(payload);
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message || 'Failed to create Razorpay order.' });
    }
};

const verify = async (req, res) => {
    try {
        const payload = await paymentService.verifyRazorpayPayment({
            payload: req.body || {},
            userId: req.user.id,
            io: req.app.locals.io
        });

        const orderId = Number(payload?.local_order_id || payload?.order?.id);
        if (Number.isInteger(orderId) && orderId > 0) {
            try {
                const receipt = await pdfService.generateAndStoreReceipt({ orderId });
                payload.receipt_download_url = receipt.relativeUrl;
            } catch (receiptError) {
                payload.receipt_warning = receiptError.message || 'Receipt could not be auto-generated.';
            }
        }

        return res.status(200).json(payload);
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message || 'Failed to verify payment.' });
    }
};

const getOrderContext = async (req, res) => {
    try {
        const context = await paymentService.getOrderPaymentContext({
            orderId: req.params.orderId
        });

        return res.status(200).json({ context });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message || 'Failed to fetch order payment context.' });
    }
};

module.exports = {
    createOrder,
    verify,
    getOrderContext
};
