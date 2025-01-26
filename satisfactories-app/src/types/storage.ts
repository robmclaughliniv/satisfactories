export interface Factory {
  id: string;
  name: string;
  description: string;
  inputs: {
    itemId: string;
    amount: number;
    rate: number; // per minute
  }[];
  outputs: {
    itemId: string;
    amount: number;
    rate: number; // per minute
  }[];
  notes: string; // Markdown content
  lastModified: number; // timestamp
}

export interface World {
  id: string;
  name: string;
  biome: string;
  notes: string; // Markdown content
  factories: Factory[];
  lastModified: number; // timestamp
}

// For type safety when accessing storage keys
export const STORAGE_KEYS = {
  WORLDS: 'satisfactory-worlds',
} as const;

export type StorageKeys = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];
