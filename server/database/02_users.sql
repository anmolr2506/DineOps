DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role VARCHAR(20),
    approval_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    is_approved BOOLEAN NOT NULL DEFAULT FALSE,
    reset_token VARCHAR(255),
    reset_token_expiry BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_role CHECK (role IN ('admin', 'staff', 'kitchen') OR role IS NULL),
    CONSTRAINT chk_approval_status CHECK (approval_status IN ('pending', 'approved', 'rejected'))
);

INSERT INTO users (name, email, password, role, approval_status, is_approved)
VALUES 
('Admin', 'admin@dineops.com', '$2b$10$DDFLn8GD4p4qBPPW9/MxSOogEIPG9Bz17qy8qdk69B2sp.fCcxUui', 'admin', 'approved', true),
('Kitchen Staff', 'kitchen@dineops.com', '$2b$10$fdmzGbk0qforbOb.jR9RBugvnf46.M5jeP1OB2mpZrA/IKhubafOK', 'kitchen', 'approved', true);