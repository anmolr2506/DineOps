-- =========================================
-- 🔴 DASHBOARD KPI SUMMARY
-- =========================================

DROP MATERIALIZED VIEW IF EXISTS dashboard_kpis;

CREATE MATERIALIZED VIEW dashboard_kpis AS
SELECT 
    o.session_id,
    COUNT(*) AS total_orders,
    COUNT(*) FILTER (WHERE o.status = 'paid') AS paid_orders,
    COUNT(*) FILTER (WHERE o.status = 'pending') AS pending_orders,
    COUNT(*) FILTER (WHERE o.status IN ('pending', 'approved')) AS incoming_orders,
    COUNT(*) FILTER (WHERE o.status = 'preparing') AS preparing_orders,
    COUNT(DISTINCT o.table_id) FILTER (WHERE o.status IN ('pending','approved','preparing')) AS active_tables,
    (SELECT COUNT(*) FROM tables WHERE is_active = TRUE) AS total_tables,
    COALESCE(SUM(p.amount) FILTER (
        WHERE p.status = 'completed'
        AND DATE(p.created_at) = CURRENT_DATE
    ), 0) AS today_revenue,
    COALESCE(AVG(o.total_amount) FILTER (WHERE o.status = 'paid'), 0) AS avg_order_value
FROM orders o
LEFT JOIN payments p ON p.order_id = o.id
GROUP BY o.session_id;



-- =========================================
-- 📈 REVENUE TREND
-- =========================================

DROP MATERIALIZED VIEW IF EXISTS revenue_trend;

CREATE MATERIALIZED VIEW revenue_trend AS
SELECT 
    o.session_id,
    DATE(created_at) AS date,
    SUM(amount) AS revenue
FROM payments p
JOIN orders o ON o.id = p.order_id
WHERE status = 'completed'
GROUP BY o.session_id, date
ORDER BY o.session_id, date;



-- =========================================
-- 📊 DAILY SALES
-- =========================================

DROP MATERIALIZED VIEW IF EXISTS daily_sales;

CREATE MATERIALIZED VIEW daily_sales AS
SELECT 
    session_id,
    DATE(created_at) AS date,
    COUNT(*) AS orders_count,
    SUM(total_amount) AS total_sales
FROM orders
WHERE status = 'paid'
GROUP BY session_id, date
ORDER BY session_id, date;



-- =========================================
-- 🍔 TOP PRODUCTS
-- =========================================

DROP MATERIALIZED VIEW IF EXISTS top_products;

CREATE MATERIALIZED VIEW top_products AS
SELECT 
    o.session_id,
    p.name,
    SUM(oi.quantity) AS total_sold,
    SUM(oi.subtotal) AS revenue
FROM order_items oi
JOIN products p ON oi.product_id = p.id
JOIN orders o ON oi.order_id = o.id
GROUP BY o.session_id, p.name
ORDER BY o.session_id, total_sold DESC;



-- =========================================
-- 📦 CATEGORY PERFORMANCE
-- =========================================

DROP MATERIALIZED VIEW IF EXISTS category_performance;

CREATE MATERIALIZED VIEW category_performance AS
SELECT 
    o.session_id,
    c.name AS category,
    SUM(oi.subtotal) AS revenue,
    ROUND(
        (SUM(oi.subtotal) / NULLIF(SUM(SUM(oi.subtotal)) OVER (PARTITION BY o.session_id), 0)) * 100,
        2
    ) AS percentage
FROM order_items oi
JOIN products p ON oi.product_id = p.id
JOIN categories c ON p.category_id = c.id
JOIN orders o ON oi.order_id = o.id
GROUP BY o.session_id, c.name
ORDER BY o.session_id, revenue DESC;



-- =========================================
-- 📋 RECENT ORDERS
-- =========================================

DROP VIEW IF EXISTS recent_orders;

CREATE VIEW recent_orders AS
SELECT 
    o.id,
    o.session_id,
    t.table_number,
    o.source,
    o.status,
    o.total_amount,
    o.created_at
FROM orders o
JOIN tables t ON o.table_id = t.id
ORDER BY o.created_at DESC;



-- =========================================
-- ⚡ LIVE ACTIVITY LOG TABLE + VIEW
-- =========================================

DROP TABLE IF EXISTS activity_logs CASCADE;

CREATE TABLE activity_logs (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50),
    message TEXT,
    reference_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DROP VIEW IF EXISTS live_activity;

CREATE VIEW live_activity AS
SELECT 
    al.id,
    al.type,
    al.message,
    al.reference_id,
    o.session_id,
    al.created_at
FROM activity_logs al
LEFT JOIN orders o ON o.id = al.reference_id
ORDER BY al.created_at DESC;



-- =========================================
-- 🍳 ONGOING FOOD PREPARATION
-- =========================================

DROP VIEW IF EXISTS ongoing_preparation;

CREATE VIEW ongoing_preparation AS
SELECT 
    o.id AS order_id,
    o.session_id,
    t.table_number,
    o.status,
    o.source,
    o.created_at
FROM orders o
JOIN tables t ON o.table_id = t.id
WHERE o.status = 'preparing'
ORDER BY o.created_at;