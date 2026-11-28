# Maintainer guide

Follow the [README setup](../README.md#development) to run the app. The
[production guide](production-lines.md) documents the user workflow, rates,
and save compatibility.

## Code map

| Area | Entry points |
| --- | --- |
| App and persistence | `apps/web/src/App.tsx` mounts screens and shared modals. `apps/web/src/state/store.tsx` handles navigation, active-world changes, and browser storage. |
| Factory editor | `apps/web/src/components/screens/FactoryScreen.tsx` composes `LineEditor.tsx` and `ProductionLineConnections.tsx` under `apps/web/src/components/`. The claim dialog lives in `apps/web/src/components/modals/InputSupplyModal.tsx`. |
| Production and rollups | Under `apps/web/src/state/`, `lineFeeds.ts` calculates effective line rates and deliveries, `inputSupply.ts` validates claims, and `derive.ts` computes aggregates and world rollups. |
| Logistics and map | `apps/web/src/model/logistics.ts` calculates shipments. `apps/web/src/state/flows.ts` and `apps/web/src/model/mapConnections.ts` assemble sidebar and map data. `apps/web/src/components/screens/MapScreen.tsx` and its sibling `useMapCamera.ts` handle map interactions. `apps/web/src/components/SplitLayout.tsx` and `apps/web/src/styles/global.css` handle shared layout. |
| Saves and sample worlds | Under `apps/web/src/model/`, `schema.ts` defines persisted data, `migrations.ts` upgrades it, `production.ts` converts legacy connections, `baseline.ts` manages factory snapshots, and `backup.ts` handles JSON files. `world.ts` initializes worlds from templates in `apps/web/src/data/templates/`. |
| Game reference | `apps/web/src/data/satisfactory-game-data.json` and `apps/web/src/data/gameData.ts` supply `apps/web/src/components/screens/ReferenceScreen.tsx`. Worlds persist recipe IDs. |

## Verify changes

Run `pnpm test` and `pnpm build`. The test script is
`scripts/check-line-feeds.mjs`. It exercises model and state code through Vite,
including allocation shortages, shared claims, shipment deduplication,
version 9 migration, sample initialization, and factory snapshots. Use the
browser for interaction and layout checks.

1. Load **Northern Stretch** from **Worlds** in a disposable browser profile
   or on a separate origin. In **Factories**, select **Cygnus Iron Foundry**
   twice to open it. Set **Iron Ingot 1** to four smelters, add a 120/min Iron
   Ore node with **+ Add local input** in the sidebar, then expand the line and claim 120/min.
2. Allocate 40/min of Iron Ingot to the Iron Plate line and export 60/min to
   **Polaris Copper Junction**. Verify 20/min surplus on the smelting line,
   40/min supplied on the plate line, and 60/min on both factory flows. Check
   that the connection appears on the map. Move the plate line to another
   category and verify the allocation follows it.
3. Commit the factory, then reduce the smelter count to two. Verify 40/min
   overallocation and zero delivery. Reset and verify that 20/min surplus
   and the committed deliveries return. For save changes, reload the browser and
   round-trip a JSON backup in the disposable profile.
4. For map and layout changes, check pin placement and route alignment after
   pan and zoom, sidebar resizing, and mobile stacking. For game data changes,
   check alternate recipes and recipes with multiple outputs.

For resource UI changes, open **Resources**, click an item to pin its sidebar,
then move across other cards and verify the selection stays highlighted. Search
for `copper` and check that the grid and expanded **Resource metrics** show the
same resources. Change metric, time range, filters, and sorting. Recipe rates
beneath each producing factory and the production share bars must reconcile
with effective output. Local node supply is included in factory production,
while the recipe share bar describes recipe output only.

The metrics accordion uses Recharts and stores world-wide rate snapshots on each
explicit factory commit. The selector shows the latest 10, 25, 50, 100, or all
commits in chronological order. Draft autosaves and reset do not create entries;
reset leaves history intact. History belongs to each world and is included in
local storage and JSON backups. Existing saves and new templates begin with an
empty history; past commits cannot be reconstructed. Snapshot metrics come from
`apps/web/src/state/resourceMetrics.ts` and use the same effective rates and configured
capacity as the resource cards. Current filters choose which resource series to
show; they never change saved snapshots.

Use `pnpm preview` to check the production build. If an old bundle appears,
check the production service worker before clearing site data.

## Troubleshoot browser storage

Check the origin if a save appears missing. `localhost`, `127.0.0.1`, and
different ports each have separate storage. The store tries
`satisfactories:v2` first and falls back to `satisfactories:v1`. These are
storage keys. The JSON envelope carries its own schema version.
