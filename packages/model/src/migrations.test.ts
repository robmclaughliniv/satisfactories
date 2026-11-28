import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  buildBackupEnvelope,
  instantiateTemplate,
  migratePersisted,
  parseBackup,
  SCHEMA_VERSION,
  serializeBackup,
  WorldSchema,
  WorldTemplateSchema,
  type PersistedStateV2,
} from './index';
import type { RecipeLookup } from './production';

const stubRecipes: RecipeLookup = (id) => {
  if (id === 'iron_ingot') {
    return {
      inputs: [{ item: 'Iron Ore', rate: 30 }],
      outputs: [{ item: 'Iron Ingot', rate: 30 }],
    };
  }
  if (id === 'iron_plate') {
    return {
      inputs: [{ item: 'Iron Ingot', rate: 30 }],
      outputs: [{ item: 'Iron Plate', rate: 20 }],
    };
  }
  return undefined;
};

const factoryShell = (id: string) => ({
  id,
  name: id,
  color: '#F5882E',
  status: 'planned',
  tier: 'Mini-factory',
  tagline: '',
  tags: [],
  cover: '',
  x: 0,
  y: 0,
  sections: [{ id: 's1', name: 'Floor', rows: [] }],
  localInputs: [] as object[],
  importOrder: [] as string[],
  exportOrder: [] as string[],
  stationSeq: 0,
  baseline: '[]',
});

const worldShell = (factories: object[], schemaVersion?: number) => {
  const world = {
    id: 'w',
    name: 'Test',
    factories,
    routes: [],
    stations: [],
    createdAt: '2020-01-01T00:00:00.000Z',
    updatedAt: '2020-01-01T00:00:00.000Z',
  };
  return schemaVersion === undefined
    ? { worlds: [world], worldId: world.id, favItems: [] as string[] }
    : { schemaVersion, worlds: [world], worldId: world.id, favItems: [], favFactories: [] as string[] };
};

