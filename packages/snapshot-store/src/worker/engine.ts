import { SNAPSHOT_SCHEMA_VERSION } from '@satisfactories/model';
import { SNAPSHOT_DATA_TABLES } from '../columns';
import { SnapshotLockedError, SnapshotNotOpenError } from '../errors';
import type { Db, SahPoolUtil, Sqlite3 } from '../sqlite';
import type {
  BBox,
  BuildableCategory,
  OpenResult,
  SnapshotInput,
  SnapshotTables,
  StoreStatus,
  WorldInfo,
  WriteOptions,
} from '../types';
import { configureConnection, ensureSchema, writeSnapshot } from './db';
import * as q from './queries';

export const WORLD_DIR = '/worlds/';
export const WORLD_EXT = '.sqlite3';

/** Encode a `SaveIdentifier` so it is safe as a file name: only `[A-Za-z0-9._-]` and `%XX`. */
export function encodeWorldName(saveIdentifier: string): string {
  if (!saveIdentifier) throw new Error('saveIdentifier must be a non-empty string');
  return encodeURIComponent(saveIdentifier).replace(/[!'()*~]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

export function worldPath(saveIdentifier: string): string {
  return `${WORLD_DIR}${encodeWorldName(saveIdentifier)}${WORLD_EXT}`;
}

export function worldFromPath(path: string): string | null {
  if (!path.startsWith(WORLD_DIR) || !path.endsWith(WORLD_EXT)) return null;
  const enc = path.slice(WORLD_DIR.length, -WORLD_EXT.length);
  if (enc.includes('/')) return null;
  try {
    return decodeURIComponent(enc);
  } catch {
    return null;
  }
}

/** Errors that mean "another context holds the pool" rather than "OPFS is unsupported". */
export function isLockError(err: unknown): boolean {
  const e = err as { name?: string; message?: string } | null;
  if (!e) return false;
  if (e.name === 'NoModificationAllowedError') return true;
  return /access handle|another open|locked|in use/i.test(String(e.message ?? ''));
}

export type EngineDeps = {
  loadSqlite: () => Promise<Sqlite3>;
  /** Install `opfs-sahpool`. Omit (or throw) to run on the in-memory fallback. */
  installPool?: (sqlite3: Sqlite3) => Promise<SahPoolUtil>;
  ddl: string;
  /** Default for `writeSnapshot` validation. */
  devValidate: boolean;
  /** Allow `debugQuery` (dev builds only). */
  allowDebugQuery: boolean;
  schemaVersion?: number;
};

type Open = { saveIdentifier: string; path: string; db: Db };

/**
 * Worker-side store state. The only code that touches SQLite. Exposed over Comlink by
 * `snapshot.worker.ts`; in tests it runs directly in Node on the in-memory fallback.
 */
export function createEngine(deps: EngineDeps) {
  const version = deps.schemaVersion ?? SNAPSHOT_SCHEMA_VERSION;
  let sqlite3: Sqlite3 | null = null;
  let pool: SahPoolUtil | null = null;
  let locked = false;
  let vfsError: string | null = null;
  let ready: Promise<void> | null = null;
  let current: Open | null = null;
  /** In-memory fallback keeps each world's DB for the worker's lifetime so close/open round-trips work. */
  const memoryDbs = new Map<string, Db>();

  function init(): Promise<void> {
    ready ??= (async () => {
      sqlite3 = await deps.loadSqlite();
      if (!deps.installPool) {
        vfsError = 'opfs-sahpool not attempted';
        return;
      }
      try {
        pool = await deps.installPool(sqlite3);
      } catch (err) {
        pool = null;
        locked = isLockError(err);
        vfsError = `${(err as Error)?.name ?? 'Error'}: ${(err as Error)?.message ?? String(err)}`;
      }
    })();
    return ready;
  }

  function need(): Open {
    if (!current) throw new SnapshotNotOpenError();
    return current;
  }

  async function ensureCapacity(): Promise<void> {
    if (!pool) return;
    // Docs: capacity must be at least twice the number of DB files (journals take slots).
    const dbFiles = pool.getFileNames().filter((n) => n.endsWith(WORLD_EXT)).length;
    await pool.reserveMinimumCapacity(2 * (dbFiles + 1) + 2);
  }

  function closeCurrent(): void {
    if (!current) return;
    if (pool) current.db.close();
    current = null;
  }

  // Serialize calls: open/close/write must never interleave across awaits.
  let chain: Promise<unknown> = Promise.resolve();
  function serial<A extends unknown[], R>(fn: (...args: A) => Promise<R>): (...args: A) => Promise<R> {
    return (...args: A) => {
      const run = chain.then(() => fn(...args));
      chain = run.catch(() => undefined);
      return run;
    };
  }

  const methods = {
    async status(): Promise<Omit<StoreStatus, 'storagePersisted' | 'estimate'>> {
      await init();
      return {
        vfs: pool ? 'opfs-sahpool' : locked ? 'opfs-sahpool' : 'memory',
        persistent: !!pool || locked,
        locked,
        vfsError,
        sqliteVersion: sqlite3!.version.libVersion,
        openWorld: current?.saveIdentifier ?? null,
      };
    },

    async listWorlds(): Promise<WorldInfo[]> {
      await init();
      if (locked) throw new SnapshotLockedError();
      if (pool) {
        return pool
          .getFileNames()
          .map((path) => ({ path, saveIdentifier: worldFromPath(path) }))
          .filter((w): w is WorldInfo => w.saveIdentifier !== null)
          .sort((a, b) => a.saveIdentifier.localeCompare(b.saveIdentifier));
      }
      return [...memoryDbs.keys()].sort().map((id) => ({ saveIdentifier: id, path: worldPath(id) }));
    },

    async deleteWorld(saveIdentifier: string): Promise<boolean> {
      await init();
      if (locked) throw new SnapshotLockedError();
      const path = worldPath(saveIdentifier);
      if (current?.saveIdentifier === saveIdentifier) closeCurrent();
      if (pool) {
        const existed = pool.getFileNames().includes(path);
        pool.unlink(path);
        pool.unlink(`${path}-journal`);
        return existed;
      }
      const db = memoryDbs.get(saveIdentifier);
      db?.close();
      return memoryDbs.delete(saveIdentifier);
    },

    async open(saveIdentifier: string): Promise<OpenResult> {
      await init();
      if (locked) throw new SnapshotLockedError();
      const path = worldPath(saveIdentifier);
      closeCurrent();
      let db: Db;
      if (pool) {
        await ensureCapacity();
        db = new pool.OpfsSAHPoolDb(path);
      } else {
        db = memoryDbs.get(saveIdentifier) ?? new sqlite3!.oo1.DB(':memory:', 'c');
        memoryDbs.set(saveIdentifier, db);
      }
      try {
        configureConnection(db);
        const schema = ensureSchema(db, deps.ddl, version);
        current = { saveIdentifier, path, db };
        return { saveIdentifier, persistent: !!pool, created: schema.created, recreated: schema.recreated };
      } catch (err) {
        if (pool) db.close();
        throw err;
      }
    },

    async close(): Promise<void> {
      closeCurrent();
    },

    async writeSnapshot(snapshot: SnapshotInput, tables: SnapshotTables, opts: WriteOptions = {}) {
      const { db } = need();
      return writeSnapshot(db, snapshot, tables, { validate: opts.validate ?? deps.devValidate });
    },

    async getCurrentSnapshot() {
      return q.getSnapshotByStatus(need().db, 'current');
    },

    async getPreviousSnapshot() {
      return q.getSnapshotByStatus(need().db, 'previous');
    },

    async listSnapshots() {
      return q.listSnapshots(need().db);
    },

    async countByCategory(snapshotId: string) {
      return q.countByCategory(need().db, snapshotId);
    },

    async tableCounts(snapshotId: string) {
      return q.tableCounts(need().db, snapshotId, SNAPSHOT_DATA_TABLES);
    },

    async buildablesInBBox(snapshotId: string, bbox: BBox, categories?: BuildableCategory[]) {
      return q.buildablesInBBox(need().db, snapshotId, bbox, categories);
    },

    async buildablesByKeys(snapshotId: string, keys: string[]) {
      return q.buildablesByKeys(need().db, snapshotId, keys);
    },

    async edgesTouching(snapshotId: string, buildableKeys: string[]) {
      return q.edgesTouching(need().db, snapshotId, buildableKeys);
    },

    async foundationTilesInBBox(snapshotId: string, bbox: BBox) {
      return q.foundationTilesInBBox(need().db, snapshotId, bbox);
    },

    /** Dev builds only: run arbitrary SQL against the open world. */
    async debugQuery(sql: string, bind: unknown[] = []): Promise<Record<string, unknown>[]> {
      if (!deps.allowDebugQuery) throw new Error('debugQuery is only available in dev builds');
      return need().db.selectObjects(sql, bind as never) as Record<string, unknown>[];
    },
  };
  const api = {} as { [K in keyof typeof methods]: (typeof methods)[K] };
  for (const key of Object.keys(methods) as (keyof typeof methods)[]) {
    (api as Record<string, unknown>)[key] = serial(methods[key] as (...a: unknown[]) => Promise<unknown>);
  }
  return api;
}

export type SnapshotEngine = ReturnType<typeof createEngine>;
