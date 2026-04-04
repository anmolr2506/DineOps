-- =========================================
-- 🔴 STEP 1: CLEAN DATABASE
-- =========================================

TRUNCATE TABLE 
    payments, 
    order_items, 
    orders, 
    customer_sessions, 
    pos_sessions 
RESTART IDENTITY CASCADE;



-- =========================================
-- 🟢 STEP 2: INSERT CLEAN DATA
-- =========================================

-- SESSION
INSERT INTO pos_sessions (opened_by, status)
VALUES (1, 'active');

-- CUSTOMER SESSIONS
INSERT INTO customer_sessions (table_id, session_id, customer_token)
VALUES
(1, 1, 'token_1'),
(2, 1, 'token_2'),
(3, 1, 'token_3');


-- ORDERS
INSERT INTO orders 
(table_id, session_id, customer_session_id, source, status, total_amount, approved_by)
VALUES
(1, 1, 1, 'QR', 'paid', 650, 1),
(2, 1, 2, 'QR', 'pending', 300, 1),
(3, 1, 3, 'QR', 'approved', 450, 1),
(1, 1, 1, 'QR', 'preparing', 600, 1),
(2, 1, 2, 'QR', 'paid', 700, 1),
(3, 1, 3, 'QR', 'completed', 550, 1),
(1, 1, 1, 'POS', 'paid', 800, 1),
(2, 1, 2, 'POS', 'preparing', 350, 1);


-- ORDER ITEMS
INSERT INTO order_items (order_id, product_id, quantity, price, subtotal)
VALUES
(1, 1, 2, 250, 500),
(1, 3, 1, 150, 150),
(2, 2, 1, 300, 300),
(3, 1, 1, 450, 450),
(4, 1, 2, 300, 600),
(5, 3, 2, 350, 700),
(6, 2, 1, 550, 550),
(7, 3, 2, 400, 800),
(8, 2, 1, 350, 350);


-- PAYMENTS
INSERT INTO payments (order_id, method, amount, status, handled_by)
VALUES
(1, 'upi', 650, 'completed', 1),
(5, 'cash', 700, 'completed', 1),
(7, 'upi', 800, 'completed', 1);


-- ACTIVITY LOGS
INSERT INTO activity_logs (type, message)
VALUES
('order', 'Order #1 placed on Table 1'),
('order', 'Order #2 placed on Table 2'),
('order', 'Order #3 approved'),
('kitchen', 'Order #4 is preparing'),
('payment', 'Payment received for Order #1'),
('payment', 'Payment received for Order #5'),
('order', 'Order #6 completed'),
('kitchen', 'Order #8 is preparing');



-- =========================================
-- 🔵 STEP 3: REFRESH DASHBOARD
-- =========================================

REFRESH MATERIALIZED VIEW dashboard_kpis;
REFRESH MATERIALIZED VIEW revenue_trend;
REFRESH MATERIALIZED VIEW daily_sales;
REFRESH MATERIALIZED VIEW top_products;
REFRESH MATERIALIZED VIEW category_performance;