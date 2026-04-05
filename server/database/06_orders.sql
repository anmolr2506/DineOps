DROP TABLE IF EXISTS order_status_history CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    table_id INT NOT NULL REFERENCES tables(id) ON DELETE SET NULL,
    session_id INT NOT NULL REFERENCES pos_sessions(id) ON DELETE CASCADE,
    customer_session_id INT REFERENCES customer_sessions(id) ON DELETE SET NULL,
    source VARCHAR(10) NOT NULL,
    status VARCHAR(30) NOT NULL,
    total_amount NUMERIC(10,2) DEFAULT 0 CHECK (total_amount >= 0),
    approved_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_source CHECK (source IN ('POS', 'QR')),
    CONSTRAINT chk_order_status CHECK (
        status IN ('pending', 'approved', 'paid', 'preparing', 'completed', 'cancelled')
    )
);

CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE SET NULL,
    variant_id INT REFERENCES product_variants(id) ON DELETE SET NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    subtotal NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0),
    tax_percent NUMERIC(5,2) DEFAULT 0 CHECK (tax_percent >= 0)
);

CREATE TABLE order_status_history (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);