const express = require('express');
const paymentController = require('../controllers/payment.controller');
const { verifyToken, requireRole } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/payment/create-order', verifyToken, requireRole(['admin', 'staff']), paymentController.createOrder);
router.post('/payment/verify', verifyToken, requireRole(['admin', 'staff']), paymentController.verify);
router.get('/payment/order/:orderId/context', verifyToken, requireRole(['admin', 'staff']), paymentController.getOrderContext);

module.exports = router;
