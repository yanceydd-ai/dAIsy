import { describe, it, expect, vi } from 'vitest';
import {
  computeDeviceStatus,
  getDevices,
  OFFLINE_THRESHOLD_SECONDS,
  type DeviceDb,
  type DeviceRecord,
} from '@/lib/devices/deviceService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRecord(overrides: Partial<DeviceRecord> = {}): DeviceRecord {
  return {
    id: 'device-1',
    doorId: 'door-a',
    type: 'edge_node',
    status: 'online',
    lastHeartbeatAt: new Date().toISOString(),
    queueDepth: 0,
    readerConnected: true,
    zoneAReadRate: 847,
    zoneBReadRate: 831,
    secondsSinceHeartbeat: 5,
    ...overrides,
  };
}

function makeDb(overrides: Partial<DeviceDb> = {}): DeviceDb {
  return {
    getAllDevices: vi.fn().mockResolvedValue([]),
    getHeartbeatHistory: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
}

// ─── computeDeviceStatus ──────────────────────────────────────────────────────

describe('STORY-014: computeDeviceStatus', () => {
  it('returns "online" when heartbeat received within 90 seconds', () => {
    const now = new Date();
    const lastHeartbeat = new Date(now.getTime() - 30_000); // 30s ago
    expect(computeDeviceStatus(lastHeartbeat, now)).toBe('online');
  });

  it('returns "online" at exactly the threshold (90s)', () => {
    const now = new Date();
    const lastHeartbeat = new Date(now.getTime() - OFFLINE_THRESHOLD_SECONDS * 1000);
    expect(computeDeviceStatus(lastHeartbeat, now)).toBe('online');
  });

  it('returns "offline" when no heartbeat for > 90 seconds', () => {
    const now = new Date();
    const lastHeartbeat = new Date(now.getTime() - 91_000); // 91s ago
    expect(computeDeviceStatus(lastHeartbeat, now)).toBe('offline');
  });

  it('returns "offline" for a heartbeat 10 minutes ago', () => {
    const now = new Date();
    const lastHeartbeat = new Date(now.getTime() - 600_000); // 10 min ago
    expect(computeDeviceStatus(lastHeartbeat, now)).toBe('offline');
  });

  it('returns "unknown" when lastHeartbeatAt is null', () => {
    expect(computeDeviceStatus(null, new Date())).toBe('unknown');
  });
});

// ─── getDevices ───────────────────────────────────────────────────────────────

describe('STORY-014: getDevices', () => {
  it('returns devices from db', async () => {
    const devices = [
      makeRecord({ id: 'device-1', status: 'online' }),
      makeRecord({ id: 'device-2', status: 'offline' }),
    ];
    const db = makeDb({ getAllDevices: vi.fn().mockResolvedValue(devices) });
    const result = await getDevices(db);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('device-1');
    expect(result[1].status).toBe('offline');
  });

  it('returns correct status for online device', async () => {
    const db = makeDb({ getAllDevices: vi.fn().mockResolvedValue([makeRecord({ status: 'online' })]) });
    const [device] = await getDevices(db);
    expect(device.status).toBe('online');
  });

  it('reflects last heartbeat queue depth and read rates in response', async () => {
    const device = makeRecord({ queueDepth: 42, zoneAReadRate: 900, zoneBReadRate: 850 });
    const db = makeDb({ getAllDevices: vi.fn().mockResolvedValue([device]) });
    const [result] = await getDevices(db);
    expect(result.queueDepth).toBe(42);
    expect(result.zoneAReadRate).toBe(900);
    expect(result.zoneBReadRate).toBe(850);
  });

  it('returns an empty array when no devices are registered', async () => {
    const db = makeDb({ getAllDevices: vi.fn().mockResolvedValue([]) });
    const result = await getDevices(db);
    expect(result).toHaveLength(0);
  });
});

// ─── RBAC note ────────────────────────────────────────────────────────────────
// GET /api/devices is guarded by requireRole(IT_ADMIN), enforced at the route level.
// requireRole unit tests are in STORY-002/003.
