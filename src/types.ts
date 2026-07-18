import type { Status, Transport, StationType, StationRole } from './model/schema';

// Persisted data shapes live in src/model/schema.ts (zod) — re-exported here
// so the rest of the app keeps importing from types.ts.
export type {
  Status,
  Transport,
  StationType,
  StationRole,
  Vehicle,
  Station,
  Row,
  RowDestination,
  RowSource,
  Section,
  LocalInput,
  Factory,
  Route,
  World,
  WorldTemplate,
  PersistedStateV2,
} from './model/schema';

export type Screen = 'map' | 'factory' | 'factories' | 'rollup' | 'reference' | 'worlds';

export interface RecipeIO {
  item: string;
  rate: number;
}

export interface Recipe {
  id: string;
  name: string;
  building: string;
  power: number;
  inputs: RecipeIO[];
  outputs: RecipeIO[];
  alt: boolean;
}

export type MapFocus =
  | { type: 'factory'; id: string }
  | { type: 'route'; key: string }
  | null;

export type MapLock = { type: 'factory'; id: string } | null;

export interface PickerState {
  mode: 'add' | 'edit';
  factoryId: string;
  sectionId: string;
  rowId: string | null;
}

export interface FactoryModalState {
  editing: boolean;
  name: string;
  color: string;
  status: Status;
  tagline: string;
  tier: string;
  tags: string;
  cover: string;
}

export interface RouteModalState {
  from: string;
  to: string;
  item: string;
  rate: number | string;
  t: Transport;
  editingId?: string;
  /** When true, fields are locked — used for viewing an incoming route from the destination. */
  readOnly?: boolean;
}

export interface LocalInputModalState {
  factoryId: string;
  item: string;
  rate: number | string;
  t: Transport;
  editingId?: string;
}

export interface AddExportResourceModalState {
  factoryId: string;
  item: string;
}

export interface AddReceivingStationModalState {
  factoryId: string;
  item: string;
}

export interface StationVehicleDraft {
  id: string;
  destinationStationId: string | null;
}

export interface StationEditModalState {
  factoryId: string;
  /** null = create new station */
  stationId: string | null;
  resourceId: string;
  role: StationRole;
  name: string;
  type: StationType;
  totalRate: number | string;
  vehicles: StationVehicleDraft[];
}
