const pool = require('../config/db');

class ServiceError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
    }
}

const cleanExpiredHolds = async (client) => {
    await client.query(`DELETE FROM table_holds WHERE expires_at <= NOW()`);
};

const resolveSlotWindow = ({ date, time, durationMinutes }) => {
    if (!date || !time) {
        throw new ServiceError('date and time are required.', 400);
    }

    const duration = Number(durationMinutes || 120);
    const allowedDurations = [60, 120, 180];
    if (!Number.isInteger(duration) || !allowedDurations.includes(duration)) {
        throw new ServiceError('duration_minutes must be one of 60, 120, or 180.', 400);
    }

    const start = new Date(`${date}T${time}:00`);
    if (Number.isNaN(start.getTime())) {
        throw new ServiceError('Invalid date/time combination.', 400);
    }

    const end = new Date(start.getTime() + duration * 60 * 1000);
    return { slotStart: start, slotEnd: end, duration };
};

const toPhone = (phone) => {
    const cleaned = String(phone || '').trim();
    if (!/^\d{10}$/.test(cleaned)) {
        throw new ServiceError('phone must be a valid 10-digit number.', 400);
    }
    return cleaned;
};

const emitReservationUpdate = (io, payload) => {
    if (!io) return;
    io.emit('table_reservation_changed', {
        ...payload,
        at: new Date().toISOString()
    });
};

const cleanupExpiredReservationsAndHolds = async (io) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const expiredHolds = await client.query(
            `DELETE FROM table_holds WHERE expires_at <= NOW() RETURNING table_id`
        );

        const finishedReservations = await client.query(
            `
            DELETE FROM table_reservations
            WHERE status = 'confirmed'
              AND reservation_end <= NOW()
            RETURNING table_id, id
            `
        );

        await client.query('COMMIT');

        if ((expiredHolds.rowCount || 0) > 0 || (finishedReservations.rowCount || 0) > 0) {
            emitReservationUpdate(io, {
                type: 'reservation_cleanup',
                released_tables: [
                    ...expiredHolds.rows.map((row) => row.table_id),
                    ...finishedReservations.rows.map((row) => row.table_id)
                ]
            });
        }

        return {
            expired_holds: expiredHolds.rowCount || 0,
            finished_reservations: finishedReservations.rowCount || 0
        };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

const ensureTableAvailable = async ({ client, tableId, slotStart, slotEnd, holdToken }) => {
    const tableResult = await client.query(`SELECT id, floor_id, table_number FROM tables WHERE id = $1 FOR UPDATE`, [tableId]);
    if (tableResult.rows.length === 0) {
        throw new ServiceError('Table not found.', 404);
    }

    const bookedResult = await client.query(
        `
        SELECT id
        FROM table_reservations
        WHERE table_id = $1
          AND status = 'confirmed'
          AND reservation_start < $3
          AND reservation_end > $2
        LIMIT 1
        `,
        [tableId, slotStart, slotEnd]
    );

    if (bookedResult.rows.length > 0) {
        throw new ServiceError('Table is already booked for this slot.', 409);
    }

    const holdResult = await client.query(
        `
        SELECT id
        FROM table_holds
        WHERE table_id = $1
          AND expires_at > NOW()
          AND slot_start < $3
          AND slot_end > $2
          AND ($4::text IS NULL OR hold_token <> $4)
        LIMIT 1
        `,
        [tableId, slotStart, slotEnd, holdToken || null]
    );

    if (holdResult.rows.length > 0) {
        throw new ServiceError('Table is currently locked by another customer. Please choose another table.', 409);
    }

    return tableResult.rows[0];
};

const getCustomerFloorPlan = async ({ date, time, durationMinutes, holdToken }) => {
    const { slotStart, slotEnd } = resolveSlotWindow({ date, time, durationMinutes });

    const client = await pool.connect();
    try {
        await cleanExpiredHolds(client);

        const result = await client.query(
            `
            SELECT
                f.id AS floor_id,
                f.name AS floor_name,
                t.id AS table_id,
                t.table_number,
                t.seats,
                t.is_active,
                EXISTS (
                    SELECT 1
                    FROM table_reservations r
                    WHERE r.table_id = t.id
                      AND r.status = 'confirmed'
                      AND r.reservation_start < $2
                      AND r.reservation_end > $1
                ) AS is_booked,
                EXISTS (
                    SELECT 1
                    FROM table_holds h
                    WHERE h.table_id = t.id
                      AND h.expires_at > NOW()
                      AND h.slot_start < $2
                      AND h.slot_end > $1
                      AND ($3::text IS NULL OR h.hold_token <> $3)
                ) AS is_locked
            FROM floors f
            LEFT JOIN tables t ON t.floor_id = f.id
            ORDER BY f.id ASC, t.table_number ASC
            `,
            [slotStart, slotEnd, holdToken || null]
        );

        const floorsMap = new Map();
        result.rows.forEach((row) => {
            if (!floorsMap.has(row.floor_id)) {
                floorsMap.set(row.floor_id, {
                    id: row.floor_id,
                    name: row.floor_name,
                    tables: []
                });
            }

            if (row.table_id) {
                floorsMap.get(row.floor_id).tables.push({
                    id: row.table_id,
                    table_number: row.table_number,
                    seats: row.seats,
                    is_active: row.is_active,
                    is_booked: row.is_booked,
                    is_locked: row.is_locked,
                    is_unavailable: row.is_booked || row.is_locked
                });
            }
        });

        return {
            slot_start: slotStart,
            slot_end: slotEnd,
            floors: Array.from(floorsMap.values())
        };
    } finally {
        client.release();
    }
};

