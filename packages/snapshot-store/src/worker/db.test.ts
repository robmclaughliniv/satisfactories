import { describe, expect, it } from 'vitest';
import { SNAPSHOT_SCHEMA_VERSION } from '@satisfactories/model';
import { RTREE_CATEGORIES } from '../columns';
import { generateSyntheticSnapshot } from '../synthetic';
import { ddl, loadSqlite, openMemoryDb } from '../test/helpers';
import {
  META_SCHEMA_VERSION_KEY,
  SnapshotValidationError,
  configureConnection,
  ensureSchema,
  insertRows,
  writeSnapshot,
} from './db';
import { getSnapshotByStatus, listSnapshots, tableCounts } from './queries';

const count = (db: { selectValue: (sql: string, bind?: never) => unknown }, sql: string, bind?: unknown[]) =>
  Number(db.selectValue(sql, bind as never));

describe('ensureSchema', () => {
  it('applies the DDL to a new DB and records the schema version', async () => {
    const s = await loadSqlite();
    const db = new s.oo1.DB(':memory:', 'c');
    configureConnection(db);
    expect(ensureSchema(db, ddl)).toEqual({ created: true, recreated: false, storedVersion: null });
    expect(db.selectValue('SELECT value FROM meta WHERE key = ?', [META_SCHEMA_VERSION_KEY])).toBe(
      String(SNAPSHOT_SCHEMA_VERSION),
    );
    expect(count(db, "SELECT count(*) FROM sqlite_master WHERE name = 'buildable_rtree'")).toBe(1);
    // Re-running on a current DB is a no-op.
    expect(ensureSchema(db, ddl)).toEqual({
      created: false,
      recreated: false,
      storedVersion: String(SNAPSHOT_SCHEMA_VERSION),
    });
    db.close();
  });

  it('drops and recreates the DB when the stored version differs', async () => {
    const { db } = await openMemoryDb();
    const { snapshot, tables } = generateSyntheticSnapshot({ saveIdentifier: 'w', preset: 'small' });
    writeSnapshot(db, snapshot, tables, { validate: false });
    db.exec({ sql: 'UPDATE meta SET value = ? WHERE key = ?', bind: ['0', META_SCHEMA_VERSION_KEY] });

    const res = ensureSchema(db, ddl);
    expect(res).toEqual({ created: false, recreated: true, storedVersion: '0' });
    expect(count(db, 'SELECT count(*) FROM snapshot')).toBe(0);
    expect(count(db, 'SELECT count(*) FROM buildable')).toBe(0);
    expect(count(db, 'SELECT count(*) FROM buildable_rtree')).toBe(0);
    expect(db.selectValue('SELECT value FROM meta WHERE key = ?', [META_SCHEMA_VERSION_KEY])).toBe(
      String(SNAPSHOT_SCHEMA_VERSION),
    );
    db.close();
  });

  it('wipes a DB that has tables but no meta version', async () => {
    const s = await loadSqlite();
    const db = new s.oo1.DB(':memory:', 'c');
    db.exec('CREATE TABLE junk (a); INSERT INTO junk VALUES (1);');
    expect(ensureSchema(db, ddl).recreated).toBe(true);
    expect(count(db, "SELECT count(*) FROM sqlite_master WHERE name = 'junk'")).toBe(0);
    db.close();
  });

  it('a newer version number also triggers recreate', async () => {
    const { db } = await openMemoryDb();
    expect(ensureSchema(db, ddl, SNAPSHOT_SCHEMA_VERSION + 1).recreated).toBe(true);
    db.close();
  });
});

describe('insertRows', () => {
  it('handles counts that are not a multiple of the batch size', async () => {
    const { db } = await openMemoryDb();
    const rows = Array.from({ length: 1_003 }, (_, i) => ({
      snapshot_id: 'x',
      tile_x: i,
      tile_y: 0,
      z_bucket: 0,
      count: i,
    }));
    insertRows(db, 'foundation_tile', rows);
    expect(count(db, 'SELECT count(*) FROM foundation_tile')).toBe(1_003);
    expect(count(db, 'SELECT sum(count) FROM foundation_tile')).toBe((1_002 * 1_003) / 2);
    db.close();
  });

  it('stores booleans as 0/1 and quotes reserved column names', async () => {
    const { db } = await openMemoryDb();
    insertRows(db, 'platform', [
      { snapshot_id: 's', key: 'p', station_key: 'st', index: 2, medium: 'solid', mode: 'load' },
    ]);
    insertRows(db, 'vehicle_route_station', [
      { snapshot_id: 's', vehicle_key: 'v', seq: 0, station_key: 'st', inferred: true },
    ]);
    expect(db.selectValue('SELECT "index" FROM platform')).toBe(2);
    expect(db.selectValue('SELECT inferred FROM vehicle_route_station')).toBe(1);
    db.close();
  });

});

