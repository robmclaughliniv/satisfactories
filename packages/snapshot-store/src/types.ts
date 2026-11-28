import type {
  BuildableRow,
  ComponentRow,
  DroneRouteRow,
  EdgeRow,
  FoundationTileRow,
  InventoryItemRow,
  MapMarkerRow,
  PlatformRow,
  ResourceNodeRow,
  SnapshotRow,
  StationRow,
  TimetableStopRow,
  UnknownObjectRow,
  VehicleRouteStationRow,
  VehicleRow,
} from '@satisfactories/model';

export type {
  BuildableRow,
  ComponentRow,
  EdgeRow,
  FoundationTileRow,
  SnapshotRow,
} from '@satisfactories/model';

export type BuildableCategory = BuildableRow['category'];

/** Rows for every per-snapshot table. `meta`, `snapshot` and `buildable_rtree` are written by the store itself. */
export type SnapshotTables = {
  unknown_object?: UnknownObjectRow[];
  buildable?: BuildableRow[];
  foundation_tile?: FoundationTileRow[];
  component?: ComponentRow[];
  edge?: EdgeRow[];
  inventory_item?: InventoryItemRow[];
  resource_node?: ResourceNodeRow[];
  station?: StationRow[];
  platform?: PlatformRow[];
  vehicle?: VehicleRow[];
  timetable_stop?: TimetableStopRow[];
  drone_route?: DroneRouteRow[];
  vehicle_route_station?: VehicleRouteStationRow[];
  map_marker?: MapMarkerRow[];
};

export type SnapshotTableName = keyof SnapshotTables;

/** `status` is set by the store (the new snapshot always becomes `current`). */
export type SnapshotInput = Omit<SnapshotRow, 'status'> & { status?: SnapshotRow['status'] };

/** Axis-aligned box in game cm. */
export type BBox = { minX: number; minY: number; maxX: number; maxY: number };

export type VfsKind = 'opfs-sahpool' | 'memory';

export type StoreStatus = {
  /** Which VFS backs the store. `memory` means the OPFS pool could not be installed. */
  vfs: VfsKind;
  /** False when running on the in-memory fallback. */
  persistent: boolean;
  /** True when another tab holds the OPFS pool. `open()` rejects with `SnapshotLockedError` while this is true. */
  locked: boolean;
  /** Why the pool failed to install, when it did. */
  vfsError: string | null;
  /** `navigator.storage.persisted()`; null when the API is missing. */
  storagePersisted: boolean | null;
  /** `navigator.storage.estimate()`; null when the API is missing. */
  estimate: { usage?: number; quota?: number } | null;
  /** SQLite library version, e.g. "3.49.2". */
  sqliteVersion: string;
  /** The world whose DB is open, if any. */
  openWorld: string | null;
};

export type OpenResult = {
  saveIdentifier: string;
  /** False on the in-memory fallback. */
  persistent: boolean;
  /** True when the DB file did not exist (or was empty) and the schema was applied. */
  created: boolean;
  /** True when a stored `snapshot_schema_version` mismatched and the DB was wiped. The UI should say "re-import needed". */
  recreated: boolean;
};

export type WorldInfo = {
  saveIdentifier: string;
  /** Path inside the VFS, e.g. `/worlds/<encoded>.sqlite3`. */
  path: string;
};

export type WriteTimings = {
  /** Milliseconds per inserted table, plus `buildable_rtree`, `rotate` (current → previous + prune) and `validate` (dev only). */
  tables: Record<string, number>;
  rows: Record<string, number>;
  totalMs: number;
  validated: boolean;
};

export type WriteOptions = {
  /** Validate every row with the model Zod schemas. Defaults to `import.meta.env.DEV`. */
  validate?: boolean;
};

export type CategoryCounts = Partial<Record<BuildableCategory, number>>;
