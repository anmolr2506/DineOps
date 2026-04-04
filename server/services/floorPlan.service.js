const pool = require('../config/db');

class ServiceError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
    }
}

const sanitizeFloorName = (name) => {
    const value = typeof name === 'string' ? name.trim() : '';
    if (!value) {
        throw new ServiceError('Floor name is required.', 400);
    }
    if (value.length > 100) {
        throw new ServiceError('Floor name must be 100 characters or less.', 400);
    }
    return value;
};

const makeUniqueFloorName = async (baseName, client) => {
    let candidate = baseName;
    let attempt = 1;

    while (true) {
        const exists = await client.query(
            `SELECT 1 FROM floors WHERE LOWER(name) = LOWER($1) LIMIT 1`,
            [candidate]
        );

        if (exists.rows.length === 0) {
            return candidate;
        }

        attempt += 1;
        candidate = `${baseName} (${attempt})`;
        if (candidate.length > 100) {
            candidate = `${baseName.slice(0, 90)} (${attempt})`;
        }
    }
};

const toStatus = (isActive) => (isActive ? 'active' : 'inactive');

const getFloors = async () => {
    const result = await pool.query(
        `
        SELECT
            f.id,
            f.name,
            COUNT(t.id)::int AS table_count
        FROM floors f
        LEFT JOIN tables t ON t.floor_id = f.id
        GROUP BY f.id
        ORDER BY f.id ASC
        `
    );

    return { floors: result.rows };
};

const createFloor = async ({ name }) => {
    const floorName = sanitizeFloorName(name);

    const result = await pool.query(
        `
        INSERT INTO floors (name)
        VALUES ($1)
        RETURNING id, name
        `,
        [floorName]
    );

    return result.rows[0];
};

const updateFloor = async ({ floorId, name }) => {
    const floorName = sanitizeFloorName(name);

    const result = await pool.query(
        `
        UPDATE floors
        SET name = $2
        WHERE id = $1
        RETURNING id, name
        `,
        [floorId, floorName]
    );

    if (result.rows.length === 0) {
        throw new ServiceError('Floor not found.', 404);
    }

    return result.rows[0];
};

const deleteFloor = async ({ floorId }) => {
    const result = await pool.query(
        `
        DELETE FROM floors
        WHERE id = $1
        RETURNING id
        `,
        [floorId]
    );

    if (result.rows.length === 0) {
        throw new ServiceError('Floor not found.', 404);
    }
};

const duplicateFloor = async ({ floorId }) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const floorResult = await client.query(
            `SELECT id, name FROM floors WHERE id = $1 LIMIT 1`,
            [floorId]
        );
        if (floorResult.rows.length === 0) {
            throw new ServiceError('Floor not found.', 404);
        }

        const original = floorResult.rows[0];
        const copyName = await makeUniqueFloorName(`${original.name} Copy`, client);

        const insertedFloor = await client.query(
            `INSERT INTO floors (name) VALUES ($1) RETURNING id, name`,
            [copyName]
        );
        const newFloor = insertedFloor.rows[0];

        await client.query(
            `
            INSERT INTO tables (floor_id, table_number, seats, is_active)
            SELECT $1, table_number, seats, is_active
            FROM tables
            WHERE floor_id = $2
            ORDER BY table_number ASC
            `,
            [newFloor.id, floorId]
        );

        await client.query('COMMIT');
        return newFloor;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

const getTables = async ({ floorId }) => {
    const floorResult = await pool.query(
        `SELECT id, name FROM floors WHERE id = $1 LIMIT 1`,
        [floorId]
    );
    if (floorResult.rows.length === 0) {
        throw new ServiceError('Floor not found.', 404);
    }

    const result = await pool.query(
        `
        SELECT id, floor_id, table_number, seats, is_active
        FROM tables
        WHERE floor_id = $1
        ORDER BY table_number ASC
        `,
        [floorId]
    );

    return {
        floor: floorResult.rows[0],
        tables: result.rows.map((row) => ({
            ...row,
            status: toStatus(row.is_active)
        }))
    };
};

