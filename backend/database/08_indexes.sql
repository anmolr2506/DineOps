CREATE INDEX idx_orders_table_session 
ON orders(table_id, session_id);

CREATE INDEX idx_orders_status 
ON orders(status);

CREATE INDEX idx_customer_token 
ON customer_sessions(customer_token);