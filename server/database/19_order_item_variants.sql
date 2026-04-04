CREATE TABLE IF NOT EXISTS order_item_variants (
    id SERIAL PRIMARY KEY,
    order_item_id INT NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    variant_value_id INT NOT NULL REFERENCES variant_group_values(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (order_item_id, variant_value_id)
);

CREATE INDEX IF NOT EXISTS idx_order_item_variants_order_item ON order_item_variants (order_item_id);
CREATE INDEX IF NOT EXISTS idx_order_item_variants_value ON order_item_variants (variant_value_id);