describe('writeSnapshot', () => {
  const gen = (generation: number) =>
    generateSyntheticSnapshot({ saveIdentifier: 'world-1', preset: 'small', generation });

  it('raises the page cache only for the duration of the write', async () => {
    const { db } = await openMemoryDb();
    const before = db.selectValue('PRAGMA cache_size');
    const a = gen(0);
    writeSnapshot(db, a.snapshot, a.tables, { validate: false });
    expect(db.selectValue('PRAGMA cache_size')).toBe(before);
    db.close();
  });

  it('writes every table in one go and reports timings', async () => {
    const { db } = await openMemoryDb();
    const a = gen(0);
    const t = writeSnapshot(db, a.snapshot, a.tables, { validate: true });
    expect(t.validated).toBe(true);
    for (const table of ['rotate', 'snapshot', 'buildable', 'edge', 'component', 'foundation_tile', 'buildable_rtree']) {
      expect(t.tables[table], table).toBeTypeOf('number');
    }
    expect(t.rows.buildable).toBe(a.tables.buildable!.length);
    expect(t.rows.edge).toBe(a.tables.edge!.length);
    const counts = tableCounts(db, a.snapshot.id, ['buildable', 'edge', 'component', 'foundation_tile']);
    expect(counts).toEqual({
      buildable: a.tables.buildable!.length,
      edge: a.tables.edge!.length,
      component: a.tables.component!.length,
      foundation_tile: a.tables.foundation_tile!.length,
    });
    const indexed = a.tables.buildable!.filter((b) => RTREE_CATEGORIES.includes(b.category)).length;
    expect(t.rows.buildable_rtree).toBe(indexed);
    expect(count(db, 'SELECT count(*) FROM buildable_rtree')).toBe(indexed);
    expect(getSnapshotByStatus(db, 'current')?.id).toBe(a.snapshot.id);
    expect(getSnapshotByStatus(db, 'current')?.is_creative).toBe(false);
    expect(getSnapshotByStatus(db, 'previous')).toBeNull();
    db.close();
  });

  it('rotates current → previous and prunes anything older', async () => {
    const { db } = await openMemoryDb();
    const [a, b, c] = [gen(0), gen(1), gen(2)];
    writeSnapshot(db, a.snapshot, a.tables, { validate: false });
    writeSnapshot(db, b.snapshot, b.tables, { validate: false });
    expect(getSnapshotByStatus(db, 'current')?.id).toBe(b.snapshot.id);
    expect(getSnapshotByStatus(db, 'previous')?.id).toBe(a.snapshot.id);

    writeSnapshot(db, c.snapshot, c.tables, { validate: false });
    expect(listSnapshots(db).map((s) => [s.id, s.status])).toEqual([
      [b.snapshot.id, 'previous'],
      [c.snapshot.id, 'current'],
    ]);
    // A's rows are gone from every table, including the R*Tree.
    expect(count(db, 'SELECT count(*) FROM buildable WHERE snapshot_id = ?', [a.snapshot.id])).toBe(0);
    expect(count(db, 'SELECT count(*) FROM edge WHERE snapshot_id = ?', [a.snapshot.id])).toBe(0);
    const indexed = (x: typeof a) => x.tables.buildable!.filter((r) => RTREE_CATEGORIES.includes(r.category)).length;
    expect(count(db, 'SELECT count(*) FROM buildable_rtree')).toBe(indexed(b) + indexed(c));
    expect(
      count(db, 'SELECT count(*) FROM buildable_rtree r LEFT JOIN buildable b ON b.rowid = r.id WHERE b.rowid IS NULL'),
    ).toBe(0);
    db.close();
  });

  it('rewriting the same snapshot id replaces it instead of duplicating', async () => {
    const { db } = await openMemoryDb();
    const [a, b] = [gen(0), gen(1)];
    writeSnapshot(db, a.snapshot, a.tables, { validate: false });
    writeSnapshot(db, b.snapshot, b.tables, { validate: false });
    writeSnapshot(db, b.snapshot, b.tables, { validate: false });
    expect(listSnapshots(db).map((s) => [s.id, s.status])).toEqual([
      [a.snapshot.id, 'previous'],
      [b.snapshot.id, 'current'],
    ]);
    expect(count(db, 'SELECT count(*) FROM buildable WHERE snapshot_id = ?', [b.snapshot.id])).toBe(
      b.tables.buildable!.length,
    );
    db.close();
  });

  it('forces snapshot_id on rows to the snapshot being written', async () => {
    const { db } = await openMemoryDb();
    const a = gen(0);
    const rows = a.tables.buildable!.slice(0, 3).map((r) => ({ ...r, snapshot_id: 'wrong' }));
    writeSnapshot(db, a.snapshot, { buildable: rows }, { validate: false });
    expect(count(db, "SELECT count(*) FROM buildable WHERE snapshot_id = 'wrong'")).toBe(0);
    expect(count(db, 'SELECT count(*) FROM buildable WHERE snapshot_id = ?', [a.snapshot.id])).toBe(3);
    db.close();
  });

  it('validation rejects bad rows and leaves the DB untouched', async () => {
    const { db } = await openMemoryDb();
    const a = gen(0);
    writeSnapshot(db, a.snapshot, a.tables, { validate: false });
    const b = gen(1);
    const bad = [{ ...b.tables.buildable![0], category: 'spaceship' }] as never;
    expect(() => writeSnapshot(db, b.snapshot, { buildable: bad }, { validate: true })).toThrow(
      SnapshotValidationError,
    );
    expect(getSnapshotByStatus(db, 'current')?.id).toBe(a.snapshot.id);
    db.close();
  });

  it('a failing insert rolls the whole transaction back', async () => {
    const { db } = await openMemoryDb();
    const a = gen(0);
    writeSnapshot(db, a.snapshot, a.tables, { validate: false });
    const b = gen(1);
    const dup = [b.tables.buildable![0], b.tables.buildable![0]];
    expect(() => writeSnapshot(db, b.snapshot, { buildable: dup }, { validate: false })).toThrow();
    expect(listSnapshots(db).map((s) => [s.id, s.status])).toEqual([[a.snapshot.id, 'current']]);
    expect(count(db, 'SELECT count(*) FROM buildable WHERE snapshot_id = ?', [b.snapshot.id])).toBe(0);
    db.close();
  });
});
