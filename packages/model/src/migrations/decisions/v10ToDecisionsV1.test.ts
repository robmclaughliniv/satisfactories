import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { migratePersisted, instantiateTemplate, SCHEMA_VERSION, WorldTemplateSchema, type PersistedStateV2 } from '../../index';
import type { RecipeLookup } from '../../production';
import { v10ToDecisionsV1 } from './v10ToDecisionsV1';

const stubRecipes: RecipeLookup = () => undefined;

const factoryShell = (id: string) => ({
  id,
  name: id,
  color: '#F5882E',
  status: 'planned' as const,
  tier: 'Mini-factory',
  tagline: '',
  tags: [],
  cover: '',
  x: 12,
  y: 34,
  sections: [{ id: 's1', name: 'Floor', rows: [] }],
  localInputs: [] as object[],
  importOrder: [] as string[],
  exportOrder: [] as string[],
  stationSeq: 0,
  baseline: '[]',
});

describe('v10ToDecisionsV1', () => {
  it('preserves Northern Stretch manual_world', () => {
    const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../../apps/web');
    const raw = JSON.parse(readFileSync(path.join(root, 'src/data/templates/northern-stretch.json'), 'utf8'));
    const template = WorldTemplateSchema.parse(raw);
    const world = instantiateTemplate(template, stubRecipes);
    const envelope: PersistedStateV2 = {
      schemaVersion: SCHEMA_VERSION,
      worlds: [world],
      worldId: world.id,
      favItems: ['Iron Ore'],
      favFactories: ['f1'],
    };
    const { worlds, favorites } = v10ToDecisionsV1(envelope);
    expect(worlds).toHaveLength(1);
    expect(worlds[0].manual_world?.data).toEqual(world);
    expect(worlds[0].factories.length).toBe(world.factories.length);
    expect(worlds[0].factories.every((f, i) => f.id === world.factories[i].id)).toBe(true);
    expect(favorites.items).toEqual(['Iron Ore']);
  });

  it('migrates v8/v9 envelopes after migratePersisted', () => {
    const world = {
      id: 'w',
      name: 'Test',
      factories: [factoryShell('f1')],
      routes: [],
      stations: [],
      resourceMetricHistory: [],
      createdAt: '2020-01-01T00:00:00.000Z',
      updatedAt: '2020-01-01T00:00:00.000Z',
    };
    for (const ver of [8, 9, 10] as const) {
      const env = {
        schemaVersion: ver,
        worlds: [world],
        worldId: world.id,
        favItems: [],
        favFactories: [],
      };
      const migrated = migratePersisted(env, stubRecipes);
      expect(migrated?.schemaVersion).toBe(10);
      const { worlds } = v10ToDecisionsV1(migrated!);
      expect(worlds[0].manual_world?.data.factories[0].x).toBe(12);
      expect(worlds[0].factories[0].legacy_pin_percent).toEqual({ x: 12, y: 34 });
    }
  });
});