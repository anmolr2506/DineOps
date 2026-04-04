const express = require('express');
const customerReservationController = require('../controllers/customerReservation.controller');

const router = express.Router();

router.get('/customer/floor-plan', customerReservationController.getCustomerFloorPlan);
router.post('/customer/table-holds', customerReservationController.acquireTableHold);
router.delete('/customer/table-holds', customerReservationController.releaseTableHold);
router.post('/customer/reservations', customerReservationController.createReservation);

module.exports = router;
