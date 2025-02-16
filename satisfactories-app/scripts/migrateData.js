const fs = require('fs');
const path = require('path');
const db = require('../src/services/db');

async function migrateData() {
  const dryRun = process.env.DRY_RUN === 'true';
  const dataFilePath = path.join(__dirname, 'oldData.json');
  
  if (!fs.existsSync(dataFilePath)) {
    console.error('No oldData.json file found. Skipping data migration.');
    return;
  }
  
  const rawData = fs.readFileSync(dataFilePath, 'utf8');
  let oldData;
  try {
    oldData = JSON.parse(rawData);
  } catch (e) {
    console.error('Invalid JSON in oldData.json:', e);
    process.exit(1);
  }
  
  const usersCount = oldData.users ? oldData.users.length : 0;
  const worldsCount = oldData.worlds ? oldData.worlds.length : 0;
  const factoriesCount = oldData.factories ? oldData.factories.length : 0;
  const resourcesCount = oldData.resources ? oldData.resources.length : 0;
  
  console.log(`Starting data migration${dryRun ? ' (dry run mode)' : ''}`);
  console.log(`Users: ${usersCount}, Worlds: ${worldsCount}, Factories: ${factoriesCount}, Resources: ${resourcesCount}`);
  
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // Migrate users and store new IDs
    for (const user of oldData.users || []) {
      const res = await client.query(
        'INSERT INTO users (username, theme, default_game_version, default_difficulty) VALUES ($1, $2, $3, $4) RETURNING id',
        [user.username, user.theme, user.default_game_version, user.default_difficulty]
      );
      user.newId = res.rows[0].id;
      console.log(`Migrated user '${user.username}' -> new ID: ${user.newId}`);
    }

    // Migrate worlds and map to new user IDs
    for (const world of oldData.worlds || []) {
      const correspondingUser = (oldData.users || []).find(u => u.username === world.username);
      const userId = correspondingUser ? correspondingUser.newId : null;
      const res = await client.query(
        'INSERT INTO worlds (user_id, name, metadata, game_version, difficulty, tags, power_stats, start_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
        [
          userId,
          world.name,
          JSON.stringify(world.metadata || {}),
          world.game_version,
          world.difficulty,
          world.tags,
          JSON.stringify(world.power_stats || {}),
          world.start_date
        ]
      );
      world.newId = res.rows[0].id;
      console.log(`Migrated world '${world.name}' -> new ID: ${world.newId}`);
    }

    // Migrate factories and associate with worlds
    for (const factory of oldData.factories || []) {
      const correspondingWorld = (oldData.worlds || []).find(w => w.name === factory.worldName);
      if (!correspondingWorld) {
        console.warn(`No matching world found for factory '${factory.name}'`);
        continue;
      }
      const res = await client.query(
        'INSERT INTO factories (world_id, name, operational_status, location, power_management, building_counts, efficiency_tracking) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
        [
          correspondingWorld.newId,
          factory.name,
          factory.operational_status,
          factory.location,
          JSON.stringify(factory.power_management || {}),
          JSON.stringify(factory.building_counts || {}),
          JSON.stringify(factory.efficiency_tracking || {})
        ]
      );
      factory.newId = res.rows[0].id;
      console.log(`Migrated factory '${factory.name}' -> new ID: ${factory.newId}`);
    }

    // Migrate resources and associate with worlds
    for (const resource of oldData.resources || []) {
      const correspondingWorld = (oldData.worlds || []).find(w => w.name === resource.worldName);
      if (!correspondingWorld) {
        console.warn(`No matching world found for resource '${resource.type}'`);
        continue;
      }
      await client.query(
        'INSERT INTO resources (world_id, type, quantity) VALUES ($1, $2, $3)',
        [
          correspondingWorld.newId,
          resource.type,
          resource.quantity
        ]
      );
      console.log(`Migrated resource '${resource.type}' for world '${correspondingWorld.name}'`);
    }

    if (dryRun) {
      await client.query('ROLLBACK');
      console.log('Dry run mode enabled. All changes rolled back.');
    } else {
      await client.query('COMMIT');
      console.log('Data migration completed successfully.');
    }
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Data migration failed:', error);
  } finally {
    client.release();
    db.pool.end();
  }
}

migrateData();
