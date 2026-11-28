# Step 3 Schema Design — data layers, commands, export

**Status:** APPROVED 2026-11-28 (D1–D5 as recommended, with D3 revised to `foundation_tile` aggregates). Handoff: `claude/handoff-step3-layer-schemas.md`.
**Date:** 2026-11-28
**Lives in:** `packages/model` (Zod + TS), plus `packages/model/sql/snapshot.sql` (SQLite DDL)
**Builds on:** `save-file-import-spec.md` §2–§10, `bridge-plan.md` (strangler Phase 1), decisions log 2026-11-27 amendments, `spike-report-round1.md`

---

## 0. Design rules

1. **Each layer has its own version number and its own migrations.** `SNAPSHOT_SCHEMA_VERSION`, `DECISIONS_SCHEMA_VERSION`, `EXPORT_FORMAT_VERSION`, and a per-command `v`.
2. **The snapshot can be thrown away.** If a snapshot schema change gets awkward, drop the DB and re-parse. Snapshot migrations are optional; decision migrations are mandatory.
3. **Units are fixed everywhere:** positions in **game cm**, rates in **items/min** (fluids in **m³/min**), power in **MW**, clock as a **fraction** (1.0 = 100%, max 2.5).
4. **Class identity = short class name** (the segment after the last `.`), e.g. `Build_ConstructorMk1_C`, `Recipe_IronPlate_C`, `Desc_OreGold_C`. Keep the full path alongside for debugging. *(Depends on amendment 2: the reference data gets class-name keys before Step 6.)*
5. **Zod is the source of truth for TS types.** The SQL DDL is hand-written next to it, and a test checks that each snapshot Zod row schema and its SQL table have the same columns.
6. ⚠️ **PROVISIONAL** marks tables built on fields the parser test hasn't confirmed yet. They're expected to change after spike round 2.

---

## 1. Game snapshot (SQLite-WASM, `opfs-sahpool`, one DB per `SaveIdentifier`)

Every table has `snapshot_id`. **Keep the current and previous snapshots** (for diffing on re-import) and delete anything older.

### 1.1 Bookkeeping
| Table | Columns | Notes |
|---|---|---|
| `meta` | `key` PK, `value` | `snapshot_schema_version`, `parser_version`, `reference_dataset_id` |
| `snapshot` | `id` PK, `imported_at`, `save_identifier`, `session_name`, `save_name`, `header_version`, `save_version`, `build_version`, `save_data_hash`, `file_size`, `file_mtime`, `play_seconds`, `save_datetime`, `is_creative`, `has_mods`, `parse_ms`, `warning_count`, `partial_count`, `status` (`current`/`previous`) | One row per import |
| `unknown_object` | `snapshot_id`, `key`, `class_path`, `reason` (`raw_bytes`/`trailing_data`/`unknown_class`) | Feeds an "import health" panel. The spike found many trailing-data objects |

### 1.2 Buildings — firm (confirmed in round 1)
**`buildable`**: one row per placed actor (machines, logistics, stations, storage, power, vehicles).
| Column | Type | Notes |
|---|---|---|
| `snapshot_id`, `key` | PK | `key` = actor instance name, e.g. `Persistent_Level:PersistentLevel.Build_ManufacturerMk1_C_2147435846` |
| `class_short`, `class_path` | text | |
| `category` | enum | `production`, `extractor`, `generator`, `logistics`, `station`, `storage`, `power`, `vehicle`, `other` (derived from class at import) |
| `x`, `y`, `z` | real (cm) | |
| `qx`, `qy`, `qz`, `qw` | real | Rotation quaternion |
| `recipe_short` | text null | From `mCurrentRecipe` |
| `clock` | real null | From the potential component |
| `production_boost` | real null | `mCurrentProductionBoost` (somersloop amplification) |
| `shards` | int null | Count in the potential inventory |
| `partial` | bool | True if the object had trailing data or raw bytes |

