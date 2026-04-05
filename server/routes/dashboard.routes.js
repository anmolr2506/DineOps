const express = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const { verifyToken, requireRole } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/global', verifyToken, requireRole(['admin', 'staff']), dashboardController.getGlobalDashboard);
router.get('/session', verifyToken, requireRole(['admin', 'staff', 'kitchen']), dashboardController.getSessionDashboard);
router.get('/session/:id/metrics', verifyToken, requireRole(['admin', 'staff', 'kitchen']), dashboardController.getSessionMetrics);

module.exports = router;
