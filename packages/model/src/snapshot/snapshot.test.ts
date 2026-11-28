import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import {
  SNAPSHOT_ROW_SCHEMAS,
  TABLE_BUILDABLE_RTREE,
  TABLE_META,
} from './tables';
import { openTestSqlite, sqliteEngineName, type SqliteDb } from '../test/sqlite';

const ORDINARY_TABLES = Object.keys(SNAPSHOT_ROW_SCHEMAS).filter((t) => t !== TABLE_BUILDABLE_RTREE);

describe('snapshot SQL', () => {
  let db: SqliteDb;

  beforeAll(async () => {
    db = await openTestSqlite();
  });

  afterAll(() => {
    db?.close();
  });

  it('records which SQLite engine is in use', () => {
    expect(sqliteEngineName()).toBe('sqlite-wasm');
  });

  it('column parity between Zod and SQL for ordinary tables', () => {
    for (const table of ORDINARY_TABLES) {
      const schema = SNAPSHOT_ROW_SCHEMAS[table];
      const sqlCols = db.pragmaTableInfo(table).map((c) => c.name).sort();
      const zodKeys = Object.keys(schema.shape).sort();
      expect(sqlCols, table).toEqual(zodKeys);
    }
  });

  it('meta has no snapshot_id', () => {
    const cols = db.pragmaTableInfo(TABLE_META).map((c) => c.name);
    expect(cols).not.toContain('snapshot_id');
  });

  it('buildable_rtree supports spatial query', () => {
    db.exec(`
      INSERT INTO buildable (
        snapshot_id, key, class_short, class_path, category,
        x, y, z, qx, qy, qz, qw, recipe_short, clock, production_boost, shards, partial
      ) VALUES (
        'snap1', 'b1', 'Build_X', '/Game/X', 'production',
        100, 200, 0, 0, 0, 0, 1, NULL, NULL, NULL, NULL, 0
      );
    `);
    const rowid = Number(db.query<{ rowid: number }>('SELECT rowid AS rowid FROM buildable WHERE key = ?', 'b1')[0].rowid);
    db.exec(`INSERT INTO buildable_rtree (id, min_x, max_x, min_y, max_y) VALUES (${rowid}, 50, 150, 150, 250);`);
    const hits = db.query<{ id: number }>(
      'SELECT id FROM buildable_rtree WHERE min_x <= 100 AND max_x >= 100 AND min_y <= 200 AND max_y >= 200',
    );
    expect(hits.some((h) => h.id === rowid)).toBe(true);
  });
});