const acquireTableHold = async ({ tableId, date, time, durationMinutes, holdToken, io }) => {
    if (!holdToken || String(holdToken).trim().length < 10) {
        throw new ServiceError('hold_token is required.', 400);
    }

    const { slotStart, slotEnd } = resolveSlotWindow({ date, time, durationMinutes });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await cleanExpiredHolds(client);

        const table = await ensureTableAvailable({
            client,
            tableId,
            slotStart,
            slotEnd,
            holdToken
        });

        const holdResult = await client.query(
            `
            INSERT INTO table_holds (table_id, hold_token, slot_start, slot_end, expires_at)
            VALUES ($1, $2, $3, $4, NOW() + INTERVAL '5 minutes')
            ON CONFLICT (hold_token)
            DO UPDATE SET table_id = EXCLUDED.table_id,
                          slot_start = EXCLUDED.slot_start,
                          slot_end = EXCLUDED.slot_end,
                          expires_at = NOW() + INTERVAL '5 minutes'
            RETURNING id, table_id, hold_token, slot_start, slot_end, expires_at
            `,
            [tableId, holdToken, slotStart, slotEnd]
        );

        await client.query('COMMIT');

        emitReservationUpdate(io, {
            type: 'hold_acquired',
            table_id: table.id,
            floor_id: table.floor_id,
            table_number: table.table_number
        });

        return holdResult.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

const releaseTableHold = async ({ holdToken, io }) => {
    if (!holdToken) return;

    const result = await pool.query(
        `DELETE FROM table_holds WHERE hold_token = $1 RETURNING table_id`,
        [holdToken]
    );

    if (result.rows.length > 0) {
        emitReservationUpdate(io, {
            type: 'hold_released',
            table_id: result.rows[0].table_id
        });
    }
};

const createReservation = async ({ payload, io }) => {
    const name = String(payload.name || '').trim();
    if (!name) {
        throw new ServiceError('name is required.', 400);
    }

    const phone = toPhone(payload.phone);
    const guests = Number(payload.guests);
    if (!Number.isInteger(guests) || guests <= 0 || guests > 20) {
        throw new ServiceError('guests must be a number between 1 and 20.', 400);
    }

    const tableId = Number(payload.table_id);
    if (!Number.isInteger(tableId) || tableId <= 0) {
        throw new ServiceError('table_id must be a positive integer.', 400);
    }

    const holdToken = String(payload.hold_token || '').trim();
    const { slotStart, slotEnd } = resolveSlotWindow({
        date: payload.date,
        time: payload.time,
        durationMinutes: payload.duration_minutes
    });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await cleanExpiredHolds(client);

        const table = await ensureTableAvailable({
            client,
            tableId,
            slotStart,
            slotEnd,
            holdToken: holdToken || null
        });

        if (holdToken) {
            const holdCheck = await client.query(
                `
                SELECT id
                FROM table_holds
                WHERE hold_token = $1
                  AND table_id = $2
                  AND expires_at > NOW()
                LIMIT 1
                `,
                [holdToken, tableId]
            );

            if (holdCheck.rows.length === 0) {
                throw new ServiceError('Selected table lock expired. Please select table again.', 409);
            }
        }

        const reservationResult = await client.query(
            `
            INSERT INTO table_reservations (
                table_id,
                customer_name,
                phone,
                reservation_start,
                reservation_end,
                guests,
                status
            )
            VALUES ($1, $2, $3, $4, $5, $6, 'confirmed')
            RETURNING id, table_id, customer_name, phone, reservation_start, reservation_end, guests, status, created_at
            `,
            [tableId, name, phone, slotStart, slotEnd, guests]
        );

        if (holdToken) {
            await client.query(`DELETE FROM table_holds WHERE hold_token = $1`, [holdToken]);
        }

        await client.query('COMMIT');

        emitReservationUpdate(io, {
            type: 'reservation_created',
            table_id: table.id,
            floor_id: table.floor_id,
            table_number: table.table_number,
            reservation_id: reservationResult.rows[0].id
        });

        return reservationResult.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

module.exports = {
    ServiceError,
    resolveSlotWindow,
    cleanupExpiredReservationsAndHolds,
    getCustomerFloorPlan,
    acquireTableHold,
    releaseTableHold,
    createReservation
};
