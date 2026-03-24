import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CloudStateMachine } from '@/lib/presence/stateMachine';
import { IoTConsumer, type IotConsumerDb } from '@/lib/presence/iotConsumer';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeDb(overrides: Partial<IotConsumerDb> = {}): IotConsumerDb {
  return {
    findStudentByEpc: vi.fn().mockResolvedValue({ id: 'student-1' }),
    findCrossingBySourceId: vi.fn().mockResolvedValue(null),
    insertCrossingEvent: vi.fn().mockResolvedValue('crossing-uuid-1'),
    findActiveSession: vi.fn().mockResolvedValue({ id: 'session-1' }),
    upsertPresenceState: vi.fn().mockResolvedValue(undefined),
    upsertDevice: vi.fn().mockResolvedValue(undefined),
    markDevicesOfflineOlderThan: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function makeCrossingEvent(
  direction: 'IN' | 'OUT' | 'UNKNOWN' = 'IN',
  id = 'crossing-id-1',
) {
  return {
    id,
    deviceId: 'edge-1',
    doorId: 'door-a',
    epc: 'EPC_TEST',
    direction,
    confidence: 0.9,
    sensorConfirmed: false,
    rawReadCount: 3,
    timestamp: new Date(1000).toISOString(),
  };
}

function makeHeartbeat() {
  return {
    type: 'heartbeat' as const,
    deviceId: 'edge-1',
    doorId: 'door-a',
    ts: new Date().toISOString(),
    queueDepth: 0,
    readerConnected: true,
  };
}

function makeConsumer(db: IotConsumerDb) {
  const notify = vi.fn();
  const consumer = new IoTConsumer(db, notify, undefined, () => {
    throw new Error('should not create real client in tests');
  });
  return { consumer, notify };
}

// ─── CloudStateMachine ───────────────────────────────────────────────────────

describe('STORY-007: Cloud State Machine', () => {
  let sm: CloudStateMachine;

  beforeEach(() => {
    sm = new CloudStateMachine(0); // no min interval for unit tests
  });

  it('IN from Unknown → Inside', () => {
    expect(sm.apply('S1', 'IN', new Date(1000))).toBe('Inside');
  });

  it('IN from Outside → Inside', () => {
    sm.apply('S1', 'OUT', new Date(1000));
    expect(sm.apply('S1', 'IN', new Date(2000))).toBe('Inside');
  });

  it('OUT from Unknown → Outside', () => {
    expect(sm.apply('S1', 'OUT', new Date(1000))).toBe('Outside');
  });

  it('OUT from Inside → Outside', () => {
    sm.apply('S1', 'IN', new Date(1000));
    expect(sm.apply('S1', 'OUT', new Date(2000))).toBe('Outside');
  });

  it('IN ignored when already Inside', () => {
    sm.apply('S1', 'IN', new Date(1000));
    expect(sm.apply('S1', 'IN', new Date(2000))).toBeNull();
    expect(sm.getState('S1')).toBe('Inside');
  });

  it('OUT ignored when already Outside', () => {
    sm.apply('S1', 'OUT', new Date(1000));
    expect(sm.apply('S1', 'OUT', new Date(2000))).toBeNull();
    expect(sm.getState('S1')).toBe('Outside');
  });

  it('UNKNOWN direction sets state to Unknown', () => {
    sm.apply('S1', 'IN', new Date(1000));
    expect(sm.apply('S1', 'UNKNOWN', new Date(2000))).toBe('Unknown');
    expect(sm.getState('S1')).toBe('Unknown');
  });

  it('enforces min inter-event interval', () => {
    const smWithMin = new CloudStateMachine(10_000);
    smWithMin.apply('S1', 'IN', new Date(1000));
    // Within 10s → suppressed
    expect(smWithMin.apply('S1', 'OUT', new Date(5000))).toBeNull();
    // After 10s → allowed
    expect(smWithMin.apply('S1', 'OUT', new Date(12000))).toBe('Outside');
  });
});

// ─── IoTConsumer — crossing event handling ───────────────────────────────────

describe('STORY-007: IoTConsumer — crossing event handling', () => {
  it('unknown EPC is skipped without throwing', async () => {
    const db = makeDb({
      findStudentByEpc: vi.fn().mockResolvedValue(null),
    });
    const { consumer } = makeConsumer(db);
    await expect(consumer._handleMessage(makeCrossingEvent())).resolves.not.toThrow();
    expect(db.insertCrossingEvent).not.toHaveBeenCalled();
  });

  it('duplicate crossing event (same ID) is not written twice', async () => {
    const db = makeDb({
      findCrossingBySourceId: vi.fn().mockResolvedValue({ id: 'existing-uuid' }),
    });
    const { consumer } = makeConsumer(db);
    await consumer._handleMessage(makeCrossingEvent());
    expect(db.insertCrossingEvent).not.toHaveBeenCalled();
  });

  it('writes crossing event when EPC is known and not duplicate', async () => {
    const db = makeDb();
    const { consumer } = makeConsumer(db);
    await consumer._handleMessage(makeCrossingEvent('IN'));
    expect(db.insertCrossingEvent).toHaveBeenCalledOnce();
    expect(db.upsertPresenceState).toHaveBeenCalledWith(
      expect.objectContaining({ state: 'present', sessionId: 'session-1' }),
    );
  });

  it('does not create presence state when no active session', async () => {
    const db = makeDb({
      findActiveSession: vi.fn().mockResolvedValue(null),
    });
    const { consumer } = makeConsumer(db);
    await consumer._handleMessage(makeCrossingEvent('IN'));
    expect(db.insertCrossingEvent).toHaveBeenCalledOnce(); // still recorded
    expect(db.upsertPresenceState).not.toHaveBeenCalled();
  });
});

// ─── IoTConsumer — heartbeat handling ────────────────────────────────────────

describe('STORY-007: IoTConsumer — heartbeat handling', () => {
  it('heartbeat sets device status to online', async () => {
    const db = makeDb();
    const { consumer } = makeConsumer(db);
    await consumer._handleMessage(makeHeartbeat());
    expect(db.upsertDevice).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'online', deviceId: 'edge-1' }),
    );
  });

  it('device status set to offline when markDevicesOfflineOlderThan is called', async () => {
    const db = makeDb();
    const { consumer } = makeConsumer(db);
    await consumer._markStaleDevicesOffline();
    expect(db.markDevicesOfflineOlderThan).toHaveBeenCalledWith(
      expect.any(Date),
    );
    // Verify the threshold is ~90s in the past
    const threshold = (db.markDevicesOfflineOlderThan as ReturnType<typeof vi.fn>).mock.calls[0][0] as Date;
    expect(Date.now() - threshold.getTime()).toBeGreaterThanOrEqual(89_000);
  });
});
