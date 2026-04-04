const variantService = require('../services/variant.service');

const parseSessionId = (value) => Number(value);

const getVariantGroups = async (req, res) => {
    try {
        const payload = await variantService.listVariantGroups({
            userId: req.user.id,
            sessionId: parseSessionId(req.query.session_id),
            search: req.query.search || '',
            page: req.query.page || 1,
            limit: req.query.limit || 8
        });
        res.status(200).json(payload);
    } catch (err) {
        res.status(err.statusCode || 500).json({ error: err.message || 'Failed to fetch variant groups.' });
    }
};

const createVariantGroup = async (req, res) => {
    try {
        const group = await variantService.createVariantGroup({
            userId: req.user.id,
            sessionId: parseSessionId(req.body.session_id),
            payload: req.body
        });
        res.status(201).json({ group });
    } catch (err) {
        res.status(err.statusCode || 500).json({ error: err.message || 'Failed to create variant group.' });
    }
};

const updateVariantGroup = async (req, res) => {
    try {
        const group = await variantService.updateVariantGroup({
            userId: req.user.id,
            sessionId: parseSessionId(req.body.session_id),
            groupId: Number(req.params.id),
            payload: req.body
        });
        res.status(200).json({ group });
    } catch (err) {
        res.status(err.statusCode || 500).json({ error: err.message || 'Failed to update variant group.' });
    }
};

const deleteVariantGroup = async (req, res) => {
    try {
        await variantService.deleteVariantGroup({
            userId: req.user.id,
            sessionId: parseSessionId(req.body.session_id || req.query.session_id),
            groupId: Number(req.params.id)
        });
        res.status(200).json({ message: 'Variant group deleted successfully.' });
    } catch (err) {
        res.status(err.statusCode || 500).json({ error: err.message || 'Failed to delete variant group.' });
    }
};

const addVariantValue = async (req, res) => {
    try {
        const value = await variantService.addVariantValue({
            userId: req.user.id,
            sessionId: parseSessionId(req.body.session_id),
            groupId: Number(req.params.id),
            payload: req.body
        });
        res.status(201).json({ value });
    } catch (err) {
        res.status(err.statusCode || 500).json({ error: err.message || 'Failed to add variant value.' });
    }
};

module.exports = {
    getVariantGroups,
    createVariantGroup,
    updateVariantGroup,
    deleteVariantGroup,
    addVariantValue
};
