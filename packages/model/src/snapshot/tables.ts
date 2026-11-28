import { z } from 'zod';
import { ClockFractionSchema, CmSchema } from '../units';

export const TABLE_META = 'meta';
export const TABLE_SNAPSHOT = 'snapshot';
export const TABLE_UNKNOWN_OBJECT = 'unknown_object';
export const TABLE_BUILDABLE = 'buildable';
export const TABLE_BUILDABLE_RTREE = 'buildable_rtree';
export const TABLE_FOUNDATION_TILE = 'foundation_tile';
export const TABLE_COMPONENT = 'component';
export const TABLE_EDGE = 'edge';
export const TABLE_INVENTORY_ITEM = 'inventory_item';
export const TABLE_RESOURCE_NODE = 'resource_node';
export const TABLE_STATION = 'station';
export const TABLE_PLATFORM = 'platform';
export const TABLE_VEHICLE = 'vehicle';
export const TABLE_TIMETABLE_STOP = 'timetable_stop';
export const TABLE_DRONE_ROUTE = 'drone_route';
export const TABLE_VEHICLE_ROUTE_STATION = 'vehicle_route_station';
export const TABLE_MAP_MARKER = 'map_marker';

export const SNAPSHOT_TABLE_NAMES = [
  TABLE_META,
  TABLE_SNAPSHOT,
  TABLE_UNKNOWN_OBJECT,
  TABLE_BUILDABLE,
  TABLE_BUILDABLE_RTREE,
  TABLE_FOUNDATION_TILE,
  TABLE_COMPONENT,
  TABLE_EDGE,
  TABLE_INVENTORY_ITEM,
  TABLE_RESOURCE_NODE,
  TABLE_STATION,
  TABLE_PLATFORM,
  TABLE_VEHICLE,
  TABLE_TIMETABLE_STOP,
  TABLE_DRONE_ROUTE,
  TABLE_VEHICLE_ROUTE_STATION,
  TABLE_MAP_MARKER,
] as const;

export const MetaRowSchema = z.object({
  key: z.string(),
  value: z.string(),
});
export type MetaRow = z.infer<typeof MetaRowSchema>;

export const SnapshotStatusSchema = z.enum(['current', 'previous']);

export const SnapshotRowSchema = z.object({
  id: z.string(),
  imported_at: z.string(),
  save_identifier: z.string(),
  session_name: z.string(),
  save_name: z.string(),
  header_version: z.number().int(),
  save_version: z.number().int(),
  build_version: z.string(),
  save_data_hash: z.string(),
  file_size: z.number().int(),
  file_mtime: z.string(),
  play_seconds: z.number().int(),
  save_datetime: z.string(),
  is_creative: z.boolean(),
  has_mods: z.boolean(),
  parse_ms: z.number().int(),
  warning_count: z.number().int(),
  partial_count: z.number().int(),
  status: SnapshotStatusSchema,
});
export type SnapshotRow = z.infer<typeof SnapshotRowSchema>;

export const UnknownObjectReasonSchema = z.enum(['raw_bytes', 'trailing_data', 'unknown_class']);

export const UnknownObjectRowSchema = z.object({
  snapshot_id: z.string(),
  key: z.string(),
  class_path: z.string(),
  reason: UnknownObjectReasonSchema,
});
export type UnknownObjectRow = z.infer<typeof UnknownObjectRowSchema>;

export const BuildableCategorySchema = z.enum([
  'production',
  'extractor',
  'generator',
  'logistics',
  'station',
  'storage',
  'power',
  'vehicle',
  'other',
]);

export const BuildableRowSchema = z.object({
  snapshot_id: z.string(),
  key: z.string(),
  class_short: z.string(),
  class_path: z.string(),
  category: BuildableCategorySchema,
  x: CmSchema,
  y: CmSchema,
  z: CmSchema,
  qx: z.number(),
  qy: z.number(),
  qz: z.number(),
  qw: z.number(),
  recipe_short: z.string().nullable(),
  clock: ClockFractionSchema.nullable(),
  production_boost: z.number().nullable(),
  shards: z.number().int().nullable(),
  partial: z.boolean(),
});
export type BuildableRow = z.infer<typeof BuildableRowSchema>;

export const BuildableRtreeRowSchema = z.object({
  id: z.number().int(),
  min_x: z.number(),
  max_x: z.number(),
  min_y: z.number(),
  max_y: z.number(),
});
export type BuildableRtreeRow = z.infer<typeof BuildableRtreeRowSchema>;

export const FoundationTileRowSchema = z.object({
  snapshot_id: z.string(),
  tile_x: z.number().int(),
  tile_y: z.number().int(),
  z_bucket: z.number().int(),
  count: z.number().int(),
});
export type FoundationTileRow = z.infer<typeof FoundationTileRowSchema>;

export const ComponentKindSchema = z.enum([
  'conveyor_port',
  'pipe_port',
  'inventory',
  'potential',
  'power',
  'other',
]);

export const ComponentRowSchema = z.object({
  snapshot_id: z.string(),
  key: z.string(),
  parent_key: z.string(),
  class_short: z.string(),
  kind: ComponentKindSchema,
  port_name: z.string(),
});
export type ComponentRow = z.infer<typeof ComponentRowSchema>;

export const EdgeMediumSchema = z.enum(['belt', 'pipe', 'power']);

