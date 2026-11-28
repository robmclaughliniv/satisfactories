export { createSnapshotStore, type SnapshotStore, type CreateStoreOptions } from './client';
export { SnapshotLockedError, SnapshotNotOpenError } from './errors';
export { RTREE_CATEGORIES, FOUNDATION_TILE_CM } from './columns';
export {
  generateSyntheticSnapshot,
  seededRandom,
  SYNTHETIC_PRESETS,
  SAMPLE_BBOX,
  MAP_BOUNDS,
  type SyntheticPreset,
  type SyntheticSize,
  type SyntheticSnapshot,
} from './synthetic';
export type * from './types';
