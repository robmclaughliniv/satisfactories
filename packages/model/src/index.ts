export {
  StatusSchema,
  TransportSchema,
  StationTypeSchema,
  StationRoleSchema,
  VehicleSchema,
  StationSchema,
  RowDestinationSchema,
  RowSourceSchema,
  OutputAllocationSchema,
  RowSchema,
  SectionSchema,
  LocalInputSchema,
  FactorySchema,
  RouteSchema,
  ResourceMetricSnapshotSchema,
  WorldSchema,
  PersistedStateSchema,
  WorldTemplateSchema,
  SCHEMA_VERSION,
} from './schema';

export type {
  Status,
  Transport,
  StationType,
  StationRole,
  Vehicle,
  Station,
  RowDestination,
  RowSource,
  OutputAllocation,
  Row,
  Section,
  LocalInput,
  Factory,
  Route,
  ResourceMetricSnapshot,
  World,
  PersistedStateV2,
  WorldTemplate,
} from './schema';

export { migratePersisted, normalizeWorldLogistics } from './migrations';

export {
  parseBaseline,
  captureBaseline,
  emptyBaseline,
  isFactoryDirty,
  applyBaseline,
  type FactoryBaseline,
} from './baseline';

export { freshId, createEmptyWorld, instantiateTemplate, touchWorld } from './world';

export { upgradeProduction, type RecipeLookup } from './production';

export {
  buildBackupEnvelope,
  defaultBackupFilename,
  serializeBackup,
  parseBackup,
  parseBackupJson,
  type BackupSource,
} from './backupEnvelope';

export {
  isStationTransportType,
  stationTypeLabel,
  transportFromStationType,
  kebabCase,
  nextStationSeq,
  stationName,
  factoryStations,
  exportStations,
  importStations,
  listDestinationStations,
  suggestStationName,
  findImportStation,
  stationById,
  recomputeVehicleRates,
  createStation,
  createVehicle,
  findOrCreateImportStation,
  vehicleHops,
  transportImportedByItem,
  reconcileLogistics,
  removeStation,
  stationExportTotal,
  stationReservedTotal,
  hasFactoryAllocation,
  legacyRouteDelivery,
  type VehicleHop,
} from './logistics';

export {
  buildMapConnections,
  connectionCount,
  type MapConnection,
  type MapConnectionShipment,
} from './mapConnections';