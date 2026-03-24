import type { EdgeDb } from './database';
import { presenceCache } from '../schema';
import type { CrossingEvent } from './crossingEvents';

// Writes (or updates) the presence cache entry for the EPC in a crossing event.
export async function updatePresenceCache(db: EdgeDb, event: CrossingEvent): Promise<void> {
  const nowMs = new Date(event.timestamp).getTime();

  await db
    .insert(presenceCache)
    .values({
      epc: event.epc,
      state: event.direction === 'IN' ? 'Inside' : event.direction === 'OUT' ? 'Outside' : 'Unknown',
      lastUpdatedTs: nowMs,
      lastDirection: event.direction,
      doorId: event.doorId,
    })
    .onConflictDoUpdate({
      target: presenceCache.epc,
      set: {
        state: event.direction === 'IN' ? 'Inside' : event.direction === 'OUT' ? 'Outside' : 'Unknown',
        lastUpdatedTs: nowMs,
        lastDirection: event.direction,
        doorId: event.doorId,
      },
    });
}

// Returns all entries from the presence cache.
export async function readPresenceCache(db: EdgeDb): Promise<Array<{
  epc: string;
  state: string;
  lastUpdatedTs: number;
  lastDirection: string | null;
  doorId: string;
}>> {
  return db.select().from(presenceCache);
}