**`buildable_rtree`**: an R*Tree over (x, y) for `production`/`extractor`/`generator`/`station`/`storage`, so point-in-polygon prefiltering is fast. It maps by integer rowid to `buildable`.

**`foundation_tile`**: an *aggregate* of foundations and floors from `FGLightweightBuildableSubsystem`. **Individual foundations are not stored.** *(Revised 2026-11-28, D3.)*
`snapshot_id`, `tile_x`, `tile_y` (16 m tiles), `z_bucket` (1 m), `count`. PK = (snapshot_id, tile_x, tile_y, z_bucket).
- Built in the parse worker during import. Walls, beams, ramps and other architecture are counted in `snapshot.partial_count`/stats only and never stored as rows.
- Used for floor detection (a Z histogram inside a factory polygon) and coarse foundation-connectivity suggestions (adjacent tiles).
- Rationale: megabases can have hundreds of thousands of foundations. Storing each one is heavy on the snapshot DB, on both kept snapshots, on the export file and on import time, and buys nothing the features need. If exact positions are ever needed, re-derive them from the cached raw `.sav`.

**`component`**: ports and inventories on buildables.
`snapshot_id`, `key`, `parent_key`, `class_short`, `kind` (`conveyor_port`, `pipe_port`, `inventory`, `potential`, `power`, `other`), `port_name` (e.g. `Input0`, `Output0`, `ConveyorAny1`).

**`edge`**: resolved physical connections (from `mConnectedComponent`).
`snapshot_id`, `from_component`, `to_component`, `from_buildable`, `to_buildable`, `medium` (`belt`/`pipe`/`power`), `direction_known` (bool). Belts are directional (output → input). Where direction can't be read, it's inferred later by the rules.

**`inventory_item`**: `snapshot_id`, `buildable_key`, `role` (`input`/`output`/`storage`/`fuel`/`potential`), `slot`, `item_short`, `count`.

**`resource_node`**: `snapshot_id`, `key`, `resource_short`, `purity` (`impure`/`normal`/`pure`, game-mode overrides included), `x`, `y`, `z`, `extractor_key` null.

