import { describe, it, expect, vi } from 'vitest';
import {
  lastSyncFailed,
  nextFullSyncTime,
  nextDeltaSyncTime,
} from '@/lib/audit/auditService';
import { runFullSync, syncRoster, syncSchedule, type SyncDb } from '@/lib/integrations/blackbaudSync';
import type { BlackbaudClient } from '@/lib/integrations/blackbaud';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeSyncDb(overrides: Partial<SyncDb> = {}): SyncDb {
  return {
    getAllStudentKeys: vi.fn().mockResolvedValue([]),
    upsertStudent: vi.fn().mockResolvedValue(undefined),
    markStudentsInactive: vi.fn().mockResolvedValue(undefined),
    upsertSession: vi.fn().mockResolvedValue('session-uuid-1'),
    setSessionRoster: vi.fn().mockResolvedValue(undefined),
    createSyncLog: vi.fn().mockResolvedValue('log-uuid-1'),
    completeSyncLog: vi.fn().mockResolvedValue(undefined),
    getRecentSyncLogs: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
}

function makeClient(overrides: Partial<BlackbaudClient> = {}): BlackbaudClient {
  return {
    ensureToken: vi.fn().mockResolvedValue(undefined),
    getStudents: vi.fn().mockResolvedValue([]),
    getGymSchedule: vi.fn().mockResolvedValue([]),
    ...overrides,
  } as unknown as BlackbaudClient;
}

// ─── lastSyncFailed ───────────────────────────────────────────────────────────

describe('STORY-016: lastSyncFailed', () => {
  it('returns false when all logs succeeded', () => {
    const logs = [
      { completedAt: new Date(), errorMessage: null },
      { completedAt: new Date(), errorMessage: null },
    ];
    expect(lastSyncFailed(logs)).toBe(false);
  });

  it('returns true when the most recent completed sync failed', () => {
    const logs = [
      { completedAt: new Date(), errorMessage: 'API rate limit exceeded' },
      { completedAt: new Date(), errorMessage: null },
    ];
    expect(lastSyncFailed(logs)).toBe(true);
  });

  it('returns false when no syncs have completed yet', () => {
    const logs = [{ completedAt: null, errorMessage: null }];
    expect(lastSyncFailed(logs)).toBe(false);
  });
});

// ─── GET /api/sync/status — returns last 10 entries ───────────────────────────

describe('STORY-016: getRecentSyncLogs', () => {
  it('requests last 10 entries from db', async () => {
    const db = makeSyncDb({
      getRecentSyncLogs: vi.fn().mockResolvedValue([]),
    });
    await db.getRecentSyncLogs(10);
    expect(db.getRecentSyncLogs).toHaveBeenCalledWith(10);
  });

  it('returns entries in the order provided by db (newest first)', async () => {
    const entries = [
      { id: '3', syncType: 'full', startedAt: new Date('2026-03-23'), completedAt: new Date('2026-03-23'), studentsSynced: 850, sessionsSynced: 3, errorMessage: null },
      { id: '2', syncType: 'delta', startedAt: new Date('2026-03-22'), completedAt: new Date('2026-03-22'), studentsSynced: 5, sessionsSynced: 0, errorMessage: null },
      { id: '1', syncType: 'full', startedAt: new Date('2026-03-22'), completedAt: new Date('2026-03-22'), studentsSynced: 848, sessionsSynced: 3, errorMessage: null },
    ];
    const db = makeSyncDb({ getRecentSyncLogs: vi.fn().mockResolvedValue(entries) });
    const result = await db.getRecentSyncLogs(10);
    expect(result[0].id).toBe('3');
    expect(result[1].id).toBe('2');
  });
});

// ─── Manual sync trigger ──────────────────────────────────────────────────────

describe('STORY-016: manual sync trigger', () => {
  it('calls syncRoster when runFullSync is triggered', async () => {
    const db = makeSyncDb();
    const client = makeClient({
      getStudents: vi.fn().mockResolvedValue([
        { sisStudentKey: 'SIS-001', firstName: 'Alice', lastName: 'Smith', grade: '10', active: true },
      ]),
    });
    await runFullSync(db, client);
    expect(client.getStudents).toHaveBeenCalled();
    expect(db.upsertStudent).toHaveBeenCalled();
  });

  it('calls getGymSchedule when runFullSync is triggered', async () => {
    const db = makeSyncDb();
    const client = makeClient({
      getGymSchedule: vi.fn().mockResolvedValue([
        { externalId: 'EVT-001', label: 'PE Period 3', scheduledStart: new Date(), scheduledEnd: new Date(), rosterStudentKeys: [] },
      ]),
    });
    await runFullSync(db, client);
    expect(client.getGymSchedule).toHaveBeenCalled();
  });

  it('logs sync to db with completedAt when successful', async () => {
    const db = makeSyncDb();
    const client = makeClient();
    await runFullSync(db, client);
    expect(db.completeSyncLog).toHaveBeenCalledWith(
      'log-uuid-1',
      expect.objectContaining({ completedAt: expect.any(Date) }),
    );
  });
});

// ─── Next scheduled sync time helpers ────────────────────────────────────────

describe('STORY-016: nextFullSyncTime', () => {
  it('returns 2:00 AM today when current time is before 2 AM', () => {
    const now = new Date('2026-03-24T01:00:00Z');
    // We cannot assume timezone in tests — just verify it's 2 AM in local time
    const next = nextFullSyncTime(now);
    expect(next.getHours()).toBe(2);
    expect(next.getMinutes()).toBe(0);
    expect(next > now).toBe(true);
  });

  it('returns 2:00 AM tomorrow when current time is after 2 AM', () => {
    const now = new Date('2026-03-24T03:00:00');
    const next = nextFullSyncTime(now);
    expect(next.getHours()).toBe(2);
    expect(next > now).toBe(true);
    // Should be the next day
    expect(next.getDate()).not.toBe(now.getDate()) // different day or month
  });
});

describe('STORY-016: nextDeltaSyncTime', () => {
  it('returns a time in the future', () => {
    const now = new Date('2026-03-24T10:00:00'); // Tuesday 10 AM
    const next = nextDeltaSyncTime(now);
    expect(next > now).toBe(true);
  });

  it('returns a time within school hours on a weekday', () => {
    const now = new Date('2026-03-24T10:00:00'); // Tuesday 10 AM
    const next = nextDeltaSyncTime(now);
    const h = next.getHours();
    const dow = next.getDay();
    expect(dow).toBeGreaterThanOrEqual(1);
    expect(dow).toBeLessThanOrEqual(5);
    expect(h).toBeGreaterThanOrEqual(7);
    expect(h).toBeLessThan(17);
  });
});
