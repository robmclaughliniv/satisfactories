import {
  SNAPSHOT_ROW_SCHEMAS,
  TABLE_BUILDABLE_RTREE,
  TABLE_META,
  TABLE_SNAPSHOT,
  type BuildableRow,
} from '@satisfactories/model';
import type { SnapshotTableName } from './types';

/** Tables the caller fills in `writeSnapshot`, in insert order. */
export const SNAPSHOT_DATA_TABLES: readonly SnapshotTableName[] = Object.keys(SNAPSHOT_ROW_SCHEMAS).filter(
  (t) => t !== TABLE_META && t !== TABLE_SNAPSHOT && t !== TABLE_BUILDABLE_RTREE,
) as SnapshotTableName[];

/** Every table that carries a `snapshot_id` column. */
export const PER_SNAPSHOT_TABLES: readonly string[] = SNAPSHOT_DATA_TABLES;

export type TableColumns = {
  /** Column names in Zod shape order (the parity test in `packages/model` keeps these equal to the SQL columns). */
  columns: readonly string[];
  /** Columns stored as 0/1 in SQL and exposed as booleans in TS. */
  booleans: ReadonlySet<string>;
};

function zodType(schema: unknown): string | undefined {
  return (schema as { _zod?: { def?: { type?: string } } })?._zod?.def?.type;
}

const cache = new Map<string, TableColumns>();

export function tableColumns(table: string): TableColumns {
  let cols = cache.get(table);
  if (!cols) {
    const schema = SNAPSHOT_ROW_SCHEMAS[table];
    if (!schema) throw new Error(`Unknown snapshot table: ${table}`);
    const columns = Object.keys(schema.shape);
    const booleans = new Set(columns.filter((c) => zodType(schema.shape[c]) === 'boolean'));
    cols = { columns, booleans };
    cache.set(table, cols);
  }
  return cols;
}

/** Map a SQL row back to the model row shape (0/1 → boolean). */
export function fromSqlRow<T>(table: string, row: Record<string, unknown>): T {
  const { booleans } = tableColumns(table);
  if (booleans.size > 0) {
    for (const c of booleans) {
      const v = row[c];
      if (v !== null && v !== undefined) row[c] = v === 1 || v === true;
    }
  }
  return row as T;
}

export function quoteIdent(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

/**
 * Categories indexed in `buildable_rtree` (design doc §1.2). Other categories
 * (logistics, power, vehicle, other) are not in the R*Tree; bbox queries for
 * them fall back to a range scan.
 */
export const RTREE_CATEGORIES: readonly BuildableRow['category'][] = [
  'production',
  'extractor',
  'generator',
  'station',
  'storage',
];

/** `foundation_tile` uses 16 m tiles (design doc §1.2, D3): `tile_x = floor(x_cm / 1600)`. */
export const FOUNDATION_TILE_CM = 1600;
