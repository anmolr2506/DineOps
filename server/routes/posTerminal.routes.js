const express = require('express');
const posTerminalController = require('../controllers/posTerminal.controller');
const { verifyToken, requireRole } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/customers', verifyToken, requireRole(['admin', 'staff']), posTerminalController.getCustomers);
router.post('/customers', verifyToken, requireRole(['admin', 'staff']), posTerminalController.createCustomer);

router.post('/orders', verifyToken, requireRole(['admin', 'staff']), posTerminalController.createOrder);
router.get('/orders', verifyToken, requireRole(['admin', 'staff', 'kitchen']), posTerminalController.listOrders);
router.patch('/orders/:orderId/decision', verifyToken, requireRole(['admin']), posTerminalController.decideOrder);

router.post('/payments', verifyToken, requireRole(['admin', 'staff']), posTerminalController.createPayment);

module.exports = router;