### 1.3 Transport — ⚠️ PROVISIONAL (finalize after spike round 2)
| Table | Columns |
|---|---|
| `station` | `snapshot_id`, `key`, `buildable_key`, `type` (`train`/`truck`/`drone`), `name` |
| `platform` | `snapshot_id`, `key`, `station_key`, `index`, `medium` (`solid`/`fluid`), `mode` (`load`/`unload`/`unknown`) |
| `vehicle` | `snapshot_id`, `key`, `type` (`train`/`truck`/`fluid_truck`/`drone`), `name` |
| `timetable_stop` | `snapshot_id`, `vehicle_key`, `seq`, `station_key`, `rules_json` |
| `drone_route` | `snapshot_id`, `port_key`, `destination_port_key` |
| `vehicle_route_station` | `snapshot_id`, `vehicle_key`, `seq`, `station_key`, `inferred` (bool; trucks are inferred from the recorded path) |
| `map_marker` | `snapshot_id`, `id`, `name`, `x`, `y`, `z`, `icon` (nice-to-have; round 1 didn't find markers) |

---

## 2. Decisions (Dexie / IndexedDB, a single DB `satisfactories-decisions`, keyed by `world_id`)

**Strangler rule:** during Phase 1 the manual UI keeps working. Each world's existing v10 `World` object is stored **as-is** in `manual_world`, validated by the existing v10 Zod schema. The manual model doesn't get redesigned now. New save-driven decisions sit next to it, and the manual model retires piece by piece as derived data replaces it.

| Table | Key | Fields |
|---|---|---|
| `world` | `id` | `name`, `save_identifier` null (set when a `.sav` is linked), `reference_dataset_id`, `origin` (`manual`/`save`), `created_at`, `updated_at` |
| `manual_world` | `world_id` | `data` (v10 `World`, unchanged). **Legacy; read and written by the existing manual editors** |
| `factory` | `id` | `world_id`, `name`, `color`, `status`, `tier`, `tagline`, `tags[]`, `cover`, `notes`, `polygon` (`{x,y}[]` in cm, or null), `legacy_pin_percent` (`{x,y}` or null), `floor_settings` (`{mode:'auto'}` or `{mode:'manual', base_z_cm, floor_height_cm}`), `favorite_items[]`, `import_order[]`, `export_order[]`, timestamps |
| `membership_override` | `id` | `world_id`, `factory_id`, `machine_key`, `kind` (`include`/`exclude`) |
| `line` | `id` | `world_id`, `factory_id`, `name`, `section_label` (carries old "sections" forward), `recipe_short`, `member_keys[]` (as of the last confirm), `signature` (`{recipe_short, input_endpoints[], output_endpoints[]}`), `status` (`confirmed`/`archived`), `notes` |
| `line_override` | `id` | `world_id`, `machine_key`, `line_id`, `kind` (`assign`/`exclude`) |
| `link` | `id` | `world_id`, `from` (`{kind:'line'|'factory'|'station', id}`), `to` (same shape), `item_short`, `medium` (`belt`/`pipe`/`train`/`truck`/`drone`), `via_vehicle_key` null, `rate_override` null, `status` (`confirmed`/`rejected`) |
| `storage_role` | `id` | `world_id`, `machine_key`, `role` (`pass_through`/`endpoint`) |
| `audit_dismissal` | `id` | `world_id`, `fingerprint`, `dismissed_at` |
| `favorites` | `world_id` null = global | `items[]`, `factories[]` |
| `metric_history` | `id` | `world_id`, `factory_id`, `saved_at`, `values` (from v10 `resourceMetricHistory`) |
| `command_log` | `seq` (auto) | `world_id`, `command` (full envelope, §4) |
| `draft` | `id` | `world_id`, `name`, `created_at`, `based_on_snapshot` (save_data_hash or null), `decisions` (a full copy of every decision table for that world, `manual_world` included) |

**Drafts are full copies, not command replays.** That's robust to future command-schema changes, and the size is small (decisions only, no game data).

---

## 3. Derived view types (in TS only, never stored)

Shape only. The rules that compute these live in `packages/rules`.
- `FactoryView`: factory + member machine keys + floors + rates.
- `LineSuggestion`: `{fingerprint, recipe_short, member_keys, input_manifold, output_manifold, matched_line_id?, overlap}`.
- `LinkSuggestion`: `{fingerprint, from, to, item_short, medium, via?, estimated_rate}`.
- `AuditItem`: `{fingerprint, world_id, factory_id?, type, refs, message}`, where `type` is one of:
  `unassigned_machine`, `orphaned_override`, `line_split`, `lines_merged`, `line_unmatched`, `line_empty`, `unwired_machine`, `ambiguous_storage`, `link_unconfirmed`.
  The `fingerprint` is stable across re-imports, so a dismissal stays dismissed.

---

## 4. Commands (the write contract)

**Envelope:** `{ id: uuid, name, v: number, world_id, at: ISO, payload }`
**Rules:**
- Every write goes through `apply(decisions, command) → decisions`. It's a pure function, and each payload is validated by Zod.
- Commands are appended to `command_log` once they apply successfully. **Undo** = restore the latest checkpoint and replay up to N−1. Checkpoints are taken every 50 commands and on every `saveDraft`.
- New code **must** write through commands. Existing `mutateWorld` call sites are wrapped in `legacyMutation`, and each gets replaced by a real command over time.

| Group | Commands |
|---|---|
| World | `createWorld`, `renameWorld`, `linkSave {save_identifier}`, `deleteWorld` |
| Factory | `createFactory`, `updateFactoryMeta`, `drawFactoryShape {points}`, `editFactoryShape {points}`, `clearFactoryShape`, `setFloorSettings`, `deleteFactory` |
| Membership | `includeMachine`, `excludeMachine`, `clearMachineOverride` |
| Lines | `confirmLine {suggestion_fingerprint, name, member_keys, signature}`, `renameLine`, `splitLine {line_id, keys_a, keys_b}`, `mergeLines {line_ids}`, `assignMachineToLine`, `removeMachineFromLine`, `archiveLine` |
| Links | `confirmLink {suggestion_fingerprint, …}`, `rejectLink`, `setLinkRateOverride` |
| Storage | `setStorageRole` |
| Audit | `dismissAuditItem {fingerprint}`, `undismissAuditItem` |
| Drafts | `saveDraft {name}`, `restoreDraft {draft_id}` (also a logged command), `deleteDraft` |
| Favorites | `toggleFavoriteItem`, `toggleFavoriteFactory` |
| Legacy | `legacyMutation {description, before_hash, after: World}`, which records the v10 `World` after the change, so the log stays complete during the strangler phase |

---

## 5. Export envelope (`.satisfactories.json.gz`)

```ts
{
  format: "satisfactories-export",
  exportVersion: 1,
  appVersion: string,
  exportedAt: string,           // ISO
  reference: { datasetId: string },
  worlds: Array<{
    world: World,                // decisions.world row
    decisions: { …every decision table for this world… },
    drafts: Draft[],
    snapshot: { tables: Record<tableName, Row[]>, snapshot: SnapshotRow } | null,  // current snapshot only
  }>
}
```
- Gzipped with `CompressionStream('gzip')`.
- **Importing an export replaces everything**, after a confirmation prompt.
- **Importing a `.sav` replaces only the snapshot**, then the app reconciles.
- **v10 backup files (`satisfactories-backup-*.json`) stay importable.** They're migrated into `world` + `manual_world` + `factory` (metadata only) + `favorites` + `metric_history`.

---

## 6. Migrations
- **Decisions:** `migrations/decisions/vN_to_vN+1.ts`. Each one is pure, tested with test data, and runs inside one Dexie upgrade transaction.
- **v10 → decisions v1** is the Step 5 one-time migration. It copies localStorage into Dexie, and the `satisfactories:v2` key stays as a fallback (amendment 3). That migration's code is defined in Step 3, tested in Step 3, and runs in Step 5.
- **Snapshot:** when the version changes, drop and re-import (or re-parse the cached raw `.sav`, if spec §14 decides to keep one).
- **Export:** an `exportVersion` check plus an upgrader chain. Never reject an older export file.

---

## 7. Step 3 acceptance criteria
- [ ] Zod schemas + types for every table in §1–§2, the command envelope, every command payload in §4, and the export envelope in §5
- [ ] `snapshot.sql` applies cleanly to an in-memory SQLite (`better-sqlite3` or `sql.js` in tests). The column-parity test passes
- [ ] `apply()` reducer implemented for every command except `legacyMutation`, which is just stored. A unit test exists per command
- [ ] A v10 → decisions-v1 migration function, tested against Northern Stretch and against v8/v9/v10 test data
- [ ] Export build + parse round-trip test (with and without a snapshot)
- [ ] PROVISIONAL tables flagged in code comments and in `packages/model/README.md`
- [ ] No runtime wiring: no Dexie or SQLite in the app yet, and no UI changes

---

## 8. Decisions needed from Rob
| # | Question | Recommendation |
|---|---|---|
| D1 | Drafts as **full decision copies** or as **command replays**? | Full copies |
| D2 | How many snapshots to keep? | **Current + previous** (enough to diff) |
| D3 | Store **every foundation's position** (could be 100k+ rows) or only height summaries? | **Revised:** store only `foundation_tile` aggregates (16 m tiles × 1 m height buckets). Individual foundations aren't stored |
| D4 | Keep the manual model as the **embedded v10 `World`** during the strangler phase? | Yes. It avoids redesigning code that's being retired |
| D5 | Undo depth | Unlimited through the log, plus checkpoints every 50 commands |