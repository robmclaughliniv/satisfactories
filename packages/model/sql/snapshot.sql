-- Snapshot schema v1. Zod row schemas in src/snapshot/tables.ts must match columns (parity test).

CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS snapshot (
  id TEXT PRIMARY KEY NOT NULL,
  imported_at TEXT NOT NULL,
  save_identifier TEXT NOT NULL,
  session_name TEXT NOT NULL,
  save_name TEXT NOT NULL,
  header_version INTEGER NOT NULL,
  save_version INTEGER NOT NULL,
  build_version TEXT NOT NULL,
  save_data_hash TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_mtime TEXT NOT NULL,
  play_seconds INTEGER NOT NULL,
  save_datetime TEXT NOT NULL,
  is_creative INTEGER NOT NULL CHECK (is_creative IN (0, 1)),
  has_mods INTEGER NOT NULL CHECK (has_mods IN (0, 1)),
  parse_ms INTEGER NOT NULL,
  warning_count INTEGER NOT NULL,
  partial_count INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('current', 'previous'))
);

CREATE TABLE IF NOT EXISTS unknown_object (
  snapshot_id TEXT NOT NULL,
  key TEXT NOT NULL,
  class_path TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('raw_bytes', 'trailing_data', 'unknown_class')),
  PRIMARY KEY (snapshot_id, key)
);

CREATE TABLE IF NOT EXISTS buildable (
  snapshot_id TEXT NOT NULL,
  key TEXT NOT NULL,
  class_short TEXT NOT NULL,
  class_path TEXT NOT NULL,
  category TEXT NOT NULL CHECK (
    category IN (
      'production', 'extractor', 'generator', 'logistics', 'station',
      'storage', 'power', 'vehicle', 'other'
    )
  ),
  x REAL NOT NULL,
  y REAL NOT NULL,
  z REAL NOT NULL,
  qx REAL NOT NULL,
  qy REAL NOT NULL,
  qz REAL NOT NULL,
  qw REAL NOT NULL,
  recipe_short TEXT,
  clock REAL,
  production_boost REAL,
  shards INTEGER,
  partial INTEGER NOT NULL CHECK (partial IN (0, 1)),
  PRIMARY KEY (snapshot_id, key)
);

CREATE INDEX IF NOT EXISTS idx_buildable_snapshot_category ON buildable (snapshot_id, category);
CREATE INDEX IF NOT EXISTS idx_buildable_snapshot_recipe ON buildable (snapshot_id, recipe_short);

CREATE VIRTUAL TABLE IF NOT EXISTS buildable_rtree USING rtree(
  id,
  min_x, max_x,
  min_y, max_y
);

CREATE TABLE IF NOT EXISTS foundation_tile (
  snapshot_id TEXT NOT NULL,
  tile_x INTEGER NOT NULL,
  tile_y INTEGER NOT NULL,
  z_bucket INTEGER NOT NULL,
  count INTEGER NOT NULL,
  PRIMARY KEY (snapshot_id, tile_x, tile_y, z_bucket)
);

CREATE TABLE IF NOT EXISTS component (
  snapshot_id TEXT NOT NULL,
  key TEXT NOT NULL,
  parent_key TEXT NOT NULL,
  class_short TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (
    kind IN ('conveyor_port', 'pipe_port', 'inventory', 'potential', 'power', 'other')
  ),
  port_name TEXT NOT NULL,
  PRIMARY KEY (snapshot_id, key)
);

CREATE INDEX IF NOT EXISTS idx_component_snapshot_parent ON component (snapshot_id, parent_key);

CREATE TABLE IF NOT EXISTS edge (
  snapshot_id TEXT NOT NULL,
  from_component TEXT NOT NULL,
  to_component TEXT NOT NULL,
  from_buildable TEXT NOT NULL,
  to_buildable TEXT NOT NULL,
  medium TEXT NOT NULL CHECK (medium IN ('belt', 'pipe', 'power')),
  direction_known INTEGER NOT NULL CHECK (direction_known IN (0, 1)),
  PRIMARY KEY (snapshot_id, from_component, to_component)
);

