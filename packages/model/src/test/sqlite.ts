import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

type WasmDb = {
  exec: (sql: string) => void;
  selectObjects: (sql: string, bind?: unknown[]) => Record<string, unknown>[];
  close: () => void;
};

export type SqliteDb = {
  exec: (sql: string) => void;
  pragmaTableInfo: (table: string) => Array<{ name: string }>;
  query: <T>(sql: string, ...params: unknown[]) => T[];
  close: () => void;
};

let engine: 'sqlite-wasm' | null = null;

export function sqliteEngineName(): string {
  return engine ?? 'uninitialized';
}

export async function openTestSqlite(): Promise<SqliteDb> {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const ddl = readFileSync(path.join(root, 'sql/snapshot.sql'), 'utf8');

  const init = (await import('@sqlite.org/sqlite-wasm')).default;
  const sqlite3 = await init();
  const db = new sqlite3.oo1.DB(':memory:') as WasmDb;
  db.exec(ddl);
  engine = 'sqlite-wasm';

  return {
    exec: (sql) => db.exec(sql),
    pragmaTableInfo: (table) =>
      db.selectObjects(`PRAGMA table_info(${table})`).map((row) => ({
        name: String(row.name),
      })),
    query: (sql, ...params) => db.selectObjects(sql, params) as never[],
    close: () => db.close(),
  };
}