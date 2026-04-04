const express = require('express');
const sessionController = require('../controllers/session.controller');
const { verifyToken, requireRole } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/active', verifyToken, sessionController.getActiveSessions);
router.post('/join', verifyToken, sessionController.joinSession);
router.get('/current', verifyToken, sessionController.getCurrentSession);
router.post('/', verifyToken, requireRole(['admin']), sessionController.createSession);
router.patch('/:sessionId/stop', verifyToken, requireRole(['admin']), sessionController.stopSession);

module.exports = router;
