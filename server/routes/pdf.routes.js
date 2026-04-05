const express = require('express');
const pdfController = require('../controllers/pdf.controller');
const { verifyToken, requireRole } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/generate-receipt/:order_id', verifyToken, requireRole(['admin', 'staff', 'kitchen']), pdfController.generateReceipt);
router.post('/session/report/:session_id', verifyToken, requireRole(['admin', 'staff', 'kitchen']), pdfController.generateSessionReport);

module.exports = router;
