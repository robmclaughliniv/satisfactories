# Maintainer guide

This is a client-side React/Vite app. `src/App.tsx` mounts screens and shared
modals; `src/state/store.tsx` owns navigation, active-world mutations, and
persistence. Start with the module for the behavior you are changing.

| Area | Start here | What to verify |
| --- | --- | --- |
| Factory detail | `FactoryScreen.tsx`, `FactoryInputPool.tsx`, `LineEditor.tsx`, `ProductionLineConnections.tsx`, and `modals/InputSupplyModal.tsx` under `src/components/` | Create a factory-owned input, claim it from two lines, move a line across categories, and edit an allocation. Check the center pane and sidebar on desktop and mobile. |
| Production and resource math | `src/state/lineFeeds.ts` computes actual line rates and deliveries; `inputSupply.ts` validates claims; `derive.ts` exposes aggregate and rollup views. | Keep requested, actual, and remaining rates distinct. Check shortages and byproducts independently by item. |
| Routes, exports, and imports | `src/model/logistics.ts`, `src/state/flows.ts`, and `src/model/mapConnections.ts` | A shipment appears on both factories and the map. Matching legacy transport must not count it twice. |
| Map and layout | `src/components/screens/MapScreen.tsx`, `useMapCamera.ts`, `src/components/SplitLayout.tsx`, and `src/styles/global.css` | Check pin placement after pan/zoom, route alignment, sidebar resizing, and mobile stacking. |
| Saves and sample data | `src/model/schema.ts`, `migrations.ts`, `baseline.ts`, `backup.ts`, and `src/data/templates/` | Check older saves, backup round trips, and commit/reset. The factory’s committed snapshot needs the same migration as its draft. |
| Game reference | `src/data/satisfactory-game-data.json`, `src/data/gameData.ts`, and `src/components/screens/ReferenceScreen.tsx` | Recipe IDs are saved in worlds. Check alternate recipes and multi-output recipes when changing data. |

In the table, screen components live under `src/components/screens/`; other
short filenames are relative to the directory of the preceding path.

## Reproduce locally

1. Use Node 20 to match CI. Run `npm ci`, then `npm run dev`.
2. In **Worlds**, choose **Load sample world**, then open **Cygnus Iron Foundry**
   from **Factories**. Use a disposable browser profile or a separate origin
   for test data. `localhost` and `127.0.0.1` have separate local storage, as do
   different ports. Export a JSON backup before testing changes to a real save.
3. For a production smoke test, use a four-smelter Iron Ingot line, attach a
   120/m Iron Ore node to the factory, and claim 120/m on that line. Allocate
   40/m of ingots to a compatible line and 60/m to another factory. Verify the
   source has 20/m surplus and the receiving factory shows 60/m imported.
4. Run `npm test` and `npm run build`. The test command runs
   `scripts/check-line-feeds.mjs` against the actual state and model modules
   through Vite. It does not cover modal interactions, layout, or map gestures.
   To check the built app, use `npm run preview`. The build registers a service
   worker; if an old bundle appears, check the service worker before clearing
   any site data.

If a save appears missing, check the browser origin and migration before
changing data. The store reads `satisfactories:v2` with a legacy
`satisfactories:v1` fallback. Those key names are independent of the schema
version inside the saved JSON.
