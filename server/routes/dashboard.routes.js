const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { verifyToken, requireRole } = require('../middleware/auth.middleware');

router.use(verifyToken);

router.get('/kpis', dashboardController.getKpis);
router.get('/revenue-trend', dashboardController.getRevenueTrend);
router.get('/daily-sales', dashboardController.getDailySales);
router.get('/top-products', dashboardController.getTopProducts);
router.get('/category-performance', dashboardController.getCategoryPerformance);
router.get('/recent-orders', dashboardController.getRecentOrders);
router.get('/live-activity', dashboardController.getLiveActivity);
router.get('/preparation', dashboardController.getOngoingPreparation);
router.patch('/preparation/:orderId/status', requireRole(['admin', 'kitchen']), dashboardController.updatePreparationStatus);

module.exports = router;
