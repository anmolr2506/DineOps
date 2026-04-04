-- Admin session controls: optional human-friendly session names.

ALTER TABLE pos_sessions
ADD COLUMN IF NOT EXISTS name VARCHAR(120);