CREATE INDEX IF NOT EXISTS idx_edge_snapshot_from_buildable ON edge (snapshot_id, from_buildable);
CREATE INDEX IF NOT EXISTS idx_edge_snapshot_to_buildable ON edge (snapshot_id, to_buildable);

CREATE TABLE IF NOT EXISTS inventory_item (
  snapshot_id TEXT NOT NULL,
  buildable_key TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('input', 'output', 'storage', 'fuel', 'potential')),
  slot INTEGER NOT NULL,
  item_short TEXT NOT NULL,
  count INTEGER NOT NULL,
  PRIMARY KEY (snapshot_id, buildable_key, role, slot)
);

CREATE TABLE IF NOT EXISTS resource_node (
  snapshot_id TEXT NOT NULL,
  key TEXT NOT NULL,
  resource_short TEXT NOT NULL,
  purity TEXT NOT NULL CHECK (purity IN ('impure', 'normal', 'pure')),
  x REAL NOT NULL,
  y REAL NOT NULL,
  z REAL NOT NULL,
  extractor_key TEXT,
  PRIMARY KEY (snapshot_id, key)
);

-- @provisional finalize after spike round 2
CREATE TABLE IF NOT EXISTS station (
  snapshot_id TEXT NOT NULL,
  key TEXT NOT NULL,
  buildable_key TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('train', 'truck', 'drone')),
  name TEXT NOT NULL,
  PRIMARY KEY (snapshot_id, key)
);

-- @provisional finalize after spike round 2
CREATE TABLE IF NOT EXISTS platform (
  snapshot_id TEXT NOT NULL,
  key TEXT NOT NULL,
  station_key TEXT NOT NULL,
  "index" INTEGER NOT NULL,
  medium TEXT NOT NULL CHECK (medium IN ('solid', 'fluid')),
  mode TEXT NOT NULL CHECK (mode IN ('load', 'unload', 'unknown')),
  PRIMARY KEY (snapshot_id, key)
);

-- @provisional finalize after spike round 2
CREATE TABLE IF NOT EXISTS vehicle (
  snapshot_id TEXT NOT NULL,
  key TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('train', 'truck', 'fluid_truck', 'drone')),
  name TEXT NOT NULL,
  PRIMARY KEY (snapshot_id, key)
);

-- @provisional finalize after spike round 2
CREATE TABLE IF NOT EXISTS timetable_stop (
  snapshot_id TEXT NOT NULL,
  vehicle_key TEXT NOT NULL,
  seq INTEGER NOT NULL,
  station_key TEXT NOT NULL,
  rules_json TEXT NOT NULL,
  PRIMARY KEY (snapshot_id, vehicle_key, seq)
);

-- @provisional finalize after spike round 2
CREATE TABLE IF NOT EXISTS drone_route (
  snapshot_id TEXT NOT NULL,
  port_key TEXT NOT NULL,
  destination_port_key TEXT NOT NULL,
  PRIMARY KEY (snapshot_id, port_key)
);

-- @provisional finalize after spike round 2
CREATE TABLE IF NOT EXISTS vehicle_route_station (
  snapshot_id TEXT NOT NULL,
  vehicle_key TEXT NOT NULL,
  seq INTEGER NOT NULL,
  station_key TEXT NOT NULL,
  inferred INTEGER NOT NULL CHECK (inferred IN (0, 1)),
  PRIMARY KEY (snapshot_id, vehicle_key, seq)
);

-- @provisional finalize after spike round 2
CREATE TABLE IF NOT EXISTS map_marker (
  snapshot_id TEXT NOT NULL,
  id TEXT NOT NULL,
  name TEXT NOT NULL,
  x REAL NOT NULL,
  y REAL NOT NULL,
  z REAL NOT NULL,
  icon TEXT NOT NULL,
  PRIMARY KEY (snapshot_id, id)
);