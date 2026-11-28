import assert from 'node:assert/strict';
import { createWebViteServer } from './vite-web-root.mjs';

const server = await createWebViteServer();

try {
  const { migratePersisted } = await server.ssrLoadModule('/src/model/migrations.ts');

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
            destinations: [
              { kind: 'section', sectionId: 'floor1' },
              { kind: 'export' },
            ],
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
    routes: [
      {
        id: 'belt-ingot',
        from: 'A',
        to: 'B',
        item: 'Iron Ingot',
        rate: 30,
        t: 'Belt',
      },
    ],
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

  const fromV8 = migratePersisted(JSON.parse(JSON.stringify(envelopeV8)));
  const fromV9 = migratePersisted(JSON.parse(JSON.stringify(envelopeV9)));

  assert.ok(fromV8, 'v8 envelope should migrate');
  assert.ok(fromV9, 'v9 envelope should migrate');
  assert.equal(fromV8.schemaVersion, 10);
  assert.equal(fromV9.schemaVersion, 10);

  assert.deepEqual(
    fromV8,
    fromV9,
    'v8-shaped saves must match the v9 upgrade path after migration',
  );

  const upgradedRow = fromV9.worlds[0].factories[0].sections[0].rows[0];
  assert.deepEqual(upgradedRow.destinations, []);
  assert.ok(
    upgradedRow.allocations.some((allocation) => allocation.kind === 'line' && allocation.targetId === 'plate'),
    'legacy section destinations become line allocations',
  );
  assert.ok(
    upgradedRow.allocations.some(
      (allocation) =>
        (allocation.kind === 'factory' && allocation.targetId === 'B') || allocation.kind === 'review',
    ),
    'legacy export destinations become factory exports or review placeholders',
  );

  console.log('Passed: v8 and v9 migration paths produce identical v10 envelopes.');
} finally {
  await server.close();
}