CREATE TABLE IF NOT EXISTS restaurant_config (
    id SERIAL PRIMARY KEY,
    name VARCHAR(160) NOT NULL,
    logo_url TEXT,
    address TEXT,
    contact_info TEXT,
    gst_percent NUMERIC(5,2) NOT NULL DEFAULT 5 CHECK (gst_percent >= 0),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO restaurant_config (id, name, logo_url, address, contact_info, gst_percent)
VALUES (1, 'DineOps Restaurant', NULL, NULL, NULL, 5)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS customer_id INT REFERENCES customers(id) ON DELETE SET NULL;
