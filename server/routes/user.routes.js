const express = require('express');
const router = express.Router();

const userController = require('../controllers/user.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/role.middleware');

router.get('/my-approval-status', verifyToken, userController.getMyApprovalStatus);
router.get('/pending', verifyToken, requireAdmin, userController.getPendingUsers);
router.get('/pending/count', verifyToken, requireAdmin, userController.getPendingUsersCount);
router.post('/approve', verifyToken, requireAdmin, userController.approveUser);
router.post('/reject', verifyToken, requireAdmin, userController.rejectUser);

module.exports = router;
