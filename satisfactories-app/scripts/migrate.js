const fs = require('fs');
const path = require('path');
const db = require('../src/services/db.ts');

async function runMigrations() {
  try {
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(function(file) { return file.endsWith('_up.sql'); })
      .sort();

    if (files.length === 0) {
      console.log('No migration files found.');
      return;
    }

    console.log("Found " + files.length + " migration(s). Starting migrations...");

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      console.log("Running migration: " + file);
      try {
        await db.query('BEGIN');
        await db.query(sql);
        await db.query('COMMIT');
        console.log("Migration " + file + " completed successfully.");
      } catch (err) {
        await db.query('ROLLBACK');
        console.error("Migration " + file + " failed:", err);
        process.exit(1);
      }
    }
    console.log('All migrations have been executed successfully.');
  } catch (error) {
    console.error('Migration process failed:', error);
    process.exit(1);
  } finally {
    db.pool.end();
  }
}

runMigrations();
