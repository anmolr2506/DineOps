-- =========================================
-- 🔴 DASHBOARD KPI SUMMARY
-- =========================================

DROP MATERIALIZED VIEW IF EXISTS dashboard_kpis;

CREATE MATERIALIZED VIEW dashboard_kpis AS
SELECT 
    (SELECT COUNT(*) FROM orders) AS total_orders,

    (SELECT COUNT(*) FROM orders WHERE status = 'paid') AS paid_orders,

    (SELECT COUNT(*) FROM orders WHERE status = 'pending') AS pending_orders,

    (SELECT COUNT(DISTINCT table_id)
     FROM orders
     WHERE status IN ('pending','approved','preparing')) AS active_tables,

    (SELECT COUNT(*) FROM tables WHERE is_active = TRUE) AS total_tables,

    (SELECT COALESCE(SUM(amount),0)
     FROM payments
     WHERE status='completed'
     AND DATE(created_at)=CURRENT_DATE) AS today_revenue,

    (SELECT COALESCE(AVG(total_amount),0)
     FROM orders
     WHERE status='paid') AS avg_order_value;



-- =========================================
-- 📈 REVENUE TREND
-- =========================================

DROP MATERIALIZED VIEW IF EXISTS revenue_trend;

CREATE MATERIALIZED VIEW revenue_trend AS
SELECT 
    DATE(created_at) AS date,
    SUM(amount) AS revenue
FROM payments
WHERE status = 'completed'
GROUP BY date
ORDER BY date;



-- =========================================
-- 📊 DAILY SALES
-- =========================================

DROP MATERIALIZED VIEW IF EXISTS daily_sales;

CREATE MATERIALIZED VIEW daily_sales AS
SELECT 
    DATE(created_at) AS date,
    COUNT(*) AS orders_count,
    SUM(total_amount) AS total_sales
FROM orders
WHERE status = 'paid'
GROUP BY date
ORDER BY date;



-- =========================================
-- 🍔 TOP PRODUCTS
-- =========================================

DROP MATERIALIZED VIEW IF EXISTS top_products;

CREATE MATERIALIZED VIEW top_products AS
SELECT 
    p.name,
    SUM(oi.quantity) AS total_sold,
    SUM(oi.subtotal) AS revenue
FROM order_items oi
JOIN products p ON oi.product_id = p.id
GROUP BY p.name
ORDER BY total_sold DESC;



-- =========================================
-- 📦 CATEGORY PERFORMANCE
-- =========================================

DROP MATERIALIZED VIEW IF EXISTS category_performance;

CREATE MATERIALIZED VIEW category_performance AS
SELECT 
    c.name AS category,
    SUM(oi.subtotal) AS revenue
FROM order_items oi
JOIN products p ON oi.product_id = p.id
JOIN categories c ON p.category_id = c.id
GROUP BY c.name
ORDER BY revenue DESC;



-- =========================================
-- 📋 RECENT ORDERS
-- =========================================

DROP VIEW IF EXISTS recent_orders;

CREATE VIEW recent_orders AS
SELECT 
    o.id,
    t.table_number,
    o.status,
    o.total_amount,
    o.created_at
FROM orders o
JOIN tables t ON o.table_id = t.id
ORDER BY o.created_at DESC
LIMIT 10;



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
SELECT *
FROM activity_logs
ORDER BY created_at DESC
LIMIT 20;



-- =========================================
-- 🍳 ONGOING FOOD PREPARATION
-- =========================================

DROP VIEW IF EXISTS ongoing_preparation;

CREATE VIEW ongoing_preparation AS
SELECT 
    o.id AS order_id,
    t.table_number,
    o.created_at
FROM orders o
JOIN tables t ON o.table_id = t.id
WHERE o.status = 'preparing'
ORDER BY o.created_at;