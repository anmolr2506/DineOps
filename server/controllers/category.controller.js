const categoryService = require('../services/category.service');

const emitDashboardRefresh = (req) => {
    const io = req.app.locals.io;
    if (!io) return;
    io.emit('dashboard_refresh', {
        scope: 'global',
        at: new Date().toISOString()
    });
};

const getCategories = async (req, res) => {
    try {
        const payload = await categoryService.listCategories({
            search: req.query.search || '',
            page: req.query.page || 1,
            limit: req.query.limit || 6
        });
        res.status(200).json(payload);
    } catch (err) {
        res.status(err.statusCode || 500).json({ error: err.message || 'Failed to fetch categories.' });
    }
};

const createCategory = async (req, res) => {
    try {
        const category = await categoryService.createCategory({
            userId: req.user.id,
            payload: req.body
        });
        emitDashboardRefresh(req);
        res.status(201).json({ category });
    } catch (err) {
        res.status(err.statusCode || 500).json({ error: err.message || 'Failed to create category.' });
    }
};

const updateCategory = async (req, res) => {
    try {
        const categoryId = Number(req.params.id);
        const category = await categoryService.updateCategory({
            categoryId,
            payload: req.body
        });
        emitDashboardRefresh(req);
        res.status(200).json({ category });
    } catch (err) {
        res.status(err.statusCode || 500).json({ error: err.message || 'Failed to update category.' });
    }
};

const deleteCategory = async (req, res) => {
    try {
        const categoryId = Number(req.params.id);
        await categoryService.deleteCategory({
            categoryId
        });
        emitDashboardRefresh(req);
        res.status(200).json({ message: 'Category deleted successfully.' });
    } catch (err) {
        res.status(err.statusCode || 500).json({ error: err.message || 'Failed to delete category.' });
    }
};

const getProducts = async (req, res) => {
    try {
        const categoryId = req.query.category_id !== undefined ? Number(req.query.category_id) : undefined;
        const products = await categoryService.listProducts({
            categoryId,
            search: req.query.search || ''
        });
        res.status(200).json({ products });
    } catch (err) {
        res.status(err.statusCode || 500).json({ error: err.message || 'Failed to fetch products.' });
    }
};

const createProduct = async (req, res) => {
    try {
        const product = await categoryService.createProduct({
            userId: req.user.id,
            payload: req.body
        });
        emitDashboardRefresh(req);
        res.status(201).json({ product });
    } catch (err) {
        res.status(err.statusCode || 500).json({ error: err.message || 'Failed to create product.' });
    }
};

const updateProduct = async (req, res) => {
    try {
        const productId = Number(req.params.id);
        const product = await categoryService.updateProduct({
            productId,
            payload: req.body
        });
        emitDashboardRefresh(req);
        res.status(200).json({ product });
    } catch (err) {
        res.status(err.statusCode || 500).json({ error: err.message || 'Failed to update product.' });
    }
};

module.exports = {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getProducts,
    createProduct,
    updateProduct
};
