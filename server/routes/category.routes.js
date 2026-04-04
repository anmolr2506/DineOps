const express = require('express');
const categoryController = require('../controllers/category.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/role.middleware');

const router = express.Router();

router.get('/categories', verifyToken, categoryController.getCategories);
router.post('/categories', verifyToken, requireAdmin, categoryController.createCategory);
router.put('/categories/:id', verifyToken, requireAdmin, categoryController.updateCategory);
router.delete('/categories/:id', verifyToken, requireAdmin, categoryController.deleteCategory);

router.get('/products', verifyToken, categoryController.getProducts);
router.post('/products', verifyToken, requireAdmin, categoryController.createProduct);
router.put('/products/:id', verifyToken, requireAdmin, categoryController.updateProduct);

module.exports = router;
