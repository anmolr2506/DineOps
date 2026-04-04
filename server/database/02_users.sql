DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'staff',
    is_approved BOOLEAN NOT NULL DEFAULT FALSE,
    reset_token VARCHAR(255),
    reset_token_expiry BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_role CHECK (role IN ('admin', 'staff', 'kitchen'))
);

INSERT INTO users (name, email, password, role, is_approved)
VALUES ('Admin', 'admin@gmail.com', '$2b$10$GYFhlLA7W7tfHi6O.r5DfOEHibdkfX5djx0iZ/aDv2IdZ04wRxOU2', 'admin', true);