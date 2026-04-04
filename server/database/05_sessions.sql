DROP TABLE IF EXISTS customer_sessions CASCADE;
DROP TABLE IF EXISTS pos_sessions CASCADE;

CREATE TABLE pos_sessions (
    id SERIAL PRIMARY KEY,
    opened_by INT NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'active',

    CONSTRAINT chk_session_status CHECK (status IN ('active', 'closed'))
);

CREATE TABLE customer_sessions (
    id SERIAL PRIMARY KEY,
    table_id INT NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
    session_id INT NOT NULL REFERENCES pos_sessions(id) ON DELETE CASCADE,
    customer_token TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);