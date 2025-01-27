// Enums
export enum GameDifficulty {
  NORMAL = 'NORMAL',
  HARD = 'HARD',
  CUSTOM = 'CUSTOM'
}

export enum FactoryCategory {
  MINING = 'MINING',
  SMELTING = 'SMELTING',
  CONSTRUCTING = 'CONSTRUCTING',
  PROCESSING = 'PROCESSING',
  POWER = 'POWER',
  STORAGE = 'STORAGE'
}

export enum FactoryStatus {
  OPERATIONAL = 'OPERATIONAL',
  UNDER_CONSTRUCTION = 'UNDER_CONSTRUCTION',
  MAINTENANCE = 'MAINTENANCE',
  INACTIVE = 'INACTIVE'
}

export enum ResourceType {
  ORE = 'ORE',
  INGOT = 'INGOT',
  PART = 'PART',
  LIQUID = 'LIQUID',
  GAS = 'GAS'
}

export enum ResourcePurity {
  IMPURE = 'IMPURE',
  NORMAL = 'NORMAL',
  PURE = 'PURE'
}

export enum TransportMethod {
  BELT = 'BELT',
  TRUCK = 'TRUCK',
  TRAIN = 'TRAIN',
  DRONE = 'DRONE',
  PIPE = 'PIPE'
}

// Interfaces
export interface Coordinates {
  x: number;
  y: number;
  z: number;
}

export interface ResourceFlow {
  itemId: string;
  resourceType: ResourceType;
  amount: number;
  rate: number; // per minute
  maxRate: number;
  efficiency: number;
  purity?: ResourcePurity; // for inputs only
  transportMethod: TransportMethod;
}

export interface Factory {
  id: string;
  name: string;
  description: string;
  category: FactoryCategory;
  status: FactoryStatus;
  location: Coordinates;
  powerUsage: number;
  powerProduction: number;
  efficiency: number;
  buildingCount: {
    [key: string]: number; // e.g., "constructor": 4
  };
  inputs: ResourceFlow[];
  outputs: ResourceFlow[];
  notes: string; // Markdown content
  lastModified: number; // timestamp
}

export interface World {
  id: string;
  name: string;
  biome: string;
  gameVersion: string;
  difficulty: GameDifficulty;
  coordinates: Coordinates;
  tags: string[];
  powerStats: {
    totalProduction: number;
    totalConsumption: number;
    maxCapacity: number;
  };
  notes: string; // Markdown content
  factories: Factory[];
  startDate: number; // timestamp
  lastModified: number; // timestamp
}

export interface User {
  id: string;
  name: string;
  email?: string; // Optional for future auth
  preferences: {
    theme: 'light' | 'dark' | 'system';
    defaultGameVersion: string;
    defaultDifficulty: GameDifficulty;
  };
  worlds: World[];
  lastActive: number; // timestamp
  createdAt: number; // timestamp
}

// For type safety when accessing storage keys
export const STORAGE_KEYS = {
  USER: 'satisfactory-user',
  WORLDS: 'satisfactory-worlds', // Keep for backward compatibility during migration
} as const;

export type StorageKeys = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];
