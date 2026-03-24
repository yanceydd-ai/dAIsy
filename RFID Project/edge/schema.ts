import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';

// Raw reads from the LLRP reader — local SQLite cache
export const rawReads = sqliteTable('raw_reads', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ts: integer('ts').notNull(), // Unix ms timestamp
  epc: text('epc').notNull(),
  antennaZone: text('antenna_zone').notNull(), // "zone-a" | "zone-b"
  rssi: real('rssi'),
  doorId: text('door_id').notNull(),
  deviceId: text('device_id').notNull(),
});

// Last-known presence state per tag — served as offline fallback
export const presenceCache = sqliteTable('presence_cache', {
  epc: text('epc').primaryKey(),
  state: text('state').notNull(), // "Inside" | "Outside" | "Unknown"
  lastUpdatedTs: integer('last_updated_ts').notNull(), // Unix ms
  lastDirection: text('last_direction'), // "IN" | "OUT" | "UNKNOWN"
  doorId: text('door_id').notNull(),
});
