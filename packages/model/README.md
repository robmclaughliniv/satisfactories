# @satisfactories/model

Persisted data types, Zod schemas, version migrations, and pure helpers for Satisfactories saves (localStorage envelope schema v10 and JSON backups).

## Boundary

This package must **not** import from `apps/web`, React, browser APIs (`document`, `window`, `localStorage`, file pickers), or game reference JSON. Recipe naming during migration and template instantiation takes a `RecipeLookup` callback from the app. Line-feed delivery rates for factory allocations stay in the app (`shipments.ts`) until a later `packages/rules` extraction.

## Owns

- Envelope and world/factory/logistics Zod schemas
- `migratePersisted` and per-version upgrade steps
- Factory baseline capture/apply
- World/template helpers
- Backup envelope build/serialize/parse (not browser file I/O)
- Station/vehicle logistics and map connection assembly (shipments passed in)