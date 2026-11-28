import { migratePersisted } from './migrations';
import type { RecipeLookup } from './production';
import { SCHEMA_VERSION, type PersistedStateV2, type World } from './schema';

export interface BackupSource {
  worlds: World[];
  worldId: string | null;
  favItems: string[];
  favFactories: string[];
}

export function buildBackupEnvelope(source: BackupSource): PersistedStateV2 {
  return {
    schemaVersion: SCHEMA_VERSION,
    worlds: source.worlds,
    worldId: source.worldId,
    favItems: source.favItems,
    favFactories: source.favFactories,
  };
}

export function defaultBackupFilename(): string {
  const date = new Date().toISOString().slice(0, 10);
  return `satisfactories-backup-${date}.json`;
}

export function serializeBackup(envelope: PersistedStateV2): string {
  return JSON.stringify(envelope, null, 2);
}

export function parseBackupJson(parsed: unknown, recipes: RecipeLookup): PersistedStateV2 {
  const migrated = migratePersisted(parsed, recipes);
  if (!migrated) {
    throw new Error('Could not read backup file — unrecognized or unsupported format.');
  }
  return migrated;
}

export function parseBackup(text: string, recipes: RecipeLookup): PersistedStateV2 {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Could not read backup file — invalid JSON.');
  }
  return parseBackupJson(parsed, recipes);
}