const express = require('express');
const floorPlanController = require('../controllers/floorPlan.controller');
const { verifyToken, requireRole } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/floors', verifyToken, requireRole(['admin', 'staff', 'kitchen']), floorPlanController.getFloors);
router.post('/floors', verifyToken, requireRole(['admin']), floorPlanController.createFloor);
router.put('/floors/:id', verifyToken, requireRole(['admin']), floorPlanController.updateFloor);
router.delete('/floors/:id', verifyToken, requireRole(['admin']), floorPlanController.deleteFloor);
router.post('/floors/duplicate/:id', verifyToken, requireRole(['admin']), floorPlanController.duplicateFloor);

router.get('/tables', verifyToken, requireRole(['admin', 'staff', 'kitchen']), floorPlanController.getTables);
router.post('/tables', verifyToken, requireRole(['admin']), floorPlanController.createTable);
router.put('/tables/:id', verifyToken, requireRole(['admin']), floorPlanController.updateTable);
router.delete('/tables/:id', verifyToken, requireRole(['admin']), floorPlanController.deleteTable);
router.post('/tables/duplicate/:id', verifyToken, requireRole(['admin']), floorPlanController.duplicateTable);
router.put('/tables/:id/status', verifyToken, requireRole(['admin', 'staff']), floorPlanController.updateTableStatus);
router.delete('/tables/:id/bookings', verifyToken, requireRole(['admin']), floorPlanController.clearTableBookings);

module.exports = router;
