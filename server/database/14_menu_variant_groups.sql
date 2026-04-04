-- Variant groups and session-scoped category assignments.

CREATE TABLE IF NOT EXISTS variant_groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT DEFAULT '',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    session_id INT NOT NULL REFERENCES pos_sessions(id) ON DELETE CASCADE,
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_variant_group_status CHECK (status IN ('active', 'inactive')),
    CONSTRAINT unique_variant_group_name_per_session UNIQUE (name, session_id)
);

CREATE TABLE IF NOT EXISTS variant_group_values (
    id SERIAL PRIMARY KEY,
    variant_group_id INT NOT NULL REFERENCES variant_groups(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    extra_price NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (extra_price >= 0),
    value_type VARCHAR(20) DEFAULT 'unit' CHECK (value_type IN ('kg', 'unit', 'liter')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_variant_value_per_group UNIQUE (variant_group_id, name)
);

CREATE TABLE IF NOT EXISTS category_variant_groups (
    category_id INT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    variant_group_id INT NOT NULL REFERENCES variant_groups(id) ON DELETE CASCADE,
    session_id INT NOT NULL REFERENCES pos_sessions(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (category_id, variant_group_id)
);

WITH active_session AS (
    SELECT id
    FROM pos_sessions
    ORDER BY CASE WHEN status = 'active' THEN 0 ELSE 1 END, id
    LIMIT 1
)
INSERT INTO variant_groups (name, description, status, session_id)
SELECT 'Size', 'Portion sizes used for menu items.', 'active', id FROM active_session
UNION ALL
SELECT 'Spice Level', 'Heat preferences for selected dishes.', 'active', id FROM active_session
ON CONFLICT (name, session_id) DO NOTHING;

INSERT INTO variant_group_values (variant_group_id, name, extra_price)
SELECT vg.id, vals.name, vals.extra_price
FROM variant_groups vg
JOIN (
    SELECT 'Size' AS group_name, 'Small' AS name, 0::numeric AS extra_price
    UNION ALL SELECT 'Size', 'Medium', 20
    UNION ALL SELECT 'Size', 'Large', 500
    UNION ALL SELECT 'Spice Level', 'Mild', 0
    UNION ALL SELECT 'Spice Level', 'Medium', 0
    UNION ALL SELECT 'Spice Level', 'Hot', 0
) vals ON vals.group_name = vg.name
WHERE vg.session_id = (SELECT id FROM pos_sessions ORDER BY CASE WHEN status = 'active' THEN 0 ELSE 1 END, id LIMIT 1)
ON CONFLICT (variant_group_id, name) DO NOTHING;

INSERT INTO category_variant_groups (category_id, variant_group_id, session_id)
SELECT c.id, vg.id, c.session_id
FROM categories c
JOIN variant_groups vg ON vg.session_id = c.session_id
WHERE (c.name = 'Pizza' AND vg.name = 'Size')
   OR (c.name = 'Snacks' AND vg.name = 'Spice Level')
ON CONFLICT (category_id, variant_group_id) DO NOTHING;
