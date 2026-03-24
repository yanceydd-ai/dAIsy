import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import path from 'path';
import os from 'os';
import fs from 'fs';

// ─── Raw reads written to SQLite ──────────────────────────────────────────────

describe('STORY-004: Edge Node — LLRP Client and Sensor Handler', () => {
  describe('SQLite raw reads', () => {
    let testDbPath: string;

    beforeEach(() => {
      testDbPath = path.join(os.tmpdir(), `test-reads-${Date.now()}.db`);
    });

    afterEach(() => {
      if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
    });

    it('writes a raw read record to SQLite', async () => {
      const { getDb, resetDb } = await import('../lib/database');
      const { rawReads } = await import('../schema');

      const db = getDb(testDbPath);

      // Wait for schema bootstrap (libsql executeMultiple is async)
      await new Promise((r) => setTimeout(r, 100));

      await db.insert(rawReads).values({
        ts: Date.now(),
        epc: 'AABBCCDD',
        antennaZone: 'zone-a',
        rssi: -68.5,
        doorId: 'door-a',
        deviceId: 'edge-test-1',
      });

      const rows = await db.select().from(rawReads);
      expect(rows).toHaveLength(1);
      expect(rows[0].epc).toBe('AABBCCDD');
      expect(rows[0].antennaZone).toBe('zone-a');
      expect(rows[0].doorId).toBe('door-a');

      resetDb();
    });

    it('writes multiple raw reads with distinct EPCs', async () => {
      const { getDb, resetDb } = await import('../lib/database');
      const { rawReads } = await import('../schema');

      const db = getDb(testDbPath);
      await new Promise((r) => setTimeout(r, 100));

      await db.insert(rawReads).values([
        { ts: Date.now(), epc: 'EPC001', antennaZone: 'zone-a', rssi: -70, doorId: 'door-a', deviceId: 'dev-1' },
        { ts: Date.now(), epc: 'EPC002', antennaZone: 'zone-b', rssi: -65, doorId: 'door-a', deviceId: 'dev-1' },
      ]);

      const rows = await db.select().from(rawReads);
      expect(rows).toHaveLength(2);
      expect(rows.map(r => r.epc)).toContain('EPC001');
      expect(rows.map(r => r.epc)).toContain('EPC002');

      resetDb();
    });
  });

  // ─── Reconnection logic ──────────────────────────────────────────────────────

  describe('LLRP reconnection', () => {
    it('does not throw when connection to reader fails', async () => {
      const { LLRPClient } = await import('../lib/llrp');
      // Connect to a port that will refuse — should not throw
      const client = new LLRPClient('127.0.0.1', 19999, 3000);

      await expect(
        new Promise<void>((resolve) => {
          client.on('error', () => resolve()); // error is expected
          client.on('disconnected', () => resolve()); // close triggers reconnect
          client.connect();
          // Give it 500ms to attempt and fail
          setTimeout(resolve, 500);
        })
      ).resolves.toBeUndefined();

      client.destroy();
    });
  });

  // ─── GPIO stub ──────────────────────────────────────────────────────────────

  describe('GPIO stub', () => {
    it('emits trigger at the configured interval in test mode', async () => {
      vi.useFakeTimers();
      const { StubGPIOHandler } = await import('../lib/gpio');

      const stub = new StubGPIOHandler(1000); // 1s interval for test
      let triggerCount = 0;
      stub.on('trigger', () => triggerCount++);

      stub.start();
      vi.advanceTimersByTime(3100);
      stub.stop();

      expect(triggerCount).toBe(3);
      vi.useRealTimers();
    });
  });

  // ─── Read window ─────────────────────────────────────────────────────────────

  describe('Read window', () => {
    it('opens on sensor trigger and closes after DIRECTION_WINDOW_MS', async () => {
      vi.useFakeTimers();
      const { MockLLRPClient } = await import('../lib/llrp');

      const windowMs = 500;
      const client = new MockLLRPClient(windowMs, 999_999); // long trigger interval

      expect(client.isWindowOpen()).toBe(false);

      client.openReadWindow();
      expect(client.isWindowOpen()).toBe(true);

      vi.advanceTimersByTime(windowMs + 10);
      expect(client.isWindowOpen()).toBe(false);

      client.destroy();
      vi.useRealTimers();
    });

    it('opening window twice does not reset the timer', async () => {
      vi.useFakeTimers();
      const { MockLLRPClient } = await import('../lib/llrp');

      const windowMs = 1000;
      const client = new MockLLRPClient(windowMs, 999_999);

      client.openReadWindow();
      vi.advanceTimersByTime(600);
      client.openReadWindow(); // second call should be ignored

      vi.advanceTimersByTime(500); // total 1100ms — window should be closed
      expect(client.isWindowOpen()).toBe(false);

      client.destroy();
      vi.useRealTimers();
    });
  });
});
