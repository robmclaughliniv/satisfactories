import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { defaultTransportForItem } from '../data/gameData';
import { SAMPLE_WORLD } from '../data/templates';
import { buildBackupEnvelope, getLastBackupAt, loadBackupFromFile, recordLastBackupAt, saveBackupToFile } from '../model/backup';
import { migratePersisted } from '../model/migrations';
import { applyBaseline, captureBaseline, emptyBaseline, parseBaseline } from '../model/baseline';
import { SCHEMA_VERSION, type PersistedStateV2 } from '../model/schema';
import { createEmptyWorld, instantiateTemplate, touchWorld } from '../model/world';
import { exportRemainder, exportableItems, itemExported, itemSupply } from './derive';
import type {
  AddExportResourceModalState,
  AddReceivingStationModalState,
  FactoryModalState,
  Factory,
  LocalInputModalState,
  MapFocus,
  MapLock,
  PickerState,
  RouteModalState,
  RowDestination,
  RowSource,
  Screen,
  Station,
  StationEditModalState,
  StationRole,
  StationType,
  Transport,
  World,
} from '../types';
import { normalizeDestinations, toggleRowDestination, toggleRowSource } from './lineFeeds';
import {
  createStation,
  createVehicle,
  reconcileLogistics,
  removeStation as removeStationFromWorld,
  exportStations,
  recomputeVehicleRates,
  stationById,
  suggestStationName,
} from '../model/logistics';
import { freshId } from '../model/world';

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
  factoriesFocus: string | null;
  favItems: string[];
  favFactories: string[];
  drillItem: string | null;
  refSel: string | null;
  refSearch: string;
  factoryModal: FactoryModalState | null;
  routeModal: RouteModalState | null;
  localInputModal: LocalInputModalState | null;
  addExportResourceModal: AddExportResourceModalState | null;
  addReceivingStationModal: AddReceivingStationModalState | null;
  stationEditModal: StationEditModalState | null;
  worlds: World[];
}

const STORAGE_KEY = 'satisfactories:v2';
const LEGACY_STORAGE_KEY = 'satisfactories:v1';

