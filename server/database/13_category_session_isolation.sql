-- Category and product session isolation with richer metadata for dashboard management.

ALTER TABLE categories
ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active',
ADD COLUMN IF NOT EXISTS session_id INT,
ADD COLUMN IF NOT EXISTS created_by INT REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE categories DROP CONSTRAINT IF EXISTS chk_category_status;
ALTER TABLE categories ADD CONSTRAINT chk_category_status CHECK (status IN ('active', 'inactive'));

ALTER TABLE products
ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS session_id INT,
ADD COLUMN IF NOT EXISTS created_by INT REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

WITH fallback_session AS (
    SELECT id
    FROM pos_sessions
    ORDER BY CASE WHEN status = 'active' THEN 0 ELSE 1 END, id
    LIMIT 1
)
UPDATE categories c
SET session_id = fs.id
FROM fallback_session fs
WHERE c.session_id IS NULL;

WITH fallback_session AS (
    SELECT id
    FROM pos_sessions
    ORDER BY CASE WHEN status = 'active' THEN 0 ELSE 1 END, id
    LIMIT 1
)
UPDATE products p
SET session_id = fs.id
FROM fallback_session fs
WHERE p.session_id IS NULL;

ALTER TABLE categories
ALTER COLUMN session_id SET NOT NULL;

ALTER TABLE products
ALTER COLUMN session_id SET NOT NULL;

ALTER TABLE categories
DROP CONSTRAINT IF EXISTS categories_session_id_fkey;
ALTER TABLE categories
ADD CONSTRAINT categories_session_id_fkey
FOREIGN KEY (session_id)
REFERENCES pos_sessions(id)
ON DELETE CASCADE;

ALTER TABLE products
DROP CONSTRAINT IF EXISTS products_session_id_fkey;
ALTER TABLE products
ADD CONSTRAINT products_session_id_fkey
FOREIGN KEY (session_id)
REFERENCES pos_sessions(id)
ON DELETE CASCADE;

ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_name_key;
ALTER TABLE categories DROP CONSTRAINT IF EXISTS unique_category_name_per_session;
ALTER TABLE categories
ADD CONSTRAINT unique_category_name_per_session UNIQUE (name, session_id);

ALTER TABLE products DROP CONSTRAINT IF EXISTS unique_product_name;
ALTER TABLE products DROP CONSTRAINT IF EXISTS unique_product_name_per_session;
ALTER TABLE products
ADD CONSTRAINT unique_product_name_per_session UNIQUE (name, session_id);
