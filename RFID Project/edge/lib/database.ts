import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import path from 'path';
import fs from 'fs';
import * as schema from '../schema';

export type EdgeDb = ReturnType<typeof drizzle<typeof schema>>;

let _db: EdgeDb | null = null;

export function getDb(dbPath?: string): EdgeDb {
  if (_db && !dbPath) return _db;

  const resolvedPath = dbPath
    ?? process.env.EDGE_DB_PATH
    ?? path.join(__dirname, '..', 'data', 'reads.db');

  // Ensure data directory exists
  const dir = path.dirname(resolvedPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const client = createClient({ url: `file:${resolvedPath}` });
  const db = drizzle(client, { schema });

  // Bootstrap schema inline
  client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS raw_reads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ts INTEGER NOT NULL,
      epc TEXT NOT NULL,
      antenna_zone TEXT NOT NULL,
      rssi REAL,
      door_id TEXT NOT NULL,
      device_id TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS presence_cache (
      epc TEXT PRIMARY KEY,
      state TEXT NOT NULL,
      last_updated_ts INTEGER NOT NULL,
      last_direction TEXT,
      door_id TEXT NOT NULL
    );
  `);

  if (!dbPath) _db = db;
  return db;
}

export function resetDb() {
  _db = null;
}
