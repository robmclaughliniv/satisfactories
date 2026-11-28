import * as Comlink from 'comlink';
import { reviveError } from './errors';
import type { SnapshotEngine } from './worker/engine';
import type { StoreStatus } from './types';

type Promisified<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R ? (...args: A) => Promise<Awaited<R>> : never;
};

type EngineApi = Promisified<Omit<SnapshotEngine, 'status' | 'debugQuery'>>;

export type SnapshotStore = EngineApi & {
  /** VFS state from the worker plus `navigator.storage` state from this thread. */
  status(): Promise<StoreStatus>;
  /**
   * `navigator.storage.persist()`. Runs on the main thread because `persist()` is
   * not exposed in workers. Never called automatically.
   */
  requestPersist(): Promise<boolean | null>;
  /** Dev builds only. Rejects in production. */
  debugQuery(sql: string, bind?: unknown[]): Promise<Record<string, unknown>[]>;
  /** True once the worker has been created (the store starts lazily). */
  readonly started: boolean;
  /** Close the DB and stop the worker. The next call starts a fresh one. */
  terminate(): Promise<void>;
};

export type CreateStoreOptions = {
  /** Override how the worker is created (tests, custom bundling). */
  createWorker?: () => Worker;
};

function defaultWorker(): Worker {
  return new Worker(new URL('./worker/snapshot.worker.ts', import.meta.url), {
    type: 'module',
    name: 'satisfactories-snapshot',
  });
}

async function storageState(): Promise<Pick<StoreStatus, 'storagePersisted' | 'estimate'>> {
  const storage = typeof navigator !== 'undefined' ? navigator.storage : undefined;
  const [persisted, estimate] = await Promise.all([
    storage?.persisted ? storage.persisted().catch(() => null) : Promise.resolve(null),
    storage?.estimate ? storage.estimate().catch(() => null) : Promise.resolve(null),
  ]);
  return {
    storagePersisted: persisted,
    estimate: estimate ? { usage: estimate.usage, quota: estimate.quota } : null,
  };
}

const ENGINE_METHODS = [
  'listWorlds',
  'deleteWorld',
  'open',
  'close',
  'writeSnapshot',
  'getCurrentSnapshot',
  'getPreviousSnapshot',
  'listSnapshots',
  'countByCategory',
  'tableCounts',
  'buildablesInBBox',
  'buildablesByKeys',
  'edgesTouching',
  'foundationTilesInBBox',
] as const satisfies readonly (keyof EngineApi)[];

/**
 * Main-thread handle to the snapshot store. Creating it is free: the worker, the
 * WASM module and the OPFS pool start on the first method call.
 */
export function createSnapshotStore(opts: CreateStoreOptions = {}): SnapshotStore {
  let worker: Worker | null = null;
  let remote: Comlink.Remote<SnapshotEngine> | null = null;

  function getRemote(): Comlink.Remote<SnapshotEngine> {
    if (!remote) {
      worker = (opts.createWorker ?? defaultWorker)();
      remote = Comlink.wrap<SnapshotEngine>(worker);
    }
    return remote;
  }

  async function call<T>(fn: (r: Comlink.Remote<SnapshotEngine>) => Promise<T>): Promise<T> {
    try {
      return await fn(getRemote());
    } catch (err) {
      throw reviveError(err);
    }
  }

  const extras = {
    async status(): Promise<StoreStatus> {
      const [vfs, storage] = await Promise.all([call((r) => r.status()), storageState()]);
      return { ...vfs, ...storage };
    },
    async requestPersist(): Promise<boolean | null> {
      if (typeof navigator === 'undefined' || !navigator.storage?.persist) return null;
      return navigator.storage.persist();
    },
    async debugQuery(sql: string, bind: unknown[] = []) {
      if (!import.meta.env.DEV) throw new Error('debugQuery is only available in dev builds');
      return call((r) => r.debugQuery(sql, bind));
    },
    get started() {
      return worker !== null;
    },
    async terminate() {
      if (!remote || !worker) return;
      try {
        await remote.close();
      } catch {
        // worker may already be gone
      }
      remote[Comlink.releaseProxy]();
      worker.terminate();
      worker = null;
      remote = null;
    },
  };

  // Add the forwarded engine methods without Object.assign, which would freeze the `started` getter.
  const store = extras as typeof extras & EngineApi;
  for (const m of ENGINE_METHODS) {
    (store as unknown as Record<string, unknown>)[m] = (...args: unknown[]) =>
      call((r) => (r[m] as unknown as (...a: unknown[]) => Promise<unknown>)(...args));
  }
  return store;
}
