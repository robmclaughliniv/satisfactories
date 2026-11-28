/** Another tab holds the `opfs-sahpool` pool, which allows one connection at a time. */
export class SnapshotLockedError extends Error {
  constructor(message = 'The snapshot store is open in another tab.') {
    super(message);
    this.name = 'SnapshotLockedError';
  }
}

/** A method that needs an open world was called before `open()`. */
export class SnapshotNotOpenError extends Error {
  constructor(message = 'No snapshot world is open. Call open(saveIdentifier) first.') {
    super(message);
    this.name = 'SnapshotNotOpenError';
  }
}

/**
 * Comlink rethrows worker errors as plain `Error`s with the original `name`.
 * Turn the ones we own back into their classes so `instanceof` works on the main thread.
 */
export function reviveError(err: unknown): unknown {
  if (err instanceof Error) {
    if (err.name === 'SnapshotLockedError') return new SnapshotLockedError(err.message);
    if (err.name === 'SnapshotNotOpenError') return new SnapshotNotOpenError(err.message);
  }
  return err;
}
