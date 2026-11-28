import { describe, expect, it } from 'vitest';
import { SNAPSHOT_ROW_SCHEMAS } from '@satisfactories/model';
import { SYNTHETIC_PRESETS, generateSyntheticSnapshot } from './synthetic';

describe('synthetic snapshot generator', () => {
  it('is deterministic for the same options', () => {
    const a = generateSyntheticSnapshot({ saveIdentifier: 'w', preset: 'small', seed: 7 });
    const b = generateSyntheticSnapshot({ saveIdentifier: 'w', preset: 'small', seed: 7 });
    expect(a).toEqual(b);
    const c = generateSyntheticSnapshot({ saveIdentifier: 'w', preset: 'small', seed: 7, generation: 1 });
    expect(c.snapshot.id).not.toBe(a.snapshot.id);
  });

  it('small preset rows pass the model Zod schemas and have unique keys', () => {
    const { snapshot, tables } = generateSyntheticSnapshot({ saveIdentifier: 'w', preset: 'small' });
    expect(SNAPSHOT_ROW_SCHEMAS.snapshot.safeParse({ ...snapshot, status: 'current' }).success).toBe(true);
    for (const [table, rows] of Object.entries(tables)) {
      const schema = SNAPSHOT_ROW_SCHEMAS[table];
      for (const row of rows as unknown[]) {
        const res = schema.safeParse(row);
        if (!res.success) throw new Error(`${table}: ${res.error.message}`);
      }
    }
    expect(tables.buildable!.length).toBe(SYNTHETIC_PRESETS.small.buildables);
    expect(new Set(tables.buildable!.map((b) => b.key)).size).toBe(tables.buildable!.length);
    expect(new Set(tables.edge!.map((e) => `${e.from_component}|${e.to_component}`)).size).toBe(tables.edge!.length);
    expect(new Set(tables.foundation_tile!.map((t) => `${t.tile_x}|${t.tile_y}|${t.z_bucket}`)).size).toBe(
      tables.foundation_tile!.length,
    );
  });

  it('large preset has the handoff sizes', () => {
    const { tables } = generateSyntheticSnapshot({ saveIdentifier: 'w', preset: 'large' });
    expect(tables.buildable!.length).toBe(150_000);
    expect(tables.edge!.length).toBe(300_000);
    expect(tables.foundation_tile!.length).toBe(40_000);
    expect(tables.component!.length).toBe(20_000);
  });
});
