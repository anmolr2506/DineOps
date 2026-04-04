const express = require('express');
const variantController = require('../controllers/variant.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/role.middleware');

const router = express.Router();

router.get('/groups', verifyToken, variantController.getVariantGroups);
router.post('/groups', verifyToken, requireAdmin, variantController.createVariantGroup);
router.put('/groups/:id', verifyToken, requireAdmin, variantController.updateVariantGroup);
router.delete('/groups/:id', verifyToken, requireAdmin, variantController.deleteVariantGroup);
router.post('/groups/:id/values', verifyToken, requireAdmin, variantController.addVariantValue);

module.exports = router;
