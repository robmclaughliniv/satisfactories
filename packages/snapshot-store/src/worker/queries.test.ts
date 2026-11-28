import { beforeAll, describe, expect, it } from 'vitest';
import type { BuildableRow } from '@satisfactories/model';
import { FOUNDATION_TILE_CM, RTREE_CATEGORIES } from '../columns';
import { SAMPLE_BBOX, generateSyntheticSnapshot } from '../synthetic';
import { openMemoryDb } from '../test/helpers';
import type { Db } from '../sqlite';
import type { BBox } from '../types';
import { writeSnapshot } from './db';
import {
  buildablesByKeys,
  buildablesInBBox,
  countByCategory,
  edgesTouching,
  foundationTilesInBBox,
  getSnapshotByStatus,
} from './queries';

const inBox = (b: BBox) => (r: { x: number; y: number }) =>
  r.x >= b.minX && r.x <= b.maxX && r.y >= b.minY && r.y <= b.maxY;
const keys = (rows: { key: string }[]) => rows.map((r) => r.key).sort();

describe('read queries', () => {
  let db: Db;
  const prev = generateSyntheticSnapshot({ saveIdentifier: 'q', preset: 'small', generation: 0 });
  const cur = generateSyntheticSnapshot({ saveIdentifier: 'q', preset: 'small', generation: 1 });
  const sid = cur.snapshot.id;
  const B = cur.tables.buildable!;
  const box: BBox = { minX: -150_000, maxX: 150_000, minY: -100_000, maxY: 200_000 };

  beforeAll(async () => {
    ({ db } = await openMemoryDb());
    writeSnapshot(db, prev.snapshot, prev.tables, { validate: false });
    writeSnapshot(db, cur.snapshot, cur.tables, { validate: false });
  });

  it('getCurrentSnapshot / getPreviousSnapshot map booleans back', () => {
    const c = getSnapshotByStatus(db, 'current')!;
    expect(c).toEqual({ ...cur.snapshot, status: 'current' });
    expect(getSnapshotByStatus(db, 'previous')!.id).toBe(prev.snapshot.id);
  });

  it('countByCategory matches the input', () => {
    const expected: Record<string, number> = {};
    for (const b of B) expected[b.category] = (expected[b.category] ?? 0) + 1;
    expect(countByCategory(db, sid)).toEqual(expected);
    expect(countByCategory(db, 'nope')).toEqual({});
  });

  it('buildablesInBBox without categories returns every buildable in the box, current snapshot only', () => {
    const got = buildablesInBBox(db, sid, box);
    expect(keys(got)).toEqual(keys(B.filter(inBox(box))));
    expect(got.every((r) => r.snapshot_id === sid)).toBe(true);
    expect(got.every((r) => typeof r.partial === 'boolean')).toBe(true);
  });

  it('buildablesInBBox with R*Tree and non-R*Tree categories', () => {
    for (const cats of [['production'], ['production', 'storage'], ['logistics'], ['station', 'power']] as const) {
      const got = buildablesInBBox(db, sid, box, [...cats]);
      expect(keys(got), cats.join(',')).toEqual(keys(B.filter(inBox(box)).filter((b) => cats.includes(b.category as never))));
    }
  });

  it('buildablesInBBox handles an inverted box and the fixed sample box', () => {
    const inverted = { minX: box.maxX, maxX: box.minX, minY: box.maxY, maxY: box.minY };
    expect(buildablesInBBox(db, sid, inverted).length).toBe(B.filter(inBox(box)).length);
    expect(buildablesInBBox(db, sid, SAMPLE_BBOX).length).toBe(B.filter(inBox(SAMPLE_BBOX)).length);
  });

  it('the R*Tree path is used for indexed categories', () => {
    const detail = db
      .selectObjects(
        `EXPLAIN QUERY PLAN SELECT b.* FROM buildable_rtree r CROSS JOIN buildable b ON b.rowid = r.id
         WHERE r.min_x <= 1 AND r.max_x >= 0 AND r.min_y <= 1 AND r.max_y >= 0 AND b.snapshot_id = 'x'`,
      )
      .map((r) => String(r.detail));
    expect(detail[0]).toMatch(/VIRTUAL TABLE INDEX/);
    expect(RTREE_CATEGORIES).not.toContain('logistics');
  });

  it('buildablesByKeys chunks large inputs and ignores unknown keys', () => {
    const want = B.slice(0, 1_234).map((b) => b.key);
    const got = buildablesByKeys(db, sid, [...want, 'missing', want[0]]);
    expect(keys(got)).toEqual([...want].sort());
    // Keys from the previous snapshot don't leak in.
    expect(buildablesByKeys(db, sid, prev.tables.buildable!.slice(0, 5).map((b) => b.key))).toEqual([]);
    expect(buildablesByKeys(db, sid, [])).toEqual([]);
  });

  it('edgesTouching returns each edge once, from or to the set', () => {
    const set = new Set(B.slice(0, 900).map((b) => b.key));
    const got = edgesTouching(db, sid, [...set]);
    const expected = cur.tables.edge!.filter((e) => set.has(e.from_buildable) || set.has(e.to_buildable));
    const id = (e: { from_component: string; to_component: string }) => `${e.from_component}|${e.to_component}`;
    expect(got.map(id).sort()).toEqual(expected.map(id).sort());
    expect(got.every((e) => typeof e.direction_known === 'boolean')).toBe(true);
  });

  it('foundationTilesInBBox selects tiles by 16 m tile coordinates', () => {
    const tb: BBox = { minX: -10 * FOUNDATION_TILE_CM, maxX: 5 * FOUNDATION_TILE_CM - 1, minY: -3 * FOUNDATION_TILE_CM, maxY: 0 };
    const got = foundationTilesInBBox(db, sid, tb);
    const expected = cur.tables.foundation_tile!.filter(
      (t) => t.tile_x >= -10 && t.tile_x <= 4 && t.tile_y >= -3 && t.tile_y <= 0,
    );
    expect(got.length).toBe(expected.length);
    expect(got.length).toBeGreaterThan(0);
  });

  it('returned buildables equal the inserted rows', () => {
    const sample = B[17] as BuildableRow;
    expect(buildablesByKeys(db, sid, [sample.key])[0]).toEqual(sample);
  });
});
