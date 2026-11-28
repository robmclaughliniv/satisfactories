// Tiny pub/sub for the snapshot store's banners. Lives in the main bundle and
// imports nothing from the store, so the worker and WASM stay out of startup.

export type SnapshotNotice = 'locked' | 'memory' | null;

let current: SnapshotNotice = null;
const listeners = new Set<(n: SnapshotNotice) => void>();

export function getSnapshotNotice(): SnapshotNotice {
  return current;
}

export function setSnapshotNotice(next: SnapshotNotice): void {
  if (next === current) return;
  current = next;
  for (const l of listeners) l(next);
}

export function subscribeSnapshotNotice(listener: (n: SnapshotNotice) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
