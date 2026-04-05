const express = require('express');
const customerOrderController = require('../controllers/customerOrder.controller');
const { verifyToken, requireRole } = require('../middleware/auth.middleware');

const router = express.Router();

router.get(
    '/customer/qr/session/:sessionId',
    verifyToken,
    requireRole(['admin', 'staff', 'kitchen']),
    customerOrderController.generateSessionQrs
);

router.get('/customer/context', customerOrderController.getCustomerContext);
router.post('/customer/order', customerOrderController.createCustomerOrder);
router.post('/customer/order/:id/razorpay-order', customerOrderController.createCustomerRazorpayOrder);
router.post('/customer/order/:id/razorpay-verify', customerOrderController.verifyCustomerRazorpayPayment);
router.post('/customer/order/:id/pay', customerOrderController.completeCustomerPayment);
router.get('/customer/order/:id/status', customerOrderController.getCustomerOrderStatus);

module.exports = router;
