const floorPlanService = require('../services/floorPlan.service');

const getFloors = async (req, res) => {
    try {
        const data = await floorPlanService.getFloors();
        return res.status(200).json(data);
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message || 'Failed to load floors.' });
    }
};

const createFloor = async (req, res) => {
    try {
        const floor = await floorPlanService.createFloor({
            name: req.body?.floor_name
        });
        return res.status(201).json({ floor });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message || 'Failed to create floor.' });
    }
};

const updateFloor = async (req, res) => {
    try {
        const floorId = Number(req.params.id);
        if (!Number.isInteger(floorId) || floorId <= 0) {
            return res.status(400).json({ error: 'Invalid floor id.' });
        }

        const floor = await floorPlanService.updateFloor({
            floorId,
            name: req.body?.floor_name
        });

        return res.status(200).json({ floor });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message || 'Failed to update floor.' });
    }
};

const deleteFloor = async (req, res) => {
    try {
        const floorId = Number(req.params.id);
        if (!Number.isInteger(floorId) || floorId <= 0) {
            return res.status(400).json({ error: 'Invalid floor id.' });
        }

        await floorPlanService.deleteFloor({ floorId });
        return res.status(200).json({ message: 'Floor deleted successfully.' });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message || 'Failed to delete floor.' });
    }
};

const duplicateFloor = async (req, res) => {
    try {
        const floorId = Number(req.params.id);
        if (!Number.isInteger(floorId) || floorId <= 0) {
            return res.status(400).json({ error: 'Invalid floor id.' });
        }

        const floor = await floorPlanService.duplicateFloor({ floorId });

        return res.status(201).json({ floor });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message || 'Failed to duplicate floor.' });
    }
};

const getTables = async (req, res) => {
    try {
        const floorId = Number(req.query.floor_id);
        if (!Number.isInteger(floorId) || floorId <= 0) {
            return res.status(400).json({ error: 'floor_id must be a positive integer.' });
        }

        const data = await floorPlanService.getTables({ floorId });
        return res.status(200).json(data);
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message || 'Failed to load tables.' });
    }
};

const createTable = async (req, res) => {
    try {
        const floorId = Number(req.body?.floor_id);
        const tableNumber = Number(req.body?.table_number);
        const seatsCount = Number(req.body?.seats_count);

        const table = await floorPlanService.createTable({
            floorId,
            tableNumber,
            seats: seatsCount,
            status: req.body?.status
        });

        return res.status(201).json({ table });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message || 'Failed to create table.' });
    }
};

const updateTable = async (req, res) => {
    try {
        const tableId = Number(req.params.id);
        if (!Number.isInteger(tableId) || tableId <= 0) {
            return res.status(400).json({ error: 'Invalid table id.' });
        }

        const tableNumber = Number(req.body?.table_number);
        const seatsCount = Number(req.body?.seats_count);

        const table = await floorPlanService.updateTable({
            tableId,
            tableNumber,
            seats: seatsCount
        });

        return res.status(200).json({ table });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message || 'Failed to update table.' });
    }
};

const deleteTable = async (req, res) => {
    try {
        const tableId = Number(req.params.id);
        if (!Number.isInteger(tableId) || tableId <= 0) {
            return res.status(400).json({ error: 'Invalid table id.' });
        }

        await floorPlanService.deleteTable({ tableId });

        return res.status(200).json({ message: 'Table deleted successfully.' });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message || 'Failed to delete table.' });
    }
};

const duplicateTable = async (req, res) => {
    try {
        const tableId = Number(req.params.id);
        if (!Number.isInteger(tableId) || tableId <= 0) {
            return res.status(400).json({ error: 'Invalid table id.' });
        }

        const table = await floorPlanService.duplicateTable({ tableId });

        return res.status(201).json({ table });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message || 'Failed to duplicate table.' });
    }
};

const updateTableStatus = async (req, res) => {
    try {
        const tableId = Number(req.params.id);
        if (!Number.isInteger(tableId) || tableId <= 0) {
            return res.status(400).json({ error: 'Invalid table id.' });
        }

        const table = await floorPlanService.updateTableStatus({
            tableId,
            status: req.body?.status
        });

        return res.status(200).json({ table });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message || 'Failed to update table status.' });
    }
};

module.exports = {
    getFloors,
    createFloor,
    updateFloor,
    deleteFloor,
    duplicateFloor,
    getTables,
    createTable,
    updateTable,
    deleteTable,
    duplicateTable,
    updateTableStatus
};
