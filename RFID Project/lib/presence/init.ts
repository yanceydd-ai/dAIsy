// Server-side initialisation module for the IoT consumer.
// Imported once from the root layout — safe to call multiple times (singleton).
import { initIoTConsumer, createProductionDb } from './iotConsumer';
import { broadcastToSession } from './sseManager';
import { getPresenceSnapshot } from './snapshot';

let _initialized = false;

export function ensureIoTConsumerStarted(): void {
  if (_initialized) return;
  if (typeof window !== 'undefined') return; // browser — skip
  if (!process.env.IOTHUB_CONNECTION_STRING) {
    console.warn('[IoTConsumer] IOTHUB_CONNECTION_STRING not set — IoT consumer not started');
    return;
  }

  _initialized = true;
  const db = createProductionDb();
  initIoTConsumer(db, async (sessionId, studentId) => {
    // Build a studentUpdate event from the latest presence state
    try {
      const snapshot = await getPresenceSnapshot(sessionId);
      const studentRow = snapshot.students.find((s) => s.studentId === studentId);
      if (studentRow) {
        broadcastToSession(sessionId, { type: 'studentUpdate', ...studentRow });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[SSE] Failed to broadcast student update:', msg);
    }
  });
}
