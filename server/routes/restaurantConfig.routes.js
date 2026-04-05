const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const restaurantConfigController = require('../controllers/restaurantConfig.controller');
const { verifyToken, requireRole } = require('../middleware/auth.middleware');

const router = express.Router();

const logosDir = path.join(__dirname, '..', 'generated', 'logos');
fs.mkdirSync(logosDir, { recursive: true });

const storage = multer.diskStorage({
	destination: (_req, _file, callback) => {
		callback(null, logosDir);
	},
	filename: (_req, file, callback) => {
		const safeBase = path
			.basename(file.originalname || 'logo')
			.replace(/[^a-zA-Z0-9._-]/g, '_')
			.replace(/\.(png|jpe?g)$/i, '');

		const ext = (path.extname(file.originalname || '').toLowerCase() || '.png');
		callback(null, `restaurant-logo-${Date.now()}-${safeBase}${ext}`);
	}
});

const upload = multer({
	storage,
	limits: { fileSize: 3 * 1024 * 1024 },
	fileFilter: (_req, file, callback) => {
		const mime = String(file.mimetype || '').toLowerCase();
		if (!['image/png', 'image/jpeg', 'image/jpg'].includes(mime)) {
			callback(new Error('Only PNG and JPEG/JPG logo files are allowed.'));
			return;
		}
		callback(null, true);
	}
});

const handleLogoUpload = (req, res, next) => {
	upload.single('logo')(req, res, (error) => {
		if (!error) {
			next();
			return;
		}

		const message = error.code === 'LIMIT_FILE_SIZE'
			? 'Logo file must be 3MB or smaller.'
			: (error.message || 'Invalid logo upload.');

		res.status(400).json({ error: message });
	});
};

router.get('/restaurant/settings', verifyToken, requireRole(['admin', 'staff', 'kitchen']), restaurantConfigController.getSettings);
router.put('/restaurant/settings', verifyToken, requireRole(['admin']), handleLogoUpload, restaurantConfigController.updateSettings);

module.exports = router;
