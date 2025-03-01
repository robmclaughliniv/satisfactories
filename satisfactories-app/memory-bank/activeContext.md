# Active Context

Date: 2/17/2025

Recent Updates:
- Added new migration files (20250217_001_up.sql and 20250217_001_down.sql) which extend the database schema.
- New tables included: users, worlds, factories, and resources, following the established patterns.
- The migration script (satisfactories-app/scripts/migrate.js) is configured to run these migrations.
- Next steps include testing the migration execution and integrating any necessary updates in the database service (src/services/db.ts).
