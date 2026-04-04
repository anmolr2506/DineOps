ALTER TABLE orders DROP CONSTRAINT IF EXISTS chk_order_status;
ALTER TABLE orders ADD CONSTRAINT chk_order_status CHECK (
    status IN ('pending', 'approved', 'paid', 'preparing', 'completed', 'cancelled', 'received', 'served')
);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS is_prepared BOOLEAN DEFAULT FALSE;