const EMPTY: Pick<AppState, 'worlds' | 'worldId' | 'favItems' | 'favFactories'> = {
  worlds: [],
  worldId: null,
  favItems: [],
  favFactories: [],
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

function normalizePersisted(
  persisted: PersistedStateV2,
): Pick<AppState, 'worlds' | 'worldId' | 'favItems' | 'favFactories'> {
  const worldId = persisted.worlds.some((w) => w.id === persisted.worldId)
    ? persisted.worldId
    : persisted.worlds[0]?.id ?? null;
  return {
    worlds: persisted.worlds,
    worldId,
    favItems: persisted.favItems,
    favFactories: persisted.favFactories,
  };
}

function loadInitial(): Pick<AppState, 'worlds' | 'worldId' | 'favItems' | 'favFactories'> {
  const persisted = readAndMigrate(STORAGE_KEY) ?? readAndMigrate(LEGACY_STORAGE_KEY);
  if (!persisted) return EMPTY;
  return normalizePersisted(persisted);
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
    factoriesFocus: null,
    drillItem: null,
    refSel: null,
    refSearch: '',
    factoryModal: null,
    routeModal: null,
    localInputModal: null,
    addExportResourceModal: null,
    addReceivingStationModal: null,
    stationEditModal: null,
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

const WORLD_SCREENS: Screen[] = ['map', 'factory', 'factories', 'rollup'];

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
        favFactories: st.favFactories,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
    } catch {
      // storage full / unavailable — persistence is best-effort
    }
  }, [st.worlds, st.worldId, st.favItems, st.favFactories]);

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
        factoriesFocus: null,
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

  const renameSection = (fid: string, sid: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    mutateWorld((w) => {
      const s = w.factories.find((f) => f.id === fid)?.sections.find((x) => x.id === sid);
      if (s) s.name = trimmed;
    });
  };

  const setRowDestinations = (fid: string, sid: string, rid: string, destinations: RowDestination[]) => {
    mutateWorld((w) => {
      const row = w.factories
        .find((f) => f.id === fid)
        ?.sections.find((s) => s.id === sid)
        ?.rows.find((x) => x.id === rid);
      if (row) row.destinations = normalizeDestinations(destinations, sid);
    });
  };

  const toggleDestination = (fid: string, sid: string, rid: string, target: RowDestination) => {
    mutateWorld((w) => {
      const row = w.factories
        .find((f) => f.id === fid)
        ?.sections.find((s) => s.id === sid)
        ?.rows.find((x) => x.id === rid);
      if (row) {
        row.destinations = toggleRowDestination(row.destinations ?? [], sid, target);
      }
    });
  };

  const toggleSource = (fid: string, sid: string, rid: string, target: RowSource) => {
    mutateWorld((w) => {
      const row = w.factories
        .find((f) => f.id === fid)
        ?.sections.find((s) => s.id === sid)
        ?.rows.find((x) => x.id === rid);
      if (row) {
        row.sources = toggleRowSource(row.sources ?? [], target);
      }
    });
  };

  const removeSection = (fid: string, sid: string) => {
    const factory = world?.factories.find((f) => f.id === fid);
    const section = factory?.sections.find((s) => s.id === sid);
    if (!section) return;
    if (section.rows.length > 0 && !window.confirm(`Delete production line "${section.name}" and its ${section.rows.length} recipe(s)?`)) {
      return;
    }

    const rowIds = new Set(section.rows.map((r) => r.id));
    mutateWorld((w) => {
      const f = w.factories.find((x) => x.id === fid);
      if (!f) return;
      f.sections.forEach((sec) => {
        sec.rows.forEach((row) => {
          row.destinations = (row.destinations ?? []).filter(
            (d) => d.kind !== 'section' || d.sectionId !== sid,
          );
        });
      });
      f.sections = f.sections.filter((s) => s.id !== sid);
    });
    up((s) => {
      const expanded = { ...s.expanded };
      rowIds.forEach((id) => delete expanded[id]);
      return { expanded };
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
        if (s) s.rows.push({ id: newId, recipeId, count: 1, destinations: [], sources: [] });
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
      if (f) f.baseline = captureBaseline(f, w.routes, w.stations ?? []);
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
        stationSeq: 0,
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
        t: 'Belt',
        readOnly: false,
      },
    });
  };

  const openAddExportResource = (factoryId: string) => {
    if (!world) return;
    const factory = world.factories.find((f) => f.id === factoryId);
    if (!factory) return;
    const options = exportableItems(world, factory).filter((o) => !(factory.exportOrder ?? []).includes(o.item));
    if (!options.length) return;
    up({
      addExportResourceModal: {
        factoryId,
        item: options[0].item,
      },
    });
  };

  const saveAddExportResource = () => {
    const m = st.addExportResourceModal;
    if (!m || !world) return;
    mutateWorld((w) => {
      const factory = w.factories.find((f) => f.id === m.factoryId);
      if (!factory) return;
      if (!factory.exportOrder.includes(m.item)) {
        factory.exportOrder = [...(factory.exportOrder ?? []), m.item];
      }
    });
    up({ addExportResourceModal: null });
  };

  const removeExportResource = (factoryId: string, item: string) => {
    if (!world) return;
    const hasStations = exportStations(world, factoryId, item).length > 0;
    const hasRoutes = world.routes.some((r) => r.from === factoryId && r.item === item);
    if (hasStations || hasRoutes) {
      if (!window.confirm(`Remove ${item} from exports and delete its stations and routes?`)) return;
    }

    mutateWorld((w) => {
      const factory = w.factories.find((f) => f.id === factoryId);
      if (!factory) return;
      factory.exportOrder = (factory.exportOrder ?? []).filter((x) => x !== item);
      exportStations(w, factoryId, item).forEach((station) => removeStationFromWorld(w, station.id));
      w.routes = w.routes.filter((r) => !(r.from === factoryId && r.item === item));
    });
  };

  const openAddReceivingStation = (factoryId: string) => {
    if (!world) return;
    const factory = world.factories.find((f) => f.id === factoryId);
    if (!factory) return;
    up({
      addReceivingStationModal: {
        factoryId,
        item: (factory.importOrder ?? [])[0] || 'Iron Ore',
      },
    });
  };

  const confirmAddReceivingStation = () => {
    const m = st.addReceivingStationModal;
    if (!m || !world) return;
    up({ addReceivingStationModal: null });
    openStationCreate(m.factoryId, m.item, 'import');
  };

  const openStationCreate = (factoryId: string, resourceId: string, role: StationRole) => {
    if (!world) return;
    const factory = world.factories.find((f) => f.id === factoryId);
    if (!factory) return;
    const headroom = role === 'export' ? Math.max(0, exportRemainder(world, factory, resourceId)) : 0;
    up({
      stationEditModal: {
        factoryId,
        stationId: null,
        resourceId,
        role,
        name: suggestStationName(factory, resourceId),
        type: 'train',
        totalRate: headroom || 60,
        vehicles: [],
      },
    });
  };

  const openStationEdit = (factoryId: string, stationId: string) => {
    if (!world) return;
    const station = stationById(world, stationId);
    if (!station || station.homeFactoryId !== factoryId) return;
    up({
      stationEditModal: {
        factoryId,
        stationId,
        resourceId: station.resourceId,
        role: station.role,
        name: station.name,
        type: station.type,
        totalRate: station.totalRate,
        vehicles: station.vehicles.map((v) => ({
          id: v.id,
          destinationStationId: v.destinationStationId,
        })),
      },
    });
  };

  const updateStationModal = (patch: Partial<StationEditModalState>) => {
    const m = st.stationEditModal;
    if (!m) return;
    up({ stationEditModal: { ...m, ...patch } });
  };

  const addStationVehicleDraft = () => {
    const m = st.stationEditModal;
    if (!m || m.role !== 'export') return;
    up({
      stationEditModal: {
        ...m,
        vehicles: [...m.vehicles, { id: freshId('vh'), destinationStationId: null }],
      },
    });
  };

  const removeStationVehicleDraft = (vehicleId: string) => {
    const m = st.stationEditModal;
    if (!m) return;
    up({
      stationEditModal: {
        ...m,
        vehicles: m.vehicles.filter((v) => v.id !== vehicleId),
      },
    });
  };

  const setStationVehicleDestinationDraft = (vehicleId: string, destinationStationId: string | null) => {
    const m = st.stationEditModal;
    if (!m) return;
    up({
      stationEditModal: {
        ...m,
        vehicles: m.vehicles.map((v) => (v.id === vehicleId ? { ...v, destinationStationId } : v)),
      },
    });
  };

  function isValidDestination(
    w: World,
    exportFactoryId: string,
    resourceId: string,
    type: StationType,
    destStationId: string | null,
  ): boolean {
    if (!destStationId) return true;
    const dest = stationById(w, destStationId);
    return !!(
      dest &&
      dest.role === 'import' &&
      dest.type === type &&
      dest.resourceId === resourceId &&
      dest.homeFactoryId !== exportFactoryId
    );
  }

  const saveStation = () => {
    const m = st.stationEditModal;
    if (!m || !world) return;
    const name = m.name.trim();
    if (!name) return;
    const factory = world.factories.find((f) => f.id === m.factoryId);
    let maxRate = factory && m.role === 'export' ? Math.max(0, exportRemainder(world, factory, m.resourceId)) : Infinity;
    if (!m.stationId && factory && m.role === 'export') {
      /* create: headroom already excludes nothing new */
    } else if (m.stationId && factory && m.role === 'export') {
      const existing = stationById(world, m.stationId);
      if (existing) maxRate += existing.totalRate;
    }
    const totalRate =
      m.role === 'import' ? 0 : Math.min(Math.max(0, parseFloat(String(m.totalRate)) || 0), maxRate);

    mutateWorld((w) => {
      const factory = w.factories.find((f) => f.id === m.factoryId);
      if (!factory) return;

      const applyVehicles = (station: Station) => {
        if (station.role !== 'export') return;
        const nextVehicles = m.vehicles.map((draft) => {
          const existing = station.vehicles.find((v) => v.id === draft.id);
          const vehicle = existing ?? createVehicle(station.type, null);
          if (!existing) vehicle.id = draft.id;
          vehicle.destinationStationId = isValidDestination(
            w,
            station.homeFactoryId,
            station.resourceId,
            station.type,
            draft.destinationStationId,
          )
            ? draft.destinationStationId
            : null;
          if (draft.destinationStationId && vehicle.destinationStationId) {
            const dest = stationById(w, vehicle.destinationStationId);
            const destFac = dest ? w.factories.find((f) => f.id === dest.homeFactoryId) : undefined;
            if (destFac && !destFac.importOrder.includes(station.resourceId)) {
              destFac.importOrder = [...(destFac.importOrder ?? []), station.resourceId];
            }
          }
          return vehicle;
        });
        station.vehicles = nextVehicles;
        recomputeVehicleRates(station);
      };

      if (m.stationId) {
        const station = stationById(w, m.stationId);
        if (!station) return;
        station.name = name;
        if (station.role === 'export' && station.vehicles.length === 0 && m.vehicles.length === 0) {
          station.type = m.type;
        }
        station.totalRate = station.role === 'import' ? 0 : totalRate;
        applyVehicles(station);
      } else {
        const vehicles =
          m.role === 'export'
            ? m.vehicles.map((draft) => {
                const vehicle = createVehicle(m.type, null);
                vehicle.id = draft.id;
                vehicle.destinationStationId = isValidDestination(
                  w,
                  m.factoryId,
                  m.resourceId,
                  m.type,
                  draft.destinationStationId,
                )
                  ? draft.destinationStationId
                  : null;
                if (vehicle.destinationStationId) {
                  const dest = stationById(w, vehicle.destinationStationId);
                  const destFac = dest ? w.factories.find((f) => f.id === dest.homeFactoryId) : undefined;
                  if (destFac && !destFac.importOrder.includes(m.resourceId)) {
                    destFac.importOrder = [...(destFac.importOrder ?? []), m.resourceId];
                  }
                }
                return vehicle;
              })
            : [];
        const station = createStation(w, factory, {
          name,
          resourceId: m.resourceId,
          type: m.type,
          role: m.role,
          totalRate: m.role === 'import' ? 0 : totalRate,
          vehicles,
        });
        recomputeVehicleRates(station);
        if (m.role === 'export' && !factory.exportOrder.includes(m.resourceId)) {
          factory.exportOrder = [...(factory.exportOrder ?? []), m.resourceId];
        }
        if (m.role === 'import' && !factory.importOrder.includes(m.resourceId)) {
          factory.importOrder = [...(factory.importOrder ?? []), m.resourceId];
        }
      }
      reconcileLogistics(w);
    });
    up({ stationEditModal: null });
  };

  const removeStation = (stationId: string) => {
    mutateWorld((w) => {
      removeStationFromWorld(w, stationId);
    });
    up({ stationEditModal: null });
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
        const left = exportRemainder(world, fromFac, item);
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
        let otherExports = itemExported(w, fromFac, m.item);
        if (m.editingId) {
          const existing = w.routes.find((x) => x.id === m.editingId);
          if (existing && existing.from === m.from && existing.item === m.item) {
            otherExports -= existing.rate;
          }
        }
        const maxRate = Math.max(0, supply - otherExports);
        rate = Math.min(rate, maxRate);
      }
      const routeTransport = (m.t === 'Pipe' ? 'Pipe' : 'Belt') as Transport;
      if (m.editingId) {
        const r = w.routes.find((x) => x.id === m.editingId);
        if (r) {
          r.from = m.from;
          r.to = m.to;
          r.item = m.item;
          r.rate = rate;
          r.t = routeTransport;
        }
      } else {
        w.routes.push({
          id: 'rt_' + Date.now(),
          from: m.from,
          to: m.to,
          item: m.item,
          rate,
          t: routeTransport,
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
      if (!f) return;
      f.localInputs = (f.localInputs || []).filter((x) => x.id !== inputId);
      f.sections.forEach((sec) => {
        sec.rows.forEach((row) => {
          row.sources = (row.sources ?? []).filter((s) => s.kind !== 'local' || s.localInputId !== inputId);
        });
      });
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

  const toggleFavFactory = (id: string) => {
    up((s) => ({
      favFactories: s.favFactories.includes(id)
        ? s.favFactories.filter((x) => x !== id)
        : s.favFactories.concat([id]),
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

  const saveBackup = async (): Promise<string | null> => {
    const envelope = buildBackupEnvelope({
      worlds: st.worlds,
      worldId: st.worldId,
      favItems: st.favItems,
      favFactories: st.favFactories,
    });
    const saved = await saveBackupToFile(envelope);
    return saved ? recordLastBackupAt() : getLastBackupAt();
  };

  const loadBackup = async () => {
    const persisted = await loadBackupFromFile();
    const normalized = normalizePersisted(persisted);
    up({
      ...normalized,
      screen: normalized.worldId ? ('map' as Screen) : ('worlds' as Screen),
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
      factoriesFocus: null,
      drillItem: null,
      refSel: null,
      refSearch: '',
      factoryModal: null,
      routeModal: null,
      localInputModal: null,
      addExportResourceModal: null,
      addReceivingStationModal: null,
      stationEditModal: null,
    });
  };

  return {
    setRowCount,
    removeRow,
    addSection,
    renameSection,
    setRowDestinations,
    toggleDestination,
    toggleSource,
    removeSection,
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
    openAddExportResource,
    saveAddExportResource,
    removeExportResource,
    openAddReceivingStation,
    confirmAddReceivingStation,
    openStationCreate,
    openStationEdit,
    updateStationModal,
    addStationVehicleDraft,
    removeStationVehicleDraft,
    setStationVehicleDestinationDraft,
    saveStation,
    removeStation,
    openLocalInput,
    saveLocalInput,
    removeLocalInput,
    reorderFlows,
    toggleFav,
    toggleFavFactory,
    createWorld,
    loadSampleWorld,
    renameWorld,
    deleteWorld,
    movePin,
    saveBackup,
    loadBackup,
    openFactory,
  };
}
