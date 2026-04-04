DROP TABLE IF EXISTS tables CASCADE;
DROP TABLE IF EXISTS floors CASCADE;

CREATE TABLE floors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE tables (
    id SERIAL PRIMARY KEY,
    floor_id INT NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
    table_number INT NOT NULL,
    seats INT CHECK (seats > 0),
    is_active BOOLEAN DEFAULT TRUE,

    CONSTRAINT unique_table_per_floor UNIQUE (floor_id, table_number)
);