-- Session management upgrades for user-session mapping and active status normalization.

ALTER TABLE pos_sessions DROP CONSTRAINT IF EXISTS chk_session_status;

UPDATE pos_sessions
SET status = 'active'
WHERE status = 'open';

ALTER TABLE pos_sessions
ALTER COLUMN status SET DEFAULT 'active';

ALTER TABLE pos_sessions
ADD CONSTRAINT chk_session_status CHECK (status IN ('active', 'closed'));

CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id INT NOT NULL REFERENCES pos_sessions(id) ON DELETE CASCADE,
    joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, session_id)
);

INSERT INTO pos_sessions (opened_by, status)
SELECT 1, 'active'
WHERE NOT EXISTS (
    SELECT 1
    FROM pos_sessions
    WHERE status = 'active'
);
