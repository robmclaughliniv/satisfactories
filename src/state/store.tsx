import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { defaultTransportForItem } from '../data/gameData';
import { SAMPLE_WORLD } from '../data/templates';
import { migratePersisted } from '../model/migrations';
import { applyBaseline, captureBaseline, emptyBaseline, parseBaseline } from '../model/baseline';
import { SCHEMA_VERSION, type PersistedStateV2 } from '../model/schema';
import { createEmptyWorld, instantiateTemplate, touchWorld } from '../model/world';
import { exportRemainder, itemExported, itemSupply } from './derive';
import type {
  FactoryModalState,
  Factory,
  LocalInputModalState,
  MapFocus,
  MapLock,
  PickerState,
  RouteModalState,
  Screen,
  Transport,
  World,
} from '../types';

export interface AppState {
  screen: Screen;
  worldId: string | null;
  selFactory: string | null;
  worldMenuOpen: boolean;
  statusFilter: string;
  tagFilter: string;
  hoverPin: string | null;
  hoverRoute: string | null;
  mapFocus: MapFocus;
  mapLock: MapLock;
  expandedFlow: Record<string, boolean>;
  expanded: Record<string, boolean>;
  picker: PickerState | null;
  pickerSearch: string;
  rollupFocus: string | null;
  favItems: string[];
  drillItem: string | null;
  refSel: string | null;
  refSearch: string;
  factoryModal: FactoryModalState | null;
  routeModal: RouteModalState | null;
  localInputModal: LocalInputModalState | null;
  worlds: World[];
}

const STORAGE_KEY = 'satisfactories:v2';
const LEGACY_STORAGE_KEY = 'satisfactories:v1';

const EMPTY: Pick<AppState, 'worlds' | 'worldId' | 'favItems'> = {
  worlds: [],
  worldId: null,
  favItems: [],
};

function readAndMigrate(key: string): PersistedStateV2 | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return migratePersisted(JSON.parse(raw));
  } catch {
    return null;
  }
}

function loadInitial(): Pick<AppState, 'worlds' | 'worldId' | 'favItems'> {
  const persisted = readAndMigrate(STORAGE_KEY) ?? readAndMigrate(LEGACY_STORAGE_KEY);
  if (!persisted) return EMPTY;
  // Normalize a stale active-world pointer.
  const worldId = persisted.worlds.some((w) => w.id === persisted.worldId)
    ? persisted.worldId
    : persisted.worlds[0]?.id ?? null;
  return { worlds: persisted.worlds, worldId, favItems: persisted.favItems };
}

function initialState(): AppState {
  const persisted = loadInitial();
  return {
    screen: persisted.worldId ? 'map' : 'worlds',
    selFactory: null,
    worldMenuOpen: false,
    statusFilter: 'all',
    tagFilter: 'all',
    hoverPin: null,
    hoverRoute: null,
    mapFocus: null,
    mapLock: null,
    expandedFlow: {},
    expanded: {},
    picker: null,
    pickerSearch: '',
    rollupFocus: null,
    drillItem: null,
    refSel: null,
    refSearch: '',
    factoryModal: null,
    routeModal: null,
    localInputModal: null,
    ...persisted,
  };
}

export type Updater = (patch: Partial<AppState> | ((s: AppState) => Partial<AppState>)) => void;

interface StoreValue {
  st: AppState;
  up: Updater;
  world: World | null;
  /** Effective screen: world-bound screens fall back to 'worlds' when no world is active. */
  screen: Screen;
  factory: (id: string | null) => Factory | undefined;
  go: (screen: Screen) => void;
  openFactory: (id: string) => void;
  mutateWorld: (fn: (w: World) => void) => void;
}

const WORLD_SCREENS: Screen[] = ['map', 'factory', 'rollup'];