const createTable = async ({ floorId, tableNumber, seats, status }) => {
    if (!Number.isInteger(tableNumber) || tableNumber <= 0) {
        throw new ServiceError('table_number must be a positive integer.', 400);
    }
    if (!Number.isInteger(seats) || seats <= 0) {
        throw new ServiceError('seats_count must be a positive integer.', 400);
    }

    const floorResult = await pool.query(
        `SELECT id FROM floors WHERE id = $1 LIMIT 1`,
        [floorId]
    );
    if (floorResult.rows.length === 0) {
        throw new ServiceError('Floor not found.', 404);
    }

    const isActive = status ? status === 'active' : true;

    const result = await pool.query(
        `
        INSERT INTO tables (floor_id, table_number, seats, is_active)
        VALUES ($1, $2, $3, $4)
        RETURNING id, floor_id, table_number, seats, is_active
        `,
        [floorId, tableNumber, seats, isActive]
    );

    return {
        ...result.rows[0],
        status: toStatus(result.rows[0].is_active)
    };
};

const updateTable = async ({ tableId, tableNumber, seats }) => {
    if (!Number.isInteger(tableNumber) || tableNumber <= 0) {
        throw new ServiceError('table_number must be a positive integer.', 400);
    }
    if (!Number.isInteger(seats) || seats <= 0) {
        throw new ServiceError('seats_count must be a positive integer.', 400);
    }

    const result = await pool.query(
        `
        UPDATE tables
        SET table_number = $2,
            seats = $3
        WHERE id = $1
        RETURNING id, floor_id, table_number, seats, is_active
        `,
        [tableId, tableNumber, seats]
    );

    if (result.rows.length === 0) {
        throw new ServiceError('Table not found.', 404);
    }

    return {
        ...result.rows[0],
        status: toStatus(result.rows[0].is_active)
    };
};

const deleteTable = async ({ tableId }) => {
    const result = await pool.query(
        `DELETE FROM tables WHERE id = $1 RETURNING id`,
        [tableId]
    );

    if (result.rows.length === 0) {
        throw new ServiceError('Table not found.', 404);
    }
};

const duplicateTable = async ({ tableId }) => {
    const existing = await pool.query(
        `SELECT id, floor_id, seats, is_active FROM tables WHERE id = $1 LIMIT 1`,
        [tableId]
    );

    if (existing.rows.length === 0) {
        throw new ServiceError('Table not found.', 404);
    }

    const original = existing.rows[0];
    const nextNumberResult = await pool.query(
        `SELECT COALESCE(MAX(table_number), 0) + 1 AS next_number FROM tables WHERE floor_id = $1`,
        [original.floor_id]
    );

    const nextNumber = Number(nextNumberResult.rows[0].next_number);

    const inserted = await pool.query(
        `
        INSERT INTO tables (floor_id, table_number, seats, is_active)
        VALUES ($1, $2, $3, $4)
        RETURNING id, floor_id, table_number, seats, is_active
        `,
        [original.floor_id, nextNumber, original.seats, original.is_active]
    );

    return {
        ...inserted.rows[0],
        status: toStatus(inserted.rows[0].is_active)
    };
};

const updateTableStatus = async ({ tableId, status }) => {
    if (!['active', 'inactive'].includes(status)) {
        throw new ServiceError('status must be either active or inactive.', 400);
    }

    const isActive = status === 'active';

    const updated = await pool.query(
        `
        UPDATE tables
        SET is_active = $2
        WHERE id = $1
        RETURNING id, floor_id, table_number, seats, is_active
        `,
        [tableId, isActive]
    );

    if (updated.rows.length === 0) {
        throw new ServiceError('Table not found.', 404);
    }

    return {
        ...updated.rows[0],
        status: toStatus(updated.rows[0].is_active)
    };
};

module.exports = {
    ServiceError,
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
