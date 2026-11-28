import {
  TABLE_BUILDABLE,
  TABLE_EDGE,
  TABLE_FOUNDATION_TILE,
  TABLE_SNAPSHOT,
  type BuildableRow,
  type EdgeRow,
  type FoundationTileRow,
  type SnapshotRow,
} from '@satisfactories/model';
import { FOUNDATION_TILE_CM, RTREE_CATEGORIES, fromSqlRow } from '../columns';
import type { Db } from '../sqlite';
import type { BBox, BuildableCategory, CategoryCounts } from '../types';

/** Keys per `IN (...)` list. Well under the bound-parameter limit, and small enough to keep plans index-driven. */
export const KEY_CHUNK = 500;

function placeholders(n: number): string {
  return Array.from({ length: n }, () => '?').join(', ');
}

function chunks<T>(list: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

function select<T>(db: Db, table: string, sql: string, bind: unknown[]): T[] {
  const rows = db.selectObjects(sql, bind as never) as Record<string, unknown>[];
  return rows.map((r) => fromSqlRow<T>(table, r));
}

export function getSnapshotByStatus(db: Db, status: SnapshotRow['status']): SnapshotRow | null {
  const rows = select<SnapshotRow>(
    db,
    TABLE_SNAPSHOT,
    `SELECT * FROM ${TABLE_SNAPSHOT} WHERE status = ? ORDER BY imported_at DESC LIMIT 1`,
    [status],
  );
  return rows[0] ?? null;
}

export function listSnapshots(db: Db): SnapshotRow[] {
  return select<SnapshotRow>(db, TABLE_SNAPSHOT, `SELECT * FROM ${TABLE_SNAPSHOT} ORDER BY imported_at`, []);
}

export function countByCategory(db: Db, snapshotId: string): CategoryCounts {
  const rows = db.selectObjects(
    `SELECT category, count(*) AS n FROM ${TABLE_BUILDABLE} WHERE snapshot_id = ? GROUP BY category`,
    [snapshotId],
  ) as Array<{ category: BuildableCategory; n: number }>;
  const out: CategoryCounts = {};
  for (const r of rows) out[r.category] = Number(r.n);
  return out;
}

function normBox(b: BBox): BBox {
  return {
    minX: Math.min(b.minX, b.maxX),
    maxX: Math.max(b.minX, b.maxX),
    minY: Math.min(b.minY, b.maxY),
    maxY: Math.max(b.minY, b.maxY),
  };
}

/**
 * Buildables whose (x, y) is inside `bbox` (inclusive). R*Tree categories go through
 * `buildable_rtree`; other categories (not indexed in the R*Tree by design) use a
 * range scan over the `(snapshot_id, category)` index. With no `categories`, all
 * categories are returned.
 */
export function buildablesInBBox(
  db: Db,
  snapshotId: string,
  bbox: BBox,
  categories?: readonly BuildableCategory[],
): BuildableRow[] {
  const b = normBox(bbox);
  const wanted = categories && categories.length > 0 ? [...new Set(categories)] : null;
  const rtreeCats = wanted ? wanted.filter((c) => RTREE_CATEGORIES.includes(c)) : [...RTREE_CATEGORIES];
  const scanCats = wanted
    ? wanted.filter((c) => !RTREE_CATEGORIES.includes(c))
    : null; // null = every non-R*Tree category

  const out: BuildableRow[] = [];
  if (rtreeCats.length > 0) {
    const catFilter =
      rtreeCats.length === RTREE_CATEGORIES.length ? '' : ` AND b.category IN (${placeholders(rtreeCats.length)})`;
    // CROSS JOIN pins the R*Tree as the outer loop.
    out.push(
      ...select<BuildableRow>(
        db,
        TABLE_BUILDABLE,
        `SELECT b.* FROM buildable_rtree r CROSS JOIN ${TABLE_BUILDABLE} b ON b.rowid = r.id
         WHERE r.min_x <= ? AND r.max_x >= ? AND r.min_y <= ? AND r.max_y >= ?
           AND b.snapshot_id = ?${catFilter}`,
        [b.maxX, b.minX, b.maxY, b.minY, snapshotId, ...(catFilter ? rtreeCats : [])],
      ),
    );
  }

  const scanList = scanCats ?? null;
  if (scanList === null || scanList.length > 0) {
    const catSql =
      scanList === null
        ? `category NOT IN (${placeholders(RTREE_CATEGORIES.length)})`
        : `category IN (${placeholders(scanList.length)})`;
    out.push(
      ...select<BuildableRow>(
        db,
        TABLE_BUILDABLE,
        `SELECT * FROM ${TABLE_BUILDABLE}
         WHERE snapshot_id = ? AND ${catSql}
           AND x BETWEEN ? AND ? AND y BETWEEN ? AND ?`,
        [snapshotId, ...(scanList ?? RTREE_CATEGORIES), b.minX, b.maxX, b.minY, b.maxY],
      ),
    );
  }
  return out;
}

export function buildablesByKeys(db: Db, snapshotId: string, keys: readonly string[]): BuildableRow[] {
  const out: BuildableRow[] = [];
  for (const part of chunks([...new Set(keys)], KEY_CHUNK)) {
    out.push(
      ...select<BuildableRow>(
        db,
        TABLE_BUILDABLE,
        `SELECT * FROM ${TABLE_BUILDABLE} WHERE snapshot_id = ? AND key IN (${placeholders(part.length)})`,
        [snapshotId, ...part],
      ),
    );
  }
  return out;
}

/** Edges where `from_buildable` or `to_buildable` is in `buildableKeys`. Each edge appears once. */
export function edgesTouching(db: Db, snapshotId: string, buildableKeys: readonly string[]): EdgeRow[] {
  const seen = new Map<string, EdgeRow>();
  for (const part of chunks([...new Set(buildableKeys)], KEY_CHUNK)) {
    const ph = placeholders(part.length);
    for (const col of ['from_buildable', 'to_buildable'] as const) {
      const rows = select<EdgeRow>(
        db,
        TABLE_EDGE,
        `SELECT * FROM ${TABLE_EDGE} WHERE snapshot_id = ? AND ${col} IN (${ph})`,
        [snapshotId, ...part],
      );
      for (const e of rows) seen.set(`${e.from_component}\u0000${e.to_component}`, e);
    }
  }
  return [...seen.values()];
}

/** `foundation_tile` rows whose 16 m tile overlaps `bbox` (game cm). */
export function foundationTilesInBBox(db: Db, snapshotId: string, bbox: BBox): FoundationTileRow[] {
  const b = normBox(bbox);
  const t = (v: number) => Math.floor(v / FOUNDATION_TILE_CM);
  return select<FoundationTileRow>(
    db,
    TABLE_FOUNDATION_TILE,
    `SELECT * FROM ${TABLE_FOUNDATION_TILE}
     WHERE snapshot_id = ? AND tile_x BETWEEN ? AND ? AND tile_y BETWEEN ? AND ?`,
    [snapshotId, t(b.minX), t(b.maxX), t(b.minY), t(b.maxY)],
  );
}

/** Row counts per table for a snapshot (debug panel / tests). */
export function tableCounts(db: Db, snapshotId: string, tables: readonly string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const t of tables) {
    out[t] = Number(db.selectValue(`SELECT count(*) FROM "${t}" WHERE snapshot_id = ?`, [snapshotId]) ?? 0);
  }
  return out;
}
