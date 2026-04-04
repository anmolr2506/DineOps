const dashboardService = require('../services/dashboard.service');

const getGlobalDashboard = async (req, res) => {
    try {
        const filters = {
            session_id: req.query.session_id,
            date_from: req.query.date_from,
            date_to: req.query.date_to
        };

        const [stats, sessions, trend] = await Promise.all([
            dashboardService.getGlobalStats(filters),
            dashboardService.getAllSessionsSummary(filters),
            dashboardService.getGlobalTrend(filters)
        ]);

        return res.status(200).json({
            stats,
            sessions,
            trend
        });
    } catch (err) {
        return res.status(err.statusCode || 500).json({
            error: err.message || 'Failed to fetch global dashboard.'
        });
    }
};

const getSessionDashboard = async (req, res) => {
    try {
        const sessionId = Number(req.query.session_id);

        await dashboardService.validateSessionAccess({
            userId: req.user.id,
            role: req.user.role,
            sessionId
        });

        const [stats, recentOrders, liveActivity, salesTrend] = await Promise.all([
            dashboardService.getDashboardStats(sessionId),
            dashboardService.getRecentOrders(sessionId),
            dashboardService.getLiveActivity(sessionId),
            dashboardService.getSalesTrend(sessionId)
        ]);

        if (req.user.role === 'kitchen') {
            stats.revenue = null;
        }

        return res.status(200).json({
            session_id: sessionId,
            stats,
            recentOrders,
            liveActivity,
            salesTrend
        });
    } catch (err) {
        return res.status(err.statusCode || 500).json({
            error: err.message || 'Failed to fetch session dashboard.'
        });
    }
};

module.exports = {
    getGlobalDashboard,
    getSessionDashboard
};
