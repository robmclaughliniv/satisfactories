import { PersistedStateSchema, SCHEMA_VERSION, type PersistedStateV2 } from './schema';

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
  return { ...obj, schemaVersion: SCHEMA_VERSION, worlds };
}
