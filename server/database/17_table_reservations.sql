-- Customer reservation and realtime table lock storage.

CREATE TABLE IF NOT EXISTS table_reservations (
    id SERIAL PRIMARY KEY,
    table_id INT NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
    customer_name VARCHAR(120) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    reservation_start TIMESTAMP NOT NULL,
    reservation_end TIMESTAMP NOT NULL,
    guests INT NOT NULL CHECK (guests > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'confirmed',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_reservation_status CHECK (status IN ('confirmed', 'cancelled')),
    CONSTRAINT chk_reservation_window CHECK (reservation_end > reservation_start)
);

CREATE TABLE IF NOT EXISTS table_holds (
    id SERIAL PRIMARY KEY,
    table_id INT NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
    hold_token VARCHAR(120) NOT NULL UNIQUE,
    slot_start TIMESTAMP NOT NULL,
    slot_end TIMESTAMP NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_hold_window CHECK (slot_end > slot_start)
);

CREATE INDEX IF NOT EXISTS idx_table_reservations_slot
ON table_reservations (table_id, reservation_start, reservation_end, status);

CREATE INDEX IF NOT EXISTS idx_table_holds_slot
ON table_holds (table_id, slot_start, slot_end, expires_at);
