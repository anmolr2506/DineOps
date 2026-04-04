-- Floor plan global cleanup migration: remove legacy session scoping from floors/tables.

ALTER TABLE floors DROP CONSTRAINT IF EXISTS floors_session_id_fkey;
ALTER TABLE tables DROP CONSTRAINT IF EXISTS tables_session_id_fkey;

ALTER TABLE floors DROP CONSTRAINT IF EXISTS unique_floor_name_per_session;
ALTER TABLE floors DROP CONSTRAINT IF EXISTS floors_name_key;
ALTER TABLE floors ADD CONSTRAINT floors_name_key UNIQUE (name);

ALTER TABLE tables DROP CONSTRAINT IF EXISTS unique_table_per_floor_session;
ALTER TABLE tables DROP CONSTRAINT IF EXISTS unique_table_per_floor;
ALTER TABLE tables ADD CONSTRAINT unique_table_per_floor UNIQUE (floor_id, table_number);

ALTER TABLE floors DROP COLUMN IF EXISTS session_id;
ALTER TABLE tables DROP COLUMN IF EXISTS session_id;
