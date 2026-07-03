import { PersistedStateSchema, SCHEMA_VERSION, type PersistedStateV2 } from './schema';

/**
 * Turn raw persisted JSON (any version) into a valid PersistedStateV2,
 * or null if the data is unrecoverable — boot then falls back to the
 * empty state instead of crashing.
 */
export function migratePersisted(raw: unknown): PersistedStateV2 | null {
  if (raw === null || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;

  const candidate =
    obj.schemaVersion === SCHEMA_VERSION ? obj : migrateLegacyV1(obj);
  if (!candidate) return null;

  const parsed = PersistedStateSchema.safeParse(candidate);
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
    schemaVersion: SCHEMA_VERSION,
    worlds,
    worldId: typeof obj.worldId === 'string' ? obj.worldId : firstId,
    favItems: Array.isArray(obj.favItems) ? obj.favItems : [],
  };
}
