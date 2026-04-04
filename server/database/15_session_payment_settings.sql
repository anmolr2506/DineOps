-- Session-level payment method configuration.

ALTER TABLE pos_sessions
ADD COLUMN IF NOT EXISTS allow_cash BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS allow_digital BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS allow_upi BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS upi_id VARCHAR(120);

UPDATE pos_sessions
SET allow_cash = COALESCE(allow_cash, TRUE),
    allow_digital = COALESCE(allow_digital, TRUE),
    allow_upi = COALESCE(allow_upi, FALSE)
WHERE allow_cash IS NULL
   OR allow_digital IS NULL
   OR allow_upi IS NULL;