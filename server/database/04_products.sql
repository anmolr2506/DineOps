DROP TABLE IF EXISTS product_variants CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    category_id INT REFERENCES categories(id) ON DELETE SET NULL,
    price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    tax_percent NUMERIC(5,2) DEFAULT 0 CHECK (tax_percent >= 0),
    is_available BOOLEAN DEFAULT TRUE,

    CONSTRAINT unique_product_name UNIQUE (name)
);

CREATE TABLE product_variants (
    id SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    attribute VARCHAR(100) NOT NULL,
    value VARCHAR(100) NOT NULL,
    extra_price NUMERIC(10,2) DEFAULT 0 CHECK (extra_price >= 0)
);