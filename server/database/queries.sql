-- =====================================
-- 🔍 VIEW ALL TABLES DATA (DEBUG)
-- =====================================

SELECT * FROM users;
SELECT * FROM floors;
SELECT * FROM tables;
SELECT * FROM categories;
SELECT * FROM products;
SELECT * FROM pos_sessions;
SELECT * FROM orders;
SELECT * FROM order_items;
SELECT * FROM payments;


-- =====================================
-- 🟢 OPEN A SESSION
-- =====================================

INSERT INTO pos_sessions (opened_by, status)
VALUES (1, 'open');

-- Check session
SELECT * FROM pos_sessions;


-- =====================================
-- 🔵 CREATE CUSTOMER SESSION (QR USER)
-- =====================================

INSERT INTO customer_sessions (table_id, session_id, customer_token)
VALUES (1, 1, 'token_abc123');

SELECT * FROM customer_sessions;


-- =====================================
-- 🍽️ CREATE ORDER (QR FLOW)
-- =====================================

INSERT INTO orders (table_id, session_id, customer_session_id, source, status)
VALUES (1, 1, 1, 'QR', 'pending');


-- =====================================
-- 🍔 ADD ORDER ITEMS
-- =====================================

INSERT INTO order_items (order_id, product_id, quantity, price, subtotal)
VALUES 
(1, 1, 2, 250, 500),
(1, 3, 1, 150, 150);

-- Update total manually (simulate backend)
UPDATE orders
SET total_amount = 650
WHERE id = 1;


-- =====================================
-- 🟡 APPROVE ORDER (STAFF ACTION)
-- =====================================

UPDATE orders
SET status = 'approved', approved_by = 1
WHERE id = 1;


-- =====================================
-- 💳 MAKE PAYMENT
-- =====================================

INSERT INTO payments (order_id, method, amount, status, handled_by)
VALUES (1, 'upi', 650, 'completed', 1);

-- Update order to paid
UPDATE orders
SET status = 'paid'
WHERE id = 1;


-- =====================================
-- 🍳 KITCHEN VIEW (PAID ORDERS)
-- =====================================

SELECT o.id, t.table_number, o.status
FROM orders o
JOIN tables t ON o.table_id = t.id
WHERE o.status = 'paid';


-- =====================================
-- 🖨️ BILLING (FETCH ORDER DETAILS)
-- =====================================

SELECT 
    o.id AS order_id,
    p.name,
    oi.quantity,
    oi.price,
    oi.subtotal
FROM order_items oi
JOIN products p ON oi.product_id = p.id
JOIN orders o ON oi.order_id = o.id
WHERE o.id = 1;


-- =====================================
-- 📊 DASHBOARD QUERIES
-- =====================================

-- Total Sales
SELECT SUM(amount) AS total_sales
FROM payments
WHERE status = 'completed';

-- Orders count
SELECT COUNT(*) FROM orders;

-- Best selling products
SELECT p.name, SUM(oi.quantity) AS total_sold
FROM order_items oi
JOIN products p ON oi.product_id = p.id
GROUP BY p.name
ORDER BY total_sold DESC;


-- =====================================
-- 🔁 CUSTOMER RELOAD (TOKEN BASED)
-- =====================================

SELECT *
FROM orders
WHERE customer_session_id = 1;


-- =====================================
-- 🧾 SESSION WISE SALES
-- =====================================

SELECT session_id, SUM(total_amount) AS revenue
FROM orders
WHERE status = 'paid'
GROUP BY session_id;