const StoreCtx = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [st, setSt] = useState<AppState>(initialState);

  const up: Updater = useCallback((patch) => {
    setSt((s) => ({ ...s, ...(typeof patch === 'function' ? patch(s) : patch) }));
  }, []);

  useEffect(() => {
    try {
      const envelope: PersistedStateV2 = {
        schemaVersion: SCHEMA_VERSION,
        worlds: st.worlds,
        worldId: st.worldId,
        favItems: st.favItems,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
    } catch {
      // storage full / unavailable — persistence is best-effort
    }
  }, [st.worlds, st.worldId, st.favItems]);

  const world = st.worlds.find((w) => w.id === st.worldId) ?? null;
  const screen: Screen = !world && WORLD_SCREENS.includes(st.screen) ? 'worlds' : st.screen;

  const factory = useCallback(
    (id: string | null) => (id && world ? world.factories.find((f) => f.id === id) : undefined),
    [world],
  );

  const go = useCallback(
    (screen: Screen) =>
      up({
        screen,
        worldMenuOpen: false,
        drillItem: null,
        ...(screen !== 'map' ? { mapLock: null } : {}),
      }),
    [up],
  );

  const openFactory = useCallback(
    (id: string) => up({ screen: 'factory', selFactory: id, worldMenuOpen: false }),
    [up],
  );

  /** Clone worlds, apply a mutation to the current world, commit. No-op when no world is active. */
  const mutateWorld = useCallback(
    (fn: (w: World) => void) => {
      setSt((s) => {
        const worlds: World[] = JSON.parse(JSON.stringify(s.worlds));
        const w = worlds.find((x) => x.id === s.worldId);
        if (!w) return s;
        fn(w);
        touchWorld(w);
        return { ...s, worlds };
      });
    },
    [],
  );

  const value = useMemo(
    () => ({ st, up, world, screen, factory, go, openFactory, mutateWorld }),
    [st, up, world, screen, factory, go, openFactory, mutateWorld],
  );

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore(): StoreValue {
  const v = useContext(StoreCtx);
  if (!v) throw new Error('useStore outside provider');
  return v;
}

/** For screens only rendered when a world is active (map, factory, rollup). */
export function useWorld(): World {
  const { world } = useStore();
  if (!world) throw new Error('useWorld with no active world');
  return world;
}

// ---------- higher-level actions (used across screens) ----------

export function useActions() {
  const { st, up, world, mutateWorld, openFactory } = useStore();

  const setRowCount = (fid: string, sid: string, rid: string, val: string) => {
    const v = Math.max(0, parseInt(val) || 0);
    mutateWorld((w) => {
      const r = w.factories.find((f) => f.id === fid)?.sections.find((s) => s.id === sid)?.rows.find((x) => x.id === rid);
      if (r) r.count = v;
    });
  };

  const toggleRowExport = (fid: string, sid: string, rid: string) => {
    mutateWorld((w) => {
      const r = w.factories.find((f) => f.id === fid)?.sections.find((s) => s.id === sid)?.rows.find((x) => x.id === rid);
      if (r) r.export = !r.export;
    });
  };

  const removeRow = (fid: string, sid: string, rid: string) => {
    mutateWorld((w) => {
      const s = w.factories.find((f) => f.id === fid)?.sections.find((x) => x.id === sid);
      if (s) s.rows = s.rows.filter((x) => x.id !== rid);
    });
  };

  const addSection = (fid: string) => {
    mutateWorld((w) => {
      const f = w.factories.find((x) => x.id === fid);
      if (f) f.sections.push({ id: 's_' + Date.now(), name: 'New Section', rows: [] });
    });
  };

  const openRecipePicker = (mode: 'add' | 'edit', fid: string, sid: string, rid: string | null) => {
    up({ picker: { mode, factoryId: fid, sectionId: sid, rowId: rid }, pickerSearch: '' });
  };

  const pickRecipe = (recipeId: string) => {
    const pk = st.picker;
    if (!pk) return;
    if (pk.mode === 'edit') {
      mutateWorld((w) => {
        const r = w.factories.find((f) => f.id === pk.factoryId)?.sections.find((s) => s.id === pk.sectionId)?.rows.find((x) => x.id === pk.rowId);
        if (r) r.recipeId = recipeId;
      });
      up({ picker: null, pickerSearch: '' });
    } else {
      const newId = 'r_' + Date.now();
      mutateWorld((w) => {
        const s = w.factories.find((f) => f.id === pk.factoryId)?.sections.find((x) => x.id === pk.sectionId);
        if (s) s.rows.push({ id: newId, recipeId, count: 1 });
      });
      up({ picker: { mode: 'edit', factoryId: pk.factoryId, sectionId: pk.sectionId, rowId: newId }, pickerSearch: '' });
    }
  };

  const resetFactory = (fid: string) => {
    mutateWorld((w) => {
      const f = w.factories.find((x) => x.id === fid);
      if (f) applyBaseline(f, w, parseBaseline(f.baseline));
    });
  };

  const commitFactory = (fid: string) => {
    mutateWorld((w) => {
      const f = w.factories.find((x) => x.id === fid);
      if (f) f.baseline = captureBaseline(f, w.routes);
    });
  };

  const openCreateFactory = () => {
    up({ factoryModal: { editing: false, name: '', color: '#F5882E', status: 'planned', tagline: '', tier: 'Mid-sized Factory', tags: '', cover: '' } });
  };

  const saveFactory = () => {
    const m = st.factoryModal;
    if (!m || !m.name.trim()) return;
    const id = 'f_' + Date.now();
    mutateWorld((w) => {
      w.factories.push({
        id,
        name: m.name.trim(),
        color: m.color,
        status: m.status,
        tier: m.tier || 'Mid-sized Factory',
        tagline: m.tagline || 'Newly placed factory.',
        tags: m.tags ? m.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        cover: m.cover || '',
        x: 45 + (Math.random() * 10 - 5),
        y: 45 + (Math.random() * 10 - 5),
        sections: [],
        localInputs: [],
        importOrder: [],
        exportOrder: [],
        baseline: emptyBaseline(),
      });
    });
    up({ factoryModal: null, screen: 'factory', selFactory: id });
  };

  const openRoute = (editingId?: string, opts?: { readOnly?: boolean }) => {
    if (!world) return;
    if (editingId) {
      const r = world.routes.find((x) => x.id === editingId);
      if (r) {
        up({
          routeModal: {
            from: r.from,
            to: r.to,
            item: r.item,
            rate: r.rate,
            t: r.t,
            editingId,
            readOnly: !!opts?.readOnly,
          },
        });
        return;
      }
    }
    const facs = world.factories;
    if (facs.length < 2) return;
    up({
      routeModal: {
        from: facs[0].id,
        to: facs[1].id,
        item: 'Iron Rod',
        rate: 60,
        t: defaultTransportForItem('Iron Rod'),
        readOnly: false,
      },
    });
  };

  const addFlowLeg = (item: string, dir: 'export' | 'import', factoryId: string) => {
    if (!world) return;
    const facs = world.factories;
    const other = facs.find((x) => x.id !== factoryId);
    const partner = other ? other.id : factoryId;
    const t = defaultTransportForItem(item);
    let rate = 60;
    if (dir === 'export') {
      const fromFac = facs.find((x) => x.id === factoryId);
      if (fromFac) {
        const left = exportRemainder(world, fromFac, item, true);
        rate = Math.max(0, Math.min(60, left));
      }
    }
    const modal: RouteModalState =
      dir === 'export'
        ? { from: factoryId, to: partner, item, rate, t, readOnly: false }
        : { from: partner, to: factoryId, item, rate, t, readOnly: false };
    up({ routeModal: modal });
  };

  const saveRoute = () => {
    const m = st.routeModal;
    if (!m || m.readOnly || !m.from || !m.to || m.from === m.to) return;
    let rate = Math.max(0, parseFloat(String(m.rate)) || 0);
    mutateWorld((w) => {
      const fromFac = w.factories.find((x) => x.id === m.from);
      if (fromFac) {
        const supply = itemSupply(w, fromFac, m.item);
        let otherExports = itemExported(w, fromFac, m.item, true);
        if (m.editingId) {
          const existing = w.routes.find((x) => x.id === m.editingId);
          if (existing && existing.from === m.from && existing.item === m.item) {
            otherExports -= existing.rate;
          }
        }
        const maxRate = Math.max(0, supply - otherExports);
        rate = Math.min(rate, maxRate);
      }
      if (m.editingId) {
        const r = w.routes.find((x) => x.id === m.editingId);
        if (r) {
          r.from = m.from;
          r.to = m.to;
          r.item = m.item;
          r.rate = rate;
          r.t = (m.t || defaultTransportForItem(m.item)) as Transport;
        }
      } else {
        w.routes.push({
          id: 'rt_' + Date.now(),
          from: m.from,
          to: m.to,
          item: m.item,
          rate,
          t: (m.t || defaultTransportForItem(m.item)) as Transport,
        });
      }
    });
    up({ routeModal: null });
  };

  const removeRoute = (routeId: string) => {
    mutateWorld((w) => {
      w.routes = w.routes.filter((x) => x.id !== routeId);
    });
    up({ routeModal: null });
  };

  const openLocalInput = (factoryId: string, item?: string, editingId?: string, rate?: number) => {
    const f = world?.factories.find((x) => x.id === factoryId);
    if (editingId && f) {
      const li = (f.localInputs || []).find((x) => x.id === editingId);
      if (li) {
        up({ localInputModal: { factoryId, item: li.item, rate: li.rate, t: li.t, editingId } });
        return;
      }
    }
    up({
      localInputModal: {
        factoryId,
        item: item || 'Iron Ore',
        rate: rate ?? 60,
        t: defaultTransportForItem(item || 'Iron Ore'),
        editingId,
      },
    });
  };

  const saveLocalInput = () => {
    const m = st.localInputModal;
    if (!m || !m.factoryId) return;
    const rate = Math.max(0, parseFloat(String(m.rate)) || 0);
    mutateWorld((w) => {
      const f = w.factories.find((x) => x.id === m.factoryId);
      if (!f) return;
      if (!f.localInputs) f.localInputs = [];
      if (m.editingId) {
        const li = f.localInputs.find((x) => x.id === m.editingId);
        if (li) {
          li.item = m.item;
          li.rate = rate;
          li.t = (m.t || defaultTransportForItem(m.item)) as Transport;
        }
      } else {
        f.localInputs.push({
          id: 'li_' + Date.now(),
          item: m.item,
          rate,
          t: (m.t || defaultTransportForItem(m.item)) as Transport,
        });
      }
    });
    up({ localInputModal: null });
  };

  const removeLocalInput = (factoryId: string, inputId: string) => {
    mutateWorld((w) => {
      const f = w.factories.find((x) => x.id === factoryId);
      if (f) f.localInputs = (f.localInputs || []).filter((x) => x.id !== inputId);
    });
    up({ localInputModal: null });
  };

  const reorderFlows = (factoryId: string, dir: 'import' | 'export', orderedItems: string[]) => {
    mutateWorld((w) => {
      const f = w.factories.find((x) => x.id === factoryId);
      if (!f) return;
      if (dir === 'import') f.importOrder = orderedItems;
      else f.exportOrder = orderedItems;
    });
  };

  const toggleFav = (name: string) => {
    up((s) => ({
      favItems: s.favItems.includes(name) ? s.favItems.filter((x) => x !== name) : s.favItems.concat([name]),
    }));
  };

  const createWorld = () => {
    up((s) => {
      const worlds: World[] = JSON.parse(JSON.stringify(s.worlds));
      const w = createEmptyWorld('New Save ' + (worlds.length + 1));
      worlds.push(w);
      return { worlds, worldId: w.id, screen: 'map' as Screen, selFactory: null, mapLock: null };
    });
  };

  const loadSampleWorld = () => {
    up((s) => {
      const worlds: World[] = JSON.parse(JSON.stringify(s.worlds));
      const w = instantiateTemplate(SAMPLE_WORLD);
      worlds.push(w);
      return { worlds, worldId: w.id, screen: 'map' as Screen, selFactory: null, mapLock: null };
    });
  };

  const renameWorld = (id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    up((s) => {
      const worlds: World[] = JSON.parse(JSON.stringify(s.worlds));
      const w = worlds.find((x) => x.id === id);
      if (!w) return {};
      w.name = trimmed;
      touchWorld(w);
      return { worlds };
    });
  };

  const deleteWorld = (id: string) => {
    up((s) => ({
      worlds: s.worlds.filter((w) => w.id !== id),
      worldId: s.worldId === id ? null : s.worldId,
      selFactory: s.worldId === id ? null : s.selFactory,
      screen: s.worldId === id ? ('worlds' as Screen) : s.screen,
      mapLock: s.worldId === id ? null : s.mapLock,
    }));
  };

  const movePin = (fid: string, x: number, y: number) => {
    mutateWorld((w) => {
      const f = w.factories.find((ff) => ff.id === fid);
      if (f) {
        f.x = Math.round(x * 100) / 100;
        f.y = Math.round(y * 100) / 100;
      }
    });
  };

  return {
    setRowCount,
    toggleRowExport,
    removeRow,
    addSection,
    openRecipePicker,
    pickRecipe,
    resetFactory,
    commitFactory,
    openCreateFactory,
    saveFactory,
    openRoute,
    addFlowLeg,
    saveRoute,
    removeRoute,
    openLocalInput,
    saveLocalInput,
    removeLocalInput,
    reorderFlows,
    toggleFav,
    createWorld,
    loadSampleWorld,
    renameWorld,
    deleteWorld,
    movePin,
    openFactory,
  };
}