export const EdgeRowSchema = z.object({
  snapshot_id: z.string(),
  from_component: z.string(),
  to_component: z.string(),
  from_buildable: z.string(),
  to_buildable: z.string(),
  medium: EdgeMediumSchema,
  direction_known: z.boolean(),
});
export type EdgeRow = z.infer<typeof EdgeRowSchema>;

export const InventoryRoleSchema = z.enum(['input', 'output', 'storage', 'fuel', 'potential']);

export const InventoryItemRowSchema = z.object({
  snapshot_id: z.string(),
  buildable_key: z.string(),
  role: InventoryRoleSchema,
  slot: z.number().int(),
  item_short: z.string(),
  count: z.number().int(),
});
export type InventoryItemRow = z.infer<typeof InventoryItemRowSchema>;

export const ResourcePuritySchema = z.enum(['impure', 'normal', 'pure']);

export const ResourceNodeRowSchema = z.object({
  snapshot_id: z.string(),
  key: z.string(),
  resource_short: z.string(),
  purity: ResourcePuritySchema,
  x: CmSchema,
  y: CmSchema,
  z: CmSchema,
  extractor_key: z.string().nullable(),
});
export type ResourceNodeRow = z.infer<typeof ResourceNodeRowSchema>;

/** @provisional finalize after spike round 2 */
export const StationTypeSnapSchema = z.enum(['train', 'truck', 'drone']);

/** @provisional finalize after spike round 2 */
export const StationRowSchema = z.object({
  snapshot_id: z.string(),
  key: z.string(),
  buildable_key: z.string(),
  type: StationTypeSnapSchema,
  name: z.string(),
});
export type StationRow = z.infer<typeof StationRowSchema>;

/** @provisional finalize after spike round 2 */
export const PlatformMediumSchema = z.enum(['solid', 'fluid']);
export const PlatformModeSchema = z.enum(['load', 'unload', 'unknown']);

/** @provisional finalize after spike round 2 */
export const PlatformRowSchema = z.object({
  snapshot_id: z.string(),
  key: z.string(),
  station_key: z.string(),
  index: z.number().int(),
  medium: PlatformMediumSchema,
  mode: PlatformModeSchema,
});
export type PlatformRow = z.infer<typeof PlatformRowSchema>;

/** @provisional finalize after spike round 2 */
export const VehicleTypeSnapSchema = z.enum(['train', 'truck', 'fluid_truck', 'drone']);

/** @provisional finalize after spike round 2 */
export const VehicleRowSchema = z.object({
  snapshot_id: z.string(),
  key: z.string(),
  type: VehicleTypeSnapSchema,
  name: z.string(),
});
export type VehicleRow = z.infer<typeof VehicleRowSchema>;

/** @provisional finalize after spike round 2 */
export const TimetableStopRowSchema = z.object({
  snapshot_id: z.string(),
  vehicle_key: z.string(),
  seq: z.number().int(),
  station_key: z.string(),
  rules_json: z.string(),
});
export type TimetableStopRow = z.infer<typeof TimetableStopRowSchema>;

/** @provisional finalize after spike round 2 */
export const DroneRouteRowSchema = z.object({
  snapshot_id: z.string(),
  port_key: z.string(),
  destination_port_key: z.string(),
});
export type DroneRouteRow = z.infer<typeof DroneRouteRowSchema>;

/** @provisional finalize after spike round 2 */
export const VehicleRouteStationRowSchema = z.object({
  snapshot_id: z.string(),
  vehicle_key: z.string(),
  seq: z.number().int(),
  station_key: z.string(),
  inferred: z.boolean(),
});
export type VehicleRouteStationRow = z.infer<typeof VehicleRouteStationRowSchema>;

/** @provisional finalize after spike round 2 */
export const MapMarkerRowSchema = z.object({
  snapshot_id: z.string(),
  id: z.string(),
  name: z.string(),
  x: CmSchema,
  y: CmSchema,
  z: CmSchema,
  icon: z.string(),
});
export type MapMarkerRow = z.infer<typeof MapMarkerRowSchema>;

export const SNAPSHOT_ROW_SCHEMAS: Record<string, z.ZodObject<z.ZodRawShape>> = {
  [TABLE_META]: MetaRowSchema,
  [TABLE_SNAPSHOT]: SnapshotRowSchema,
  [TABLE_UNKNOWN_OBJECT]: UnknownObjectRowSchema,
  [TABLE_BUILDABLE]: BuildableRowSchema,
  [TABLE_BUILDABLE_RTREE]: BuildableRtreeRowSchema,
  [TABLE_FOUNDATION_TILE]: FoundationTileRowSchema,
  [TABLE_COMPONENT]: ComponentRowSchema,
  [TABLE_EDGE]: EdgeRowSchema,
  [TABLE_INVENTORY_ITEM]: InventoryItemRowSchema,
  [TABLE_RESOURCE_NODE]: ResourceNodeRowSchema,
  [TABLE_STATION]: StationRowSchema,
  [TABLE_PLATFORM]: PlatformRowSchema,
  [TABLE_VEHICLE]: VehicleRowSchema,
  [TABLE_TIMETABLE_STOP]: TimetableStopRowSchema,
  [TABLE_DRONE_ROUTE]: DroneRouteRowSchema,
  [TABLE_VEHICLE_ROUTE_STATION]: VehicleRouteStationRowSchema,
  [TABLE_MAP_MARKER]: MapMarkerRowSchema,
};