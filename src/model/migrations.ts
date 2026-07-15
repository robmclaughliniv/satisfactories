import { PersistedStateSchema, SCHEMA_VERSION, type Factory, type PersistedStateV2, type Route, type Station, type StationType, type World } from './schema';
import { parseBaseline } from './baseline';
import { createVehicle, nextStationSeq, stationName } from './logistics';

/**
 * Turn raw persisted JSON (any version) into a valid PersistedStateV2,
 * or null if the data is unrecoverable — boot then falls back to the
 * empty state instead of crashing.
 */
export function migratePersisted(raw: unknown): PersistedStateV2 | null {
  if (raw === null || typeof raw !== 'object') return null;
  let obj = raw as Record<string, unknown>;

  if (obj.schemaVersion === undefined) {
    const migrated = migrateLegacyV1(obj);
    if (!migrated) return null;
    obj = migrated;
  }

  if (obj.schemaVersion === 2) {
    obj = migrateV2ToV3(obj);
  }

  if (obj.schemaVersion === 3) {
    obj = migrateV3ToV4(obj);
  }

  if (obj.schemaVersion === 4) {
    obj = migrateV4ToV5(obj);
  }

  if (obj.schemaVersion === 5) {
    obj = migrateV5ToV6(obj);
  }

  if (obj.schemaVersion === 6) {
    obj = migrateV6ToV7(obj);
  }

  if (obj.schemaVersion !== SCHEMA_VERSION) return null;

  const parsed = PersistedStateSchema.safeParse(obj);
  return parsed.success ? parsed.data : null;
}

/** Legacy unversioned shape: { worlds, worldId, favItems } without timestamps. */
function migrateLegacyV1(obj: Record<string, unknown>): Record<string, unknown> | null {
  if (!Array.isArray(obj.worlds)) return null;
  const now = new Date().toISOString();
  const worlds = obj.worlds.map((w) =>
    w !== null && typeof w === 'object'
      ? { createdAt: now, updatedAt: now, ...(w as Record<string, unknown>) }
      : w,
  );
  const firstId =
    worlds.length && worlds[0] !== null && typeof worlds[0] === 'object'
      ? ((worlds[0] as Record<string, unknown>).id as string | undefined) ?? null
      : null;
  return {
    schemaVersion: 2,
    worlds,
    worldId: typeof obj.worldId === 'string' ? obj.worldId : firstId,
    favItems: Array.isArray(obj.favItems) ? obj.favItems : [],
  };
}

/** v2 → v3: add localInputs[] to each factory. */
function migrateV2ToV3(obj: Record<string, unknown>): Record<string, unknown> {
  const worlds = Array.isArray(obj.worlds)
    ? obj.worlds.map((w) => {
        if (w === null || typeof w !== 'object') return w;
        const world = w as Record<string, unknown>;
        const factories = Array.isArray(world.factories)
          ? world.factories.map((f) => {
              if (f === null || typeof f !== 'object') return f;
              const factory = f as Record<string, unknown>;
              return {
                ...factory,
                localInputs: Array.isArray(factory.localInputs) ? factory.localInputs : [],
              };
            })
          : world.factories;
        return { ...world, factories };
      })
    : obj.worlds;
  return { ...obj, schemaVersion: 3, worlds };
}

/** v3 → v4: add importOrder[] / exportOrder[] to each factory. */
function migrateV3ToV4(obj: Record<string, unknown>): Record<string, unknown> {
  const worlds = Array.isArray(obj.worlds)
    ? obj.worlds.map((w) => {
        if (w === null || typeof w !== 'object') return w;
        const world = w as Record<string, unknown>;
        const factories = Array.isArray(world.factories)
          ? world.factories.map((f) => {
              if (f === null || typeof f !== 'object') return f;
              const factory = f as Record<string, unknown>;
              return {
                ...factory,
                importOrder: Array.isArray(factory.importOrder) ? factory.importOrder : [],
                exportOrder: Array.isArray(factory.exportOrder) ? factory.exportOrder : [],
              };
            })
          : world.factories;
        return { ...world, factories };
      })
    : obj.worlds;
  return { ...obj, schemaVersion: 4, worlds };
}

