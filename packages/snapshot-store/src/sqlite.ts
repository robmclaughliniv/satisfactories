import type sqlite3InitModule from '@sqlite.org/sqlite-wasm';

/** The initialized sqlite-wasm module. */
export type Sqlite3 = Awaited<ReturnType<typeof sqlite3InitModule>>;
/** An `oo1` database handle (in-memory or `opfs-sahpool`). */
export type Db = InstanceType<Sqlite3['oo1']['DB']>;
/** The pool utility returned by `installOpfsSAHPoolVfs`. */
export type SahPoolUtil = Awaited<ReturnType<Sqlite3['installOpfsSAHPoolVfs']>>;
