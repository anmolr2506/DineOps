const express = require('express');
const kitchenController = require('../controllers/kitchen.controller');
const { verifyToken, requireRole } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/orders', verifyToken, requireRole(['admin', 'kitchen']), kitchenController.getKitchenOrders);
router.put('/order/:id/status', verifyToken, requireRole(['admin', 'kitchen']), kitchenController.updateOrderStatus);
router.put('/order-item/:id/prepared', verifyToken, requireRole(['admin', 'kitchen']), kitchenController.updateOrderItemPrepared);

module.exports = router;