describe('migratePersisted', () => {
  it('migrates unversioned legacy saves to v10', () => {
    const legacy = worldShell([factoryShell('f1')]);
    const result = migratePersisted(legacy, stubRecipes);
    expect(result?.schemaVersion).toBe(SCHEMA_VERSION);
    expect(result?.worlds[0].createdAt).toBeTruthy();
  });

  it('adds localInputs at v2→v3', () => {
    const env = worldShell([{ ...factoryShell('f1'), sections: [] }] as object[], 2);
    const result = migratePersisted(env, stubRecipes);
    expect(result?.worlds[0].factories[0].localInputs).toEqual([]);
  });

  it('adds import/export order at v3→v4', () => {
    const env = worldShell([factoryShell('f1')], 3);
    const result = migratePersisted(env, stubRecipes);
    expect(result?.worlds[0].factories[0].importOrder).toEqual([]);
    expect(result?.worlds[0].factories[0].exportOrder).toEqual([]);
  });

  it('normalizes baselines at v4→v5', () => {
    const env = worldShell([factoryShell('f1')], 4);
    const result = migratePersisted(env, stubRecipes);
    const baseline = JSON.parse(result!.worlds[0].factories[0].baseline);
    expect(baseline).toHaveProperty('sections');
    expect(baseline).toHaveProperty('routes');
  });

  it('adds favFactories at v5→v6', () => {
    const env = worldShell([factoryShell('f1')], 5);
    const result = migratePersisted(env, stubRecipes);
    expect(result?.favFactories).toEqual([]);
  });

  it('migrates Train routes to stations at v6→v7', () => {
    const f1 = factoryShell('A');
    const f2 = factoryShell('B');
    const env = {
      schemaVersion: 6,
      worlds: [
        {
          id: 'w',
          name: 'Train test',
          factories: [f1, f2],
          routes: [
            { id: 'r1', from: 'A', to: 'B', item: 'Coal', rate: 60, t: 'Train' },
          ],
          stations: [],
          createdAt: '2020-01-01T00:00:00.000Z',
          updatedAt: '2020-01-01T00:00:00.000Z',
        },
      ],
      worldId: 'w',
      favItems: [],
      favFactories: [],
    };
    const result = migratePersisted(env, stubRecipes);
    expect(result?.worlds[0].routes).toEqual([]);
    expect(result?.worlds[0].stations?.length).toBeGreaterThanOrEqual(2);
  });

  it('adds row destinations at v7→v8', () => {
    const factory = {
      ...factoryShell('f1'),
      sections: [
        {
          id: 's1',
          name: 'Floor',
          rows: [{ id: 'r1', recipeId: 'iron_ingot', count: 1 }],
        },
      ],
    };
    const env = worldShell([factory], 7);
    const result = migratePersisted(env, stubRecipes);
    expect(result?.worlds[0].factories[0].sections[0].rows[0].destinations).toEqual([]);
  });

  it('adds row sources at v8→v9', () => {
    const factory = {
      ...factoryShell('f1'),
      sections: [
        {
          id: 's1',
          name: 'Floor',
          rows: [{ id: 'r1', recipeId: 'iron_ingot', count: 1, destinations: [] }],
        },
      ],
    };
    const env = worldShell([factory], 8);
    const result = migratePersisted(env, stubRecipes);
    expect(result?.worlds[0].factories[0].sections[0].rows[0].sources).toEqual([]);
  });

  it('v8 and v9 paths produce identical v10 envelopes', () => {
    const factoryA = {
      id: 'A',
      name: 'Smelter',
      color: '#F5882E',
      status: 'planned',
      tier: 'Mini-factory',
      tagline: '',
      tags: [],
      cover: '',
      x: 10,
      y: 10,
      sections: [
        {
          id: 'floor1',
          name: 'First floor',
          rows: [
            {
              id: 'smelt',
              name: '',
              recipeId: 'iron_ingot',
              count: 2,
              allocations: [],
              destinations: [{ kind: 'section', sectionId: 'floor1' }, { kind: 'export' }],
              sources: [],
            },
            {
              id: 'plate',
              name: '',
              recipeId: 'iron_plate',
              count: 1,
              allocations: [],
              destinations: [],
              sources: [],
            },
          ],
        },
      ],
      localInputs: [],
      importOrder: [],
      exportOrder: [],
      stationSeq: 0,
      baseline: '',
    };

    const factoryB = {
      id: 'B',
      name: 'Receiver',
      color: '#3B82F6',
      status: 'planned',
      tier: 'Mini-factory',
      tagline: '',
      tags: [],
      cover: '',
      x: 50,
      y: 50,
      sections: [{ id: 'other', name: 'Other', rows: [] }],
      localInputs: [],
      importOrder: [],
      exportOrder: [],
      stationSeq: 0,
      baseline: '',
    };

    const world = {
      id: 'w_v8',
      name: 'V8 migration',
      factories: [factoryA, factoryB],
      routes: [{ id: 'belt-ingot', from: 'A', to: 'B', item: 'Iron Ingot', rate: 30, t: 'Belt' }],
      stations: [],
      resourceMetricHistory: [],
      createdAt: '2020-01-01T00:00:00.000Z',
      updatedAt: '2020-01-01T00:00:00.000Z',
    };

    const envelopeV8 = {
      schemaVersion: 8,
      worlds: [world],
      worldId: world.id,
      favItems: [],
      favFactories: [],
    };

    const envelopeV9 = JSON.parse(JSON.stringify(envelopeV8));
    envelopeV9.schemaVersion = 9;

    const fromV8 = migratePersisted(JSON.parse(JSON.stringify(envelopeV8)), stubRecipes);
    const fromV9 = migratePersisted(JSON.parse(JSON.stringify(envelopeV9)), stubRecipes);

    expect(fromV8).toBeTruthy();
    expect(fromV9).toBeTruthy();
    expect(fromV8!.schemaVersion).toBe(10);
    expect(fromV9!.schemaVersion).toBe(10);
    expect(fromV8).toEqual(fromV9);

    const upgradedRow = fromV9!.worlds[0].factories[0].sections[0].rows[0];
    expect(upgradedRow.destinations).toEqual([]);
    expect(upgradedRow.allocations.some((a) => a.kind === 'line' && a.targetId === 'plate')).toBe(true);
  });
});

describe('Northern Stretch template', () => {
  it('instantiates and validates against WorldSchema', () => {
    const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../apps/web');
    const raw = JSON.parse(readFileSync(path.join(root, 'src/data/templates/northern-stretch.json'), 'utf8'));
    const template = WorldTemplateSchema.parse(raw);
    const world = instantiateTemplate(template, () => undefined);
    expect(() => WorldSchema.parse(world)).not.toThrow();
  });
});

describe('backup envelope', () => {
  it('round-trips through serialize and parse', () => {
    const parsed = WorldSchema.parse({
      id: 'w',
      name: 'Round trip',
      factories: [],
      routes: [],
      stations: [],
      resourceMetricHistory: [],
      createdAt: '2020-01-01T00:00:00.000Z',
      updatedAt: '2020-01-01T00:00:00.000Z',
    });
    const envelope: PersistedStateV2 = buildBackupEnvelope({
      worlds: [parsed],
      worldId: parsed.id,
      favItems: ['Iron Ore'],
      favFactories: ['f1'],
    });
    const text = serializeBackup(envelope);
    const restored = parseBackup(text, stubRecipes);
    expect(restored).toEqual(envelope);
  });
});