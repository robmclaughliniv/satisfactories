import { describe, expect, it } from 'vitest';
import { SnapshotLockedError, SnapshotNotOpenError } from '../errors';
import { generateSyntheticSnapshot } from '../synthetic';
import { ddl, loadSqlite } from '../test/helpers';
import { createEngine, encodeWorldName, isLockError, worldFromPath, worldPath } from './engine';

const memoryEngine = () => createEngine({ ddl, loadSqlite, devValidate: true, allowDebugQuery: true });

describe('world file names', () => {
  it('encodes to filename-safe characters and round-trips', () => {
    for (const id of ['simple', 'My World #2', 'a/b\\c:d*e?f"g<h>i|j', 'ünïcødé 🚂', "it's (fine)!~"]) {
      const enc = encodeWorldName(id);
      expect(enc).toMatch(/^[A-Za-z0-9._%-]+$/);
      expect(worldFromPath(worldPath(id))).toBe(id);
    }
    expect(worldPath('x')).toBe('/worlds/x.sqlite3');
    expect(worldFromPath('/worlds/x.sqlite3-journal')).toBeNull();
    expect(() => encodeWorldName('')).toThrow();
  });
});

describe('engine on the in-memory fallback', () => {
  it('reports memory VFS when no pool is installed', async () => {
    const e = memoryEngine();
    const s = await e.status();
    expect(s).toMatchObject({ vfs: 'memory', persistent: false, locked: false, openWorld: null });
    expect(s.sqliteVersion).toMatch(/^3\./);
  });

  it('falls back to memory when the pool install fails for a non-lock reason', async () => {
    const e = createEngine({
      ddl,
      loadSqlite,
      devValidate: false,
      allowDebugQuery: false,
      installPool: async () => {
        throw new Error('Missing required OPFS APIs.');
      },
    });
    const s = await e.status();
    expect(s).toMatchObject({ vfs: 'memory', persistent: false, locked: false });
    expect(s.vfsError).toMatch(/Missing required OPFS APIs/);
    expect((await e.open('w')).persistent).toBe(false);
  });

  it('opens, writes, lists, closes, reopens and deletes worlds', async () => {
    const e = memoryEngine();
    await expect(e.getCurrentSnapshot()).rejects.toBeInstanceOf(SnapshotNotOpenError);
    expect(await e.open('world A')).toEqual({ saveIdentifier: 'world A', persistent: false, created: true, recreated: false });
    const { snapshot, tables } = generateSyntheticSnapshot({ saveIdentifier: 'world A', preset: 'small' });
    const t = await e.writeSnapshot(snapshot, tables);
    expect(t.validated).toBe(true); // devValidate default
    await e.close();
    expect((await e.open('world A')).created).toBe(false);
    expect((await e.getCurrentSnapshot())?.id).toBe(snapshot.id);
    expect(await e.tableCounts(snapshot.id)).toMatchObject({ buildable: 5_000, edge: 10_000 });
    await e.open('world B');
    expect((await e.status()).openWorld).toBe('world B');
    expect((await e.listWorlds()).map((w) => w.saveIdentifier)).toEqual(['world A', 'world B']);
    expect(await e.deleteWorld('world A')).toBe(true);
    expect((await e.listWorlds()).map((w) => w.saveIdentifier)).toEqual(['world B']);
    expect(await e.deleteWorld('world B')).toBe(true);
    expect((await e.status()).openWorld).toBeNull();
  });

  it('debugQuery is gated', async () => {
    const dev = memoryEngine();
    await dev.open('d');
    expect(await dev.debugQuery('SELECT 1 AS one')).toEqual([{ one: 1 }]);
    const prod = createEngine({ ddl, loadSqlite, devValidate: false, allowDebugQuery: false });
    await prod.open('p');
    await expect(prod.debugQuery('SELECT 1')).rejects.toThrow(/dev builds/);
  });
});

describe('engine when another tab holds the pool', () => {
  const lockErr = Object.assign(new Error('Access Handles cannot be created if there is another open Access Handle'), {
    name: 'NoModificationAllowedError',
  });

  it('classifies lock errors', () => {
    expect(isLockError(lockErr)).toBe(true);
    expect(isLockError(new Error('Missing required OPFS APIs.'))).toBe(false);
  });

  it('open() rejects with SnapshotLockedError and status says locked', async () => {
    const e = createEngine({
      ddl,
      loadSqlite,
      devValidate: false,
      allowDebugQuery: false,
      installPool: async () => {
        throw lockErr;
      },
    });
    await expect(e.open('w')).rejects.toBeInstanceOf(SnapshotLockedError);
    await expect(e.listWorlds()).rejects.toBeInstanceOf(SnapshotLockedError);
    expect(await e.status()).toMatchObject({ locked: true, vfs: 'opfs-sahpool' });
  });
});