/** v4 → v5: normalize factory baselines to full draft snapshots. */
function migrateV4ToV5(obj: Record<string, unknown>): Record<string, unknown> {
  const worlds = Array.isArray(obj.worlds)
    ? obj.worlds.map((w) => {
        if (w === null || typeof w !== 'object') return w;
        const world = w as Record<string, unknown>;
        const factories = Array.isArray(world.factories)
          ? world.factories.map((f) => {
              if (f === null || typeof f !== 'object') return f;
              const factory = f as Record<string, unknown>;
              const baseline = typeof factory.baseline === 'string' ? factory.baseline : '[]';
              return {
                ...factory,
                baseline: JSON.stringify(parseBaseline(baseline)),
              };
            })
          : world.factories;
        return { ...world, factories };
      })
    : obj.worlds;
  return { ...obj, schemaVersion: 5, worlds };
}

/** v5 → v6: add favFactories[]. */
function migrateV5ToV6(obj: Record<string, unknown>): Record<string, unknown> {
  return {
    ...obj,
    schemaVersion: 6,
    favFactories: Array.isArray(obj.favFactories) ? obj.favFactories : [],
  };
}

function routeToStationType(t: string): StationType | null {
  const lower = t.toLowerCase();
  if (lower === 'train' || lower === 'truck' || lower === 'drone') return lower;
  return null;
}

function migrateRoutesToStations(world: World): void {
  if (!world.stations) world.stations = [];
  const facById: Record<string, Factory> = {};
  world.factories.forEach((f) => {
    f.stationSeq = f.stationSeq ?? 0;
    facById[f.id] = f;
  });

  const keepRoutes: Route[] = [];
  const migratedRoutes: Route[] = [];

  world.routes.forEach((route) => {
    const type = routeToStationType(route.t);
    if (!type) {
      keepRoutes.push(route);
      return;
    }
    migratedRoutes.push(route);
  });

  migratedRoutes.forEach((route) => {
    const type = routeToStationType(route.t)!;
    const fromFac = facById[route.from];
    const toFac = facById[route.to];
    if (!fromFac || !toFac) return;

    const exportSeq = nextStationSeq(fromFac);
    const exportStation: Station = {
      id: `st_m_${route.id}`,
      name: stationName(fromFac, route.item, exportSeq),
      type,
      homeFactoryId: fromFac.id,
      resourceId: route.item,
      role: 'export',
      totalRate: route.rate,
      vehicles: [],
    };

    const importSeq = nextStationSeq(toFac);
    const importStation: Station = {
      id: `st_mi_${route.id}`,
      name: stationName(toFac, route.item, importSeq),
      type,
      homeFactoryId: toFac.id,
      resourceId: route.item,
      role: 'import',
      totalRate: 0,
      vehicles: [],
    };

    const vehicle = createVehicle(type, importStation.id);
    vehicle.perVehicleRate = route.rate;
    exportStation.vehicles.push(vehicle);

    world.stations!.push(exportStation, importStation);

    if (!fromFac.exportOrder.includes(route.item)) {
      fromFac.exportOrder = [...(fromFac.exportOrder ?? []), route.item];
    }
    if (!toFac.importOrder.includes(route.item)) {
      toFac.importOrder = [...(toFac.importOrder ?? []), route.item];
    }
  });

  world.routes = keepRoutes;

  world.factories.forEach((factory) => {
    const baseline = parseBaseline(factory.baseline);
    const outbound = baseline.routes.filter((r) => {
      const type = routeToStationType(r.t);
      return !type;
    });
    const ownedStations = (world.stations ?? []).filter((s) => s.homeFactoryId === factory.id);
    factory.baseline = JSON.stringify({
      ...baseline,
      routes: outbound,
      stations: JSON.parse(JSON.stringify(ownedStations)),
    });
  });
}

/** Ensure world uses stations for Train/Truck/Drone links (templates + legacy loads). */
export function normalizeWorldLogistics(world: World): void {
  migrateRoutesToStations(world);
}

/** v6 → v7: stations/vehicles; migrate Train/Truck/Drone routes. */
function migrateV6ToV7(obj: Record<string, unknown>): Record<string, unknown> {
  const worlds = Array.isArray(obj.worlds)
    ? obj.worlds.map((w) => {
        if (w === null || typeof w !== 'object') return w;
        const world = w as Record<string, unknown>;
        const factories = Array.isArray(world.factories)
          ? world.factories.map((f) => {
              if (f === null || typeof f !== 'object') return f;
              const factory = f as Record<string, unknown>;
              return {
                ...factory,
                stationSeq: typeof factory.stationSeq === 'number' ? factory.stationSeq : 0,
              };
            })
          : world.factories;
        const nextWorld = {
          ...world,
          factories,
          stations: Array.isArray(world.stations) ? world.stations : [],
        } as World;
        migrateRoutesToStations(nextWorld);
        return nextWorld;
      })
    : obj.worlds;
  return { ...obj, schemaVersion: SCHEMA_VERSION, worlds };
}
