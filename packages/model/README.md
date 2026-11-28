# @satisfactories/model

Persisted data types, Zod schemas, version migrations, and pure helpers for Satisfactories saves (localStorage envelope schema v10 and JSON backups). Step 3 adds **snapshot**, **decisions**, **drafts**, **commands**, and **export** contracts (schemas and pure functions only; no Dexie or app SQLite).

## Boundary

This package must **not** import from `apps/web`, React, browser APIs (`document`, `window`, `localStorage`, file pickers), or game reference JSON. Recipe naming during migration and template instantiation takes a `RecipeLookup` callback from the app. Line-feed delivery rates for factory allocations stay in the app (`shipments.ts`) until a later `packages/rules` extraction.

## Owns

### v10 (unchanged)

- Envelope and world/factory/logistics Zod schemas
- `migratePersisted` and per-version upgrade steps
- Factory baseline capture/apply
- World/template helpers
- Backup envelope build/serialize/parse (not browser file I/O)
- Station/vehicle logistics and map connection assembly (shipments passed in)

### Step 3 layers

- `SNAPSHOT_SCHEMA_VERSION`, `DECISIONS_SCHEMA_VERSION`, `EXPORT_FORMAT_VERSION`, command `v`
- Snapshot table Zod rows + [`sql/snapshot.sql`](sql/snapshot.sql)
- Decision/draft tables and `WorldDecisions`
- Command envelope, payloads, pure `apply()` / `replay()`
- Export envelope `buildExport` / `parseExport` + gzip codec interface
- Pure `v10ToDecisionsV1` (wired in app Step 5)

## PROVISIONAL snapshot tables

Finalize after parser spike round 2:

- `station`, `platform`, `vehicle`, `timetable_stop`, `drone_route`, `vehicle_route_station`, `map_marker`

Marked with `@provisional` in Zod sources and SQL comments.

## Foundation tiles (D3)

Individual foundations are **not** stored. `foundation_tile` holds 16 m × 16 m tile aggregates with 1 m Z buckets.

## Tests

- Column parity: Zod row keys vs `PRAGMA table_info` for each snapshot table
- SQLite: `@sqlite.org/sqlite-wasm` in Vitest (same family as production sqlite-wasm)
- R\*Tree: create + point query on `buildable_rtree`