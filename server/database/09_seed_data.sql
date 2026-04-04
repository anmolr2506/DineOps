-- ================================
-- FLOORS
-- ================================
INSERT INTO floors (name) VALUES 
('Ground Floor'),
('First Floor');

-- ================================
-- TABLES
-- ================================
INSERT INTO tables (floor_id, table_number, seats) VALUES
(1, 1, 4),
(1, 2, 2),
(1, 3, 6),
(2, 1, 4),
(2, 2, 8);

-- ================================
-- CATEGORIES
-- ================================
INSERT INTO categories (name) VALUES
('Pizza'),
('Beverages'),
('Snacks');

-- ================================
-- PRODUCTS
-- ================================
INSERT INTO products (name, category_id, price, tax_percent) VALUES
('Margherita Pizza', 1, 250, 5),
('Veg Burger', 3, 120, 5),
('Cold Coffee', 2, 150, 5),
('French Fries', 3, 100, 5);

-- ================================
-- VARIANTS
-- ================================
INSERT INTO product_variants (product_id, attribute, value, extra_price) VALUES
(1, 'Size', 'Medium', 0),
(1, 'Size', 'Large', 50),
(3, 'Sugar', 'Less', 0),
(3, 'Sugar', 'Extra', 10);