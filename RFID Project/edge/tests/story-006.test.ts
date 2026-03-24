import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventEmitter } from 'events';
import http from 'http';
import { IoTPublisher } from '../lib/iotPublisher';
import { updatePresenceCache, readPresenceCache } from '../lib/presenceCache';
import { createStatusServer } from '../lib/statusServer';
import { getDb, resetDb } from '../lib/database';
import type { CrossingEvent } from '../lib/crossingEvents';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeEvent(epc: string, direction: 'IN' | 'OUT' = 'IN'): CrossingEvent {
  return {
    deviceId: 'test-device',
    doorId: 'door-a',
    epc,
    direction,
    confidence: 0.9,
    zoneSequence: ['zone-a', 'zone-b'],
    sensorConfirmed: false,
    timestamp: new Date(1000).toISOString(),
    rawReadCount: 2,
  };
}

// Minimal fake IoT Hub client
function makeFakeClient(connected = true) {
  const emitter = new EventEmitter();
  const sent: string[] = [];
  return {
    emitter,
    sent,
    client: {
      open: (cb: (err: null) => void) => {
        if (connected) setTimeout(() => cb(null), 0);
        // if !connected, never calls cb (simulates hang — use explicit error test)
      },
      sendEvent: (msg: unknown, cb?: (err: null | Error) => void) => {
        // azure-iot-device Message stores body in .data (Buffer or string)
        const m = msg as { data?: Buffer | string };
        const body = m.data
          ? (Buffer.isBuffer(m.data) ? m.data.toString() : String(m.data))
          : JSON.stringify(msg);
        sent.push(body);
        cb?.(null);
      },
      close: (cb?: () => void) => cb?.(),
      removeAllListeners: () => {},
      on: (event: string, handler: (...args: unknown[]) => void) => emitter.on(event, handler),
    },
  };
}

function makePublisher(connected = true) {
  const fake = makeFakeClient(connected);
  const publisher = new IoTPublisher(
    'HostName=fake.azure-devices.net;DeviceId=dev1;SharedAccessKey=abc=',
    'test-device',
    'door-a',
    () => fake.client as unknown as import('azure-iot-device').Client,
  );
  return { publisher, fake };
}

// ─── IoTPublisher — queue behaviour ─────────────────────────────────────────

describe('STORY-006: IoT Hub Publisher', () => {
  describe('events are queued when IoT Hub is unavailable', () => {
    it('queues events when not connected', () => {
      const { publisher } = makePublisher(false);
      // Don't call connect() — publisher is disconnected

      publisher.publish(makeEvent('EPC1'));
      publisher.publish(makeEvent('EPC2'));

      expect(publisher.getQueueDepth()).toBe(2);
      publisher.destroy();
    });
  });

  describe('queued events are published in order when connectivity restores', () => {
    it('flushes queue in chronological order after connect', async () => {
      const fake = makeFakeClient(true);
      const publisher = new IoTPublisher(
        'HostName=fake.azure-devices.net;DeviceId=dev1;SharedAccessKey=abc=',
        'test-device',
        'door-a',
        () => fake.client as unknown as import('azure-iot-device').Client,
      );

      // Queue two events before connecting
      publisher.publish(makeEvent('EPC1'));
      publisher.publish(makeEvent('EPC2'));
      expect(publisher.getQueueDepth()).toBe(2);

      // Now connect — flush should happen
      publisher.connect();
      await new Promise((r) => setTimeout(r, 20)); // let open() callback fire

      expect(publisher.getQueueDepth()).toBe(0);
      expect(fake.sent.length).toBe(2);

      // Verify order: EPC1 before EPC2
      const first = JSON.parse(fake.sent[0]);
      const second = JSON.parse(fake.sent[1]);
      expect(first.epc).toBe('EPC1');
      expect(second.epc).toBe('EPC2');

      publisher.destroy();
    });
  });

  describe('queue drops oldest event when full', () => {
    it('drops oldest and logs warning when queue reaches 1000', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { publisher } = makePublisher(false);

      // Fill to exactly 1000 (no drop yet)
      for (let i = 0; i < 1000; i++) {
        publisher.publish(makeEvent(`EPC${i}`));
      }
      expect(publisher.getQueueDepth()).toBe(1000);
      expect(warnSpy).not.toHaveBeenCalled();

      // Add one more — oldest should be dropped
      publisher.publish(makeEvent('EPC_NEW'));
      expect(publisher.getQueueDepth()).toBe(1000);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('oldest event dropped'),
      );

      warnSpy.mockRestore();
      publisher.destroy();
    });
  });

  describe('heartbeat payload', () => {
    it('contains all required fields', () => {
      const { publisher } = makePublisher(false);
      const hb = publisher.buildHeartbeat();

      expect(hb.deviceId).toBe('test-device');
      expect(hb.doorId).toBe('door-a');
      expect(hb.type).toBe('heartbeat');
      expect(typeof hb.ts).toBe('string');
      expect(new Date(hb.ts).toISOString()).toBe(hb.ts); // valid ISO 8601
      expect(typeof hb.queueDepth).toBe('number');
      expect(typeof hb.readerConnected).toBe('boolean');

      publisher.destroy();
    });
  });
});

// ─── Presence cache ──────────────────────────────────────────────────────────

describe('STORY-006: Presence Cache', () => {
  beforeEach(() => {
    resetDb();
  });

  it('writes Inside state after IN event', async () => {
    const db = getDb(':memory:');
    const event = makeEvent('EPC1', 'IN');
    await updatePresenceCache(db, event);

    const rows = await readPresenceCache(db);
    expect(rows).toHaveLength(1);
    expect(rows[0].epc).toBe('EPC1');
    expect(rows[0].state).toBe('Inside');
    expect(rows[0].lastDirection).toBe('IN');
    expect(rows[0].doorId).toBe('door-a');
  });

  it('writes Outside state after OUT event', async () => {
    const db = getDb(':memory:');
    const event = makeEvent('EPC1', 'OUT');
    await updatePresenceCache(db, event);

    const rows = await readPresenceCache(db);
    expect(rows[0].state).toBe('Outside');
    expect(rows[0].lastDirection).toBe('OUT');
  });

  it('updates existing cache entry on second event', async () => {
    const db = getDb(':memory:');
    await updatePresenceCache(db, makeEvent('EPC1', 'IN'));
    await updatePresenceCache(db, makeEvent('EPC1', 'OUT'));

    const rows = await readPresenceCache(db);
    expect(rows).toHaveLength(1);
    expect(rows[0].state).toBe('Outside');
  });
});

// ─── Status HTTP server ──────────────────────────────────────────────────────

describe('STORY-006: Status HTTP Server', () => {
  let server: http.Server;

  beforeEach(() => {
    resetDb();
  });

  afterEach(async () => {
    if (server) await new Promise<void>((r) => server.close(() => r()));
  });

  function getPort(s: http.Server): number {
    const addr = s.address();
    return typeof addr === 'object' && addr ? addr.port : 3001;
  }

  function get(port: number, path: string): Promise<{ status: number; body: string }> {
    return new Promise((resolve, reject) => {
      http.get({ host: '127.0.0.1', port, path }, (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => resolve({ status: res.statusCode ?? 0, body }));
      }).on('error', reject);
    });
  }

  it('GET /status returns correct cache contents as JSON', async () => {
    const db = getDb(':memory:');
    await updatePresenceCache(db, makeEvent('EPC1', 'IN'));
    await updatePresenceCache(db, makeEvent('EPC2', 'OUT'));

    server = createStatusServer(db, 0); // port 0 = OS assigns
    await new Promise<void>((r) => server.once('listening', r));

    const port = getPort(server);
    const { status, body } = await get(port, '/status');
    expect(status).toBe(200);

    const data = JSON.parse(body) as Array<{ epc: string; state: string }>;
    expect(data).toHaveLength(2);
    const epcs = data.map((r) => r.epc).sort();
    expect(epcs).toEqual(['EPC1', 'EPC2']);
    const epc1 = data.find((r) => r.epc === 'EPC1')!;
    expect(epc1.state).toBe('Inside');
  });

  it('returns 404 for unknown paths', async () => {
    const db = getDb(':memory:');
    server = createStatusServer(db, 0);
    await new Promise<void>((r) => server.once('listening', r));

    const port = getPort(server);
    const { status } = await get(port, '/unknown');
    expect(status).toBe(404);
  });
});
