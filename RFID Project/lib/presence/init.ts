// Server-side initialisation module for the IoT consumer.
// Imported once from the root layout — safe to call multiple times (singleton).
import { initIoTConsumer, createProductionDb } from './iotConsumer';

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
  initIoTConsumer(db, (sessionId, studentId) => {
    // SSE notification — implemented in STORY-008
    // The SSE handler will call this when it registers listeners
    notifySSESubscribers(sessionId, studentId);
  });
}

// Called by the SSE endpoint (STORY-008) to notify connected browsers
let _notifySSE: ((sessionId: string, studentId: string) => void) | null = null;

export function registerSSENotifier(fn: (sessionId: string, studentId: string) => void): void {
  _notifySSE = fn;
}

function notifySSESubscribers(sessionId: string, studentId: string): void {
  _notifySSE?.(sessionId, studentId);
}
