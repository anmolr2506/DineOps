const restaurantConfigService = require('../services/restaurantConfig.service');

const getSettings = async (_req, res) => {
    try {
        const config = await restaurantConfigService.getRestaurantConfig();
        return res.status(200).json({ config });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message || 'Failed to load restaurant settings.' });
    }
};

const updateSettings = async (req, res) => {
    try {
        const payload = {
            ...(req.body || {})
        };

        if (req.file?.filename) {
            const port = process.env.PORT || 5000;
            const serverOrigin = process.env.SERVER_ORIGIN || `http://localhost:${port}`;
            payload.logo_url = `${serverOrigin}/generated/logos/${req.file.filename}`;
        }

        const config = await restaurantConfigService.updateRestaurantConfig({ payload });
        return res.status(200).json({
            message: 'Restaurant settings updated successfully.',
            config
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message || 'Failed to update restaurant settings.' });
    }
};

module.exports = {
    getSettings,
    updateSettings
};
