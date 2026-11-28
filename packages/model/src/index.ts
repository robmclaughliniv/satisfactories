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

export {
  SNAPSHOT_SCHEMA_VERSION,
  DECISIONS_SCHEMA_VERSION,
  EXPORT_FORMAT_VERSION,
  COMMAND_SCHEMA_VERSION,
} from './versions';

export { CmSchema, PerMinSchema, MWSchema, ClockFractionSchema, PointCmSchema } from './units';
export type { Cm, PerMin, MW, ClockFraction, PointCm } from './units';

export * from './snapshot';
export * from './decisions';
export * from './drafts';
export * from './derived/types';

export { COMMAND_NAMES, type CommandName } from './commands/names';
export { CommandEnvelopeSchema, type CommandEnvelope } from './commands/envelope';
export { CommandError, type CommandErrorCode } from './commands/error';
export { parseCommandEnvelope } from './commands/validate';
export { apply } from './commands/apply';
export { replay } from './commands/replay';
export { COMMAND_PAYLOAD_SCHEMAS } from './commands/payloads';

export {
  ExportEnvelopeSchema,
  buildExport,
  parseExport,
  upgradeExport,
  webStreamsGzipCodec,
  type ExportEnvelope,
  type BuildExportInput,
  type ByteCodec,
} from './export';

export { v10ToDecisionsV1, type V10ToDecisionsV1Result } from './migrations/decisions/v10ToDecisionsV1';