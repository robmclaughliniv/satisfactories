import type { Factory, PersistedStateV2, World } from '../../schema';
import { SCHEMA_VERSION } from '../../schema';
import {
  emptyWorldDecisions,
  type FactoryRow,
  type MetricHistoryRow,
  type WorldDecisions,
  type FavoritesRow,
} from '../../decisions/tables';

export type V10ToDecisionsV1Result = {
  worlds: WorldDecisions[];
  favorites: FavoritesRow;
};

function metricHistoryId(worldId: string, factoryId: string, savedAt: string, index: number): string {
  return `mh_${worldId}_${factoryId}_${savedAt}_${index}`;
}

function factoryRowFromV10(world: World, factory: Factory): FactoryRow {
  return {
    id: factory.id,
    world_id: world.id,
    name: factory.name,
    color: factory.color,
    status: factory.status,
    tier: factory.tier,
    tagline: factory.tagline,
    tags: [...factory.tags],
    cover: factory.cover,
    notes: '',
    polygon: null,
    legacy_pin_percent: { x: factory.x, y: factory.y },
    floor_settings: { mode: 'auto' },
    favorite_items: factory.favoriteItems ? [...factory.favoriteItems] : [],
    import_order: [...factory.importOrder],
    export_order: [...factory.exportOrder],
    created_at: world.createdAt,
    updated_at: world.updatedAt,
  };
}

function metricRowsFromWorld(world: World): MetricHistoryRow[] {
  return world.resourceMetricHistory.map((snap, index) => ({
    id: metricHistoryId(world.id, snap.factoryId, snap.savedAt, index),
    world_id: world.id,
    factory_id: snap.factoryId,
    saved_at: snap.savedAt,
    values: snap.values,
  }));
}

export function v10ToDecisionsV1(envelope: PersistedStateV2): V10ToDecisionsV1Result {
  if (envelope.schemaVersion !== SCHEMA_VERSION) {
    throw new Error(`expected schema version ${SCHEMA_VERSION}, got ${envelope.schemaVersion}`);
  }
  const worlds: WorldDecisions[] = envelope.worlds.map((world) => {
    const d = emptyWorldDecisions();
    d.world = {
      id: world.id,
      name: world.name,
      save_identifier: null,
      reference_dataset_id: null,
      origin: 'manual',
      created_at: world.createdAt,
      updated_at: world.updatedAt,
    };
    d.manual_world = {
      world_id: world.id,
      data: JSON.parse(JSON.stringify(world)) as World,
    };
    d.factories = world.factories.map((f) => factoryRowFromV10(world, f));
    d.metric_history = metricRowsFromWorld(world);
    return d;
  });
  const favorites: FavoritesRow = {
    world_id: null,
    items: [...envelope.favItems],
    factories: [...envelope.favFactories],
  };
  return { worlds, favorites };
}