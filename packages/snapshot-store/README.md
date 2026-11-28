# @satisfactories/snapshot-store

Browser-only store for parsed save-game snapshots. SQLite (official `@sqlite.org/sqlite-wasm`)
runs in a dedicated module worker on the `opfs-sahpool` VFS, so it needs no COOP/COEP headers
and no `SharedArrayBuffer`. The main thread talks to it through Comlink.

It depends on `@satisfactories/model` for the row Zod schemas, `SNAPSHOT_SCHEMA_VERSION` and
`sql/snapshot.sql`. (Spec §11 lists only `model` and `parser` as packages; this package was
added as an approved deviation.)

## Layout

```
src/
  index.ts              public exports (client, errors, synthetic generator, types)
  client.ts             createSnapshotStore(): lazy worker + Comlink proxy, storage.persist()
  errors.ts             SnapshotLockedError, SnapshotNotOpenError, reviveError()
  types.ts              SnapshotTables, BBox, StoreStatus, OpenResult, WriteTimings, ...
  columns.ts            table → column list derived from the model Zod schemas
  synthetic.ts          seeded synthetic snapshots (small / large presets)
  sqlite.ts             sqlite-wasm type aliases
  worker/
    snapshot.worker.ts  worker entry: sqlite3InitModule + installOpfsSAHPoolVfs + Comlink.expose
    engine.ts           all worker state: VFS install, open/close, lock + memory fallback
    db.ts               schema apply / version check, inserts, rotation, R*Tree rebuild
    queries.ts          read queries
```

## Lifecycle

- `createSnapshotStore()` is free. The worker, the WASM module and the OPFS pool start on the
  first method call, so the app's startup bundle and startup work are unchanged.
- One database per world: `/worlds/<encoded saveIdentifier>.sqlite3` inside the pool directory
  `/satisfactories-snapshots`. The identifier is `encodeURIComponent`-encoded (plus `!'()*~`), so
  only `[A-Za-z0-9._%-]` reach the file name.
- `open(saveIdentifier)` applies `snapshot.sql` to a new file and writes
  `meta.snapshot_schema_version`. If an existing file has a different version, every object is
  dropped and the schema is applied again; the result says `{ recreated: true }`.
- Connection pragmas: `journal_mode=DELETE`, `temp_store=MEMORY` (keeps temp files out of the
  pool), `foreign_keys=OFF` (the DDL declares none).

### Second tab

`opfs-sahpool` takes exclusive access handles, so only one tab can hold the pool. In the second
tab the VFS install fails with a lock error: `status()` reports `locked: true` and `open()`
rejects with `SnapshotLockedError`. The app shows a non-blocking banner. The tab must reload to
retry after the first tab closes.

### No OPFS

If the VFS can't be installed for any other reason, the store falls back to in-memory databases:
`status().persistent` and `open().persistent` are `false`, nothing throws, and the app shows a
banner. Data is lost when the worker stops.

## API (all async, via Comlink)

| Method | Notes |
| --- | --- |
| `status()` | VFS, persistent, locked, VFS error, SQLite version, open world, `storage.persisted()`, `storage.estimate()` |
| `listWorlds()` / `deleteWorld(id)` | Files in the pool / unlink the DB and its journal |
| `open(id)` / `close()` | One open world at a time |
| `writeSnapshot(snapshot, tables, { validate? })` | One transaction: prune the old previous, rotate current → previous, insert, rebuild the R*Tree. Zod validation defaults to on in dev only. Returns per-table timings. Rewriting the current snapshot's id replaces it in place. |
| `getCurrentSnapshot()` / `getPreviousSnapshot()` / `listSnapshots()` | |
| `countByCategory(snapshotId)` / `tableCounts(snapshotId)` | |
| `buildablesInBBox(snapshotId, bbox, categories?)` | R*Tree for production/extractor/generator/station/storage, range scan otherwise |
| `buildablesByKeys(snapshotId, keys)` | Chunked `IN` (500 keys) |
| `edgesTouching(snapshotId, buildableKeys)` | Edges whose from or to buildable is in the list |
| `foundationTilesInBBox(snapshotId, bbox)` | 16 m tiles |
| `requestPersist()` | `navigator.storage.persist()` on the main thread (not exposed in workers). Never called automatically. |
| `debugQuery(sql, bind)` | Dev builds only; rejects in production |
| `terminate()` | Close the DB and stop the worker |

## Tests

`pnpm --filter @satisfactories/snapshot-store test` runs Vitest in Node against the in-memory
fallback (schema apply, version-mismatch recreate, rotation and pruning, every query, synthetic
data passing Zod). The OPFS path is covered by the Playwright smoke test in `apps/web/e2e`.

## Caveats

- R*Tree ids are `buildable` rowids. `VACUUM` could renumber them; the store only vacuums when it
  drops everything during a recreate.
- sqlite-wasm's npm package also emits `sqlite3-worker1-bundler-friendly` and
  `sqlite3-opfs-async-proxy` assets that this store never loads.
