-- Migration Version: 20250216_001 (DOWN Migration)
-- This down migration reverses the changes made in the up migration.

DROP TABLE IF EXISTS resources;
DROP TABLE IF EXISTS factories;
DROP TABLE IF EXISTS worlds;
DROP TABLE IF EXISTS users;

-- Optionally, you can drop the extension if it is not needed elsewhere:
-- DROP EXTENSION IF EXISTS "uuid-ossp";
