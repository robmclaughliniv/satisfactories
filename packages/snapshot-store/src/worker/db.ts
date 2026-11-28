import {
  SNAPSHOT_ROW_SCHEMAS,
  SNAPSHOT_SCHEMA_VERSION,
  TABLE_BUILDABLE,
  TABLE_SNAPSHOT,
} from '@satisfactories/model';
import {
  PER_SNAPSHOT_TABLES,
  RTREE_CATEGORIES,
  SNAPSHOT_DATA_TABLES,
  quoteIdent,
  tableColumns,
} from '../columns';
import type { Db } from '../sqlite';
import type { SnapshotInput, SnapshotTables, WriteTimings } from '../types';

export const META_SCHEMA_VERSION_KEY = 'snapshot_schema_version';

const now = () => performance.now();

/**
 * Connection settings. The DDL declares no foreign keys, so `foreign_keys` stays off.
 * `temp_store=MEMORY` keeps temp files out of the sahpool slot pool. `journal_mode`
 * stays DELETE: the sqlite-wasm docs give no sahpool-specific recommendation except
 * that WAL needs `locking_mode=EXCLUSIVE` and only *may* help slightly.
 */
export function configureConnection(db: Db): void {
  db.exec('PRAGMA journal_mode=DELETE; PRAGMA temp_store=MEMORY; PRAGMA foreign_keys=OFF;');
}

function scalar<T>(db: Db, sql: string, bind?: unknown[]): T | undefined {
  return db.selectValue(sql, bind as never) as T | undefined;
}

/** Drop every user object (virtual tables first, so their shadow tables go with them), then VACUUM. */
export function dropAllObjects(db: Db): void {
  const virtuals = db.selectValues(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND sql LIKE 'CREATE VIRTUAL TABLE%'",
  ) as string[];
  for (const name of virtuals) db.exec(`DROP TABLE IF EXISTS ${quoteIdent(name)}`);
  const rest = db.selectObjects(
    "SELECT type, name FROM sqlite_master WHERE type IN ('view', 'table') AND name NOT LIKE 'sqlite_%'",
  ) as Array<{ type: string; name: string }>;
  for (const { type, name } of rest) {
    db.exec(`DROP ${type === 'view' ? 'VIEW' : 'TABLE'} IF EXISTS ${quoteIdent(name)}`);
  }
  db.exec('VACUUM');
}

export type SchemaResult = { created: boolean; recreated: boolean; storedVersion: string | null };

/**
 * Apply `snapshot.sql` to a new DB, or wipe and re-apply it when the stored
 * `meta.snapshot_schema_version` differs from `version`. The snapshot is
 * disposable (design doc §0.2), so there are no snapshot migrations.
 */
export function ensureSchema(db: Db, ddl: string, version: number = SNAPSHOT_SCHEMA_VERSION): SchemaResult {
  const hasMeta = scalar<number>(db, "SELECT count(*) FROM sqlite_master WHERE type = 'table' AND name = 'meta'") === 1;
  const objectCount = scalar<number>(db, "SELECT count(*) FROM sqlite_master WHERE name NOT LIKE 'sqlite_%'") ?? 0;
  const storedVersion = hasMeta
    ? (scalar<string>(db, 'SELECT value FROM meta WHERE key = ?', [META_SCHEMA_VERSION_KEY]) ?? null)
    : null;

  if (hasMeta && storedVersion === String(version)) {
    return { created: false, recreated: false, storedVersion };
  }

  // Anything else that isn't an empty file is stale or foreign: wipe it.
  const recreated = objectCount > 0;
  if (recreated) dropAllObjects(db);
  db.transaction((tx) => {
    tx.exec(ddl);
    tx.exec({
      sql: 'INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)',
      bind: [META_SCHEMA_VERSION_KEY, String(version)],
    });
  });
  return { created: !recreated, recreated, storedVersion };
}

function toSqlValue(v: unknown): unknown {
  if (v === undefined) return null;
  if (v === true) return 1;
  if (v === false) return 0;
  return v;
}

/**
 * Insert rows with one prepared single-row INSERT, re-bound per row. Measured faster than
 * multi-row `VALUES (...), (...)` statements in sqlite-wasm (array binding dominates there).
 * Rows are read by column name, so extra keys are ignored and missing keys become NULL.
 * `snapshotId` overrides each row's `snapshot_id`.
 */
export function insertRows(
  db: Db,
  table: string,
  rows: readonly Record<string, unknown>[],
  snapshotId?: string,
): void {
  if (rows.length === 0) return;
  const { columns } = tableColumns(table);
  const nCols = columns.length;
  const sidIdx = snapshotId === undefined ? -1 : columns.indexOf('snapshot_id');
  const stmt = db.prepare(
    `INSERT INTO ${quoteIdent(table)} (${columns.map(quoteIdent).join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`,
  );
  const values: unknown[] = new Array(nCols);
  try {
    for (const row of rows) {
      for (let c = 0; c < nCols; c++) values[c] = c === sidIdx ? snapshotId : toSqlValue(row[columns[c]]);
      stmt.bind(values as never).stepReset();
    }
  } finally {
    stmt.finalize();
  }
}

