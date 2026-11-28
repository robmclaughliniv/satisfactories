import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import ddl from '@satisfactories/model/sql/snapshot.sql?raw';
import type { Db, Sqlite3 } from '../sqlite';
import { configureConnection, ensureSchema } from '../worker/db';

let sqlite3: Promise<Sqlite3> | null = null;

export function loadSqlite(): Promise<Sqlite3> {
  sqlite3 ??= sqlite3InitModule({ print: () => {}, printErr: () => {} });
  return sqlite3;
}

export { ddl };

export async function openMemoryDb(): Promise<{ db: Db; sqlite3: Sqlite3 }> {
  const s = await loadSqlite();
  const db = new s.oo1.DB(':memory:', 'c');
  configureConnection(db);
  ensureSchema(db, ddl);
  return { db, sqlite3: s };
}
