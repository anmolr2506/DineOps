const userService = require('../services/user.service');

exports.getPendingUsers = async (req, res) => {
    try {
        const users = await userService.getPendingUsers();
        res.json({ users });
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message || 'Failed to fetch pending users.' });
    }
};

exports.getPendingUsersCount = async (req, res) => {
    try {
        const pending_count = await userService.getPendingUsersCount();
        res.json({ pending_count });
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message || 'Failed to fetch pending users count.' });
    }
};

exports.approveUser = async (req, res) => {
    try {
        const { user_id, role } = req.body;
        if (!user_id || !role) {
            return res.status(400).json({ error: 'user_id and role are required.' });
        }

        const approvedUser = await userService.approveUser(Number(user_id), role);
        res.json({ message: 'User approved successfully.', user: approvedUser });
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message || 'Failed to approve user.' });
    }
};

exports.rejectUser = async (req, res) => {
    try {
        const { user_id } = req.body;
        if (!user_id) {
            return res.status(400).json({ error: 'user_id is required.' });
        }

        const rejectedUser = await userService.rejectUser(Number(user_id));
        res.json({ message: 'User rejected successfully.', user: rejectedUser });
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message || 'Failed to reject user.' });
    }
};

exports.getMyApprovalStatus = async (req, res) => {
    try {
        const user = await userService.getMyApprovalStatus(req.user.id);
        res.json({ user });
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message || 'Failed to fetch approval status.' });
    }
};
