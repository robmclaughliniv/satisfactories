export type Status = 'planned' | 'construction' | 'operational' | 'decommissioned';

export type Transport = 'Belt' | 'Train' | 'Truck' | 'Drone' | 'Pipe' | 'Unset';

export type Screen = 'map' | 'factory' | 'rollup' | 'reference' | 'worlds';

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

export interface Row {
  id: string;
  recipeId: string;
  count: number;
  export?: boolean;
}

export interface Section {
  id: string;
  name: string;
  rows: Row[];
}

export interface Factory {
  id: string;
  name: string;
  color: string;
  status: Status;
  tier: string;
  tagline: string;
  tags: string[];
  cover: string;
  x: number;
  y: number;
  sections: Section[];
  /** JSON snapshot of sections at last commit — used for the dirty indicator. */
  baseline: string;
}

export interface Route {
  id: string;
  from: string;
  to: string;
  item: string;
  rate: number;
  t: Transport;
}

export interface World {
  id: string;
  name: string;
  factories: Factory[];
  routes: Route[];
}

export type MapFocus =
  | { type: 'factory'; id: string }
  | { type: 'route'; key: string }
  | null;

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
}
