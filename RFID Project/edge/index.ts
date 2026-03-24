import { LLRPClient, MockLLRPClient, type RawRead } from './lib/llrp';
import { createGPIOHandler } from './lib/gpio';
import { getDb } from './lib/database';
import { rawReads } from './schema';
import { CrossingEventProcessor } from './lib/crossingEvents';
import { IoTPublisher } from './lib/iotPublisher';
import { updatePresenceCache } from './lib/presenceCache';
import { createStatusServer } from './lib/statusServer';

// ─── Configuration ─────────────────────────────────────────────────────────────

const READER_HOST = process.env.READER_HOST ?? '';
const READER_PORT = parseInt(process.env.READER_PORT ?? '5084', 10);
const DOOR_ID = process.env.DOOR_ID ?? 'door-a';
const DEVICE_ID = process.env.DEVICE_ID ?? 'edge-dev-1';
const SENSOR_GPIO_PIN_1 = parseInt(process.env.SENSOR_GPIO_PIN_1 ?? '17', 10);
const SENSOR_GPIO_PIN_2 = parseInt(process.env.SENSOR_GPIO_PIN_2 ?? '27', 10);
const DIRECTION_WINDOW_MS = parseInt(process.env.DIRECTION_WINDOW_MS ?? '3000', 10);
const DEDUP_WINDOW_MS = parseInt(process.env.DEDUP_WINDOW_MS ?? '500', 10);
const CONFIDENCE_THRESHOLD = parseFloat(process.env.CONFIDENCE_THRESHOLD ?? '0.6');
const MIN_INTER_EVENT_MS = parseInt(process.env.MIN_INTER_EVENT_MS ?? '10000', 10);
const IOTHUB_CONNECTION_STRING = process.env.IOTHUB_DEVICE_CONNECTION_STRING ?? '';

// ─── Startup summary ───────────────────────────────────────────────────────────

console.log('[Edge] Starting RFID edge node');
console.log(`[Edge] Door ID:     ${DOOR_ID}`);
console.log(`[Edge] Device ID:   ${DEVICE_ID}`);
console.log(`[Edge] Reader:      ${READER_HOST || '(mock)'}:${READER_PORT}`);
console.log(`[Edge] GPIO pins:   ${SENSOR_GPIO_PIN_1}, ${SENSOR_GPIO_PIN_2}`);

// ─── Database ─────────────────────────────────────────────────────────────────

const db = getDb();

// ─── Crossing event processor ─────────────────────────────────────────────────

const processor = new CrossingEventProcessor({
  deviceId: DEVICE_ID,
  doorId: DOOR_ID,
  dedupWindowMs: DEDUP_WINDOW_MS,
  directionWindowMs: DIRECTION_WINDOW_MS,
  confidenceThreshold: CONFIDENCE_THRESHOLD,
  minInterEventMs: MIN_INTER_EVENT_MS,
});

// ─── IoT Hub publisher ────────────────────────────────────────────────────────

const iotPublisher = IOTHUB_CONNECTION_STRING
  ? new IoTPublisher(IOTHUB_CONNECTION_STRING, DEVICE_ID, DOOR_ID)
  : null;

if (iotPublisher) {
  iotPublisher.connect();
} else {
  console.warn('[Edge] IOTHUB_DEVICE_CONNECTION_STRING not set — IoT Hub publishing disabled');
}

// ─── Local status server ──────────────────────────────────────────────────────

createStatusServer(db);

// ─── LLRP client ──────────────────────────────────────────────────────────────

const llrp = READER_HOST
  ? new LLRPClient(READER_HOST, READER_PORT, DIRECTION_WINDOW_MS)
  : new MockLLRPClient(DIRECTION_WINDOW_MS);

llrp.on('connected', () => {
  console.log(`[LLRP] Connected to reader at ${READER_HOST || 'mock'}:${READER_PORT}`);
  iotPublisher?.setReaderConnected(true);
});

llrp.on('disconnected', () => {
  console.log('[LLRP] Reader disconnected');
  iotPublisher?.setReaderConnected(false);
});

llrp.on('error', (err: Error) => {
  console.error('[LLRP] Error:', err.message);
});

// Write every raw read to SQLite during an open window
llrp.on('read', (read: RawRead) => {
  if (!llrp.isWindowOpen()) return;

  db.insert(rawReads).values({
    ts: read.ts.getTime(),
    epc: read.epc,
    antennaZone: read.antennaZone,
    rssi: read.rssi ?? null,
    doorId: DOOR_ID,
    deviceId: DEVICE_ID,
  }).catch((err: unknown) => {
    console.error('[DB] Failed to write raw read:', err);
  });
});

// When the read window closes, run the crossing event pipeline
llrp.on('window-closed', (windowReads: RawRead[]) => {
  const events = processor.process(windowReads, false);

  for (const event of events) {
    console.log(`[Crossing] ${event.epc} → ${event.direction} (confidence ${event.confidence.toFixed(2)})`);

    // Publish to IoT Hub (queues if disconnected)
    iotPublisher?.publish(event);

    // Update local presence cache
    updatePresenceCache(db, event).catch((err: unknown) => {
      console.error('[DB] Failed to update presence cache:', err);
    });
  }
});

// ─── GPIO handler ─────────────────────────────────────────────────────────────

const gpio = createGPIOHandler(SENSOR_GPIO_PIN_1, SENSOR_GPIO_PIN_2);

gpio.on('trigger', () => {
  console.log(`[GPIO] Sensor trigger — opening read window for ${DIRECTION_WINDOW_MS}ms`);
  llrp.openReadWindow();
});

// ─── Start ────────────────────────────────────────────────────────────────────

llrp.connect();
gpio.start();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Edge] Shutting down…');
  llrp.destroy();
  gpio.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  llrp.destroy();
  gpio.stop();
  process.exit(0);
});
