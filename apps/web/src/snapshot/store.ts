// The app's single snapshot store. Only imported from lazily loaded code (today,
// the hidden debug panel), so the worker, sqlite-wasm and Comlink never load on
// the normal startup path.
import { createSnapshotStore, type SnapshotStore, type StoreStatus } from '@satisfactories/snapshot-store';
import { setSnapshotNotice } from './notice';

let store: SnapshotStore | null = null;

export function getSnapshotStore(): SnapshotStore {
  store ??= createSnapshotStore();
  return store;
}

/** Push the store's state to the banners. */
export function publishStatus(status: Pick<StoreStatus, 'locked' | 'persistent'>): void {
  setSnapshotNotice(status.locked ? 'locked' : status.persistent ? null : 'memory');
}