function deleteSnapshots(db: Db, ids: readonly string[]): void {
  for (const id of ids) {
    db.exec({
      sql: `DELETE FROM buildable_rtree WHERE id IN (SELECT rowid FROM ${TABLE_BUILDABLE} WHERE snapshot_id = ?)`,
      bind: [id],
    });
    for (const t of PER_SNAPSHOT_TABLES) {
      db.exec({ sql: `DELETE FROM ${quoteIdent(t)} WHERE snapshot_id = ?`, bind: [id] });
    }
    db.exec({ sql: `DELETE FROM ${TABLE_SNAPSHOT} WHERE id = ?`, bind: [id] });
  }
}

/** Index the new snapshot's buildables of the R*Tree categories as point boxes. */
export function rebuildRtree(db: Db, snapshotId: string): void {
  const cats = RTREE_CATEGORIES.map(() => '?').join(', ');
  db.exec({
    sql: `INSERT INTO buildable_rtree (id, min_x, max_x, min_y, max_y)
          SELECT rowid, x, x, y, y FROM ${TABLE_BUILDABLE}
          WHERE snapshot_id = ? AND category IN (${cats})`,
    bind: [snapshotId, ...RTREE_CATEGORIES],
  });
}

export class SnapshotValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SnapshotValidationError';
  }
}

function validateAll(snapshot: SnapshotInput, tables: SnapshotTables): void {
  const snap = SNAPSHOT_ROW_SCHEMAS[TABLE_SNAPSHOT].safeParse({ ...snapshot, status: 'current' });
  if (!snap.success) throw new SnapshotValidationError(`snapshot: ${snap.error.message}`);
  for (const t of SNAPSHOT_DATA_TABLES) {
    const rows = tables[t] as Record<string, unknown>[] | undefined;
    if (!rows) continue;
    const schema = SNAPSHOT_ROW_SCHEMAS[t];
    for (let i = 0; i < rows.length; i++) {
      const res = schema.safeParse(rows[i]);
      if (!res.success) throw new SnapshotValidationError(`${t}[${i}]: ${res.error.message}`);
    }
  }
  const unknown = Object.keys(tables).filter((t) => !SNAPSHOT_DATA_TABLES.includes(t as never));
  if (unknown.length) throw new SnapshotValidationError(`Unknown snapshot tables: ${unknown.join(', ')}`);
}

/**
 * Write one snapshot in a single transaction:
 * 1. prune: delete the `previous` snapshot (and any snapshot with the new id) and all its rows,
 * 2. rotate: `current` → `previous` (unless the new id *is* the current one, which is replaced in place),
 * 3. insert the new snapshot row as `current` and every table's rows,
 * 4. rebuild `buildable_rtree` for the new snapshot.
 * Rows' `snapshot_id` is forced to `snapshot.id`.
 */
/**
 * Page cache for the duration of a write, in KiB. The default 2 MiB cache makes the large
 * synthetic write thrash: the edge table's text-keyed indexes are far bigger than the cache,
 * so every insert evicts dirty pages, and on opfs-sahpool each spill is journal + data I/O.
 * Measured in headless Chrome here: 817 s for 300k edges at the default cache. Restored to
 * the previous value afterwards so SQLite drops the extra pages.
 */
export const WRITE_CACHE_KIB = 256 * 1024;

export function writeSnapshot(
  db: Db,
  snapshot: SnapshotInput,
  tables: SnapshotTables,
  opts: { validate: boolean },
): WriteTimings {
  const t0 = now();
  const timings: Record<string, number> = {};
  const rows: Record<string, number> = {};

  if (opts.validate) {
    const v0 = now();
    validateAll(snapshot, tables);
    timings.validate = now() - v0;
  }

  const previousCacheSize = db.selectValue('PRAGMA cache_size') as number;
  db.exec(`PRAGMA cache_size=-${WRITE_CACHE_KIB}`);
  try {
    db.transaction(() => {
      let s = now();
      const currentId = db.selectValue(`SELECT id FROM ${TABLE_SNAPSHOT} WHERE status = 'current'`) as
        | string
        | undefined;
      if (currentId === snapshot.id) {
        // Re-writing the current snapshot: replace it in place, keep `previous` as is.
        deleteSnapshots(db, [snapshot.id]);
      } else {
        const prune = db.selectValues(`SELECT id FROM ${TABLE_SNAPSHOT} WHERE status = 'previous' OR id = ?`, [
          snapshot.id,
        ]) as string[];
        deleteSnapshots(db, prune);
        db.exec(`UPDATE ${TABLE_SNAPSHOT} SET status = 'previous' WHERE status = 'current'`);
      }
      timings.rotate = now() - s;

      s = now();
      insertRows(db, TABLE_SNAPSHOT, [{ ...snapshot, status: 'current' }]);
      timings.snapshot = now() - s;
      rows.snapshot = 1;

      for (const t of SNAPSHOT_DATA_TABLES) {
        const list = (tables[t] ?? []) as Record<string, unknown>[];
        s = now();
        insertRows(db, t, list, snapshot.id);
        timings[t] = now() - s;
        rows[t] = list.length;
      }

      s = now();
      rebuildRtree(db, snapshot.id);
      timings.buildable_rtree = now() - s;
      rows.buildable_rtree = db.changes();
    });
  } finally {
    db.exec(`PRAGMA cache_size=${previousCacheSize}`);
  }

  return { tables: timings, rows, totalMs: now() - t0, validated: opts.validate };
}
