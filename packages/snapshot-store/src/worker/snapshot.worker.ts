import * as Comlink from 'comlink';
import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import ddl from '@satisfactories/model/sql/snapshot.sql?raw';
import { createEngine } from './engine';

// The only module that owns SQLite. Everything runs inside this dedicated worker,
// because opfs-sahpool needs FileSystemSyncAccessHandle (worker-only). No
// SharedArrayBuffer, so no COOP/COEP headers are needed.
const engine = createEngine({
  ddl,
  devValidate: import.meta.env.DEV,
  allowDebugQuery: import.meta.env.DEV,
  loadSqlite: () =>
    sqlite3InitModule({
      print: () => {},
      printErr: (...args: unknown[]) => console.warn('[sqlite]', ...args),
    }),
  installPool: (sqlite3) =>
    sqlite3.installOpfsSAHPoolVfs({
      name: 'opfs-sahpool',
      directory: '/satisfactories-snapshots',
      initialCapacity: 6,
    }),
});

Comlink.expose(engine);
