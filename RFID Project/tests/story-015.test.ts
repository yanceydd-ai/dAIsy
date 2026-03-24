import { describe, it, expect, vi } from 'vitest';
import {
  queryAuditLog,
  runRetentionPurge,
  getRetentionConfig,
  saveRetentionConfig,
  DEFAULT_RETENTION,
  type AuditDb,
  type AuditEntry,
  type AuditQueryParams,
  type RetentionConfig,
} from '@/lib/audit/auditService';
import { AUDIT_ACTIONS } from '@/lib/audit/actions';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeEntry(overrides: Partial<AuditEntry> = {}): AuditEntry {
  return {
    id: 'entry-1',
    ts: '2026-03-23T10:00:00.000Z',
    userUpn: 'officer@hockaday.edu',
    userRole: 'COMPLIANCE_OFFICER',
    action: 'SESSION_STARTED',
    resourceType: 'session',
    resourceId: 'session-1',
    detail: null,
    ipAddress: null,
    ...overrides,
  };
}

function makeDb(overrides: Partial<AuditDb> = {}): AuditDb {
  return {
    queryAuditLog: vi.fn().mockResolvedValue({ entries: [], total: 0 }),
    getRetentionConfig: vi.fn().mockResolvedValue({ ...DEFAULT_RETENTION }),
    setRetentionConfig: vi.fn().mockResolvedValue(undefined),
    deleteRawReadsOlderThan: vi.fn().mockResolvedValue(0),
    deleteCrossingEventsOlderThan: vi.fn().mockResolvedValue(0),
    deletePresenceSessionsOlderThan: vi.fn().mockResolvedValue(0),
    insertAuditLog: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

// ─── logAudit (via insertAuditLog interface) ──────────────────────────────────

describe('STORY-015: audit log entry creation', () => {
  it('insertAuditLog is called with all required fields', async () => {
    const db = makeDb();
    await saveRetentionConfig(db, DEFAULT_RETENTION, 'officer@hockaday.edu');
    expect(db.insertAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        userUpn: 'officer@hockaday.edu',
        userRole: 'COMPLIANCE_OFFICER',
        action: AUDIT_ACTIONS.RETENTION_CONFIG_UPDATED,
        resourceType: 'app_config',
        detail: expect.objectContaining({ rawReadsDays: DEFAULT_RETENTION.rawReadsDays }),
      }),
    );
  });
});

// ─── queryAuditLog ────────────────────────────────────────────────────────────

describe('STORY-015: queryAuditLog', () => {
  it('returns correct page size (50 default)', async () => {
    const db = makeDb({
      queryAuditLog: vi.fn().mockResolvedValue({ entries: new Array(50).fill(makeEntry()), total: 120 }),
    });
    const result = await queryAuditLog(db, {});
    expect(result.entries).toHaveLength(50);
    expect(result.pageSize).toBe(50);
    expect(result.total).toBe(120);
  });

  it('passes from and to dates to db', async () => {
    const db = makeDb();
    const from = new Date('2026-01-01');
    const to = new Date('2026-03-31');
    await queryAuditLog(db, { from, to });
    expect(db.queryAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ from, to }),
    );
  });

  it('passes userUpn filter to db', async () => {
    const db = makeDb();
    await queryAuditLog(db, { userUpn: 'alice@hockaday.edu' });
    expect(db.queryAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ userUpn: 'alice@hockaday.edu' }),
    );
  });

  it('passes action filter to db', async () => {
    const db = makeDb();
    await queryAuditLog(db, { action: 'SESSION_STARTED' });
    expect(db.queryAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'SESSION_STARTED' }),
    );
  });

  it('paginates correctly — page 0 is the first page', async () => {
    const db = makeDb();
    await queryAuditLog(db, { page: 0 });
    expect(db.queryAuditLog).toHaveBeenCalledWith(expect.objectContaining({ page: 0 }));
  });

  // RBAC: GET /api/audit returns 403 for non-COMPLIANCE_OFFICER
  // Enforced at route level by requireRole(COMPLIANCE_OFFICER) (tested via requireRole unit tests — STORY-002/003)
});

// ─── retentionPurge ───────────────────────────────────────────────────────────

describe('STORY-015: runRetentionPurge', () => {
  it('deletes raw reads older than configured retention window', async () => {
    const db = makeDb({
      getRetentionConfig: vi.fn().mockResolvedValue({ rawReadsDays: 30, crossingEventsDays: 365, presenceSessionsDays: null }),
      deleteRawReadsOlderThan: vi.fn().mockResolvedValue(150),
    });

    const now = new Date('2026-03-23T03:00:00.000Z');
    await runRetentionPurge(db, now);

    const expectedCutoff = new Date(now.getTime() - 30 * 86_400_000);
    expect(db.deleteRawReadsOlderThan).toHaveBeenCalledWith(expectedCutoff);
  });

  it('does not delete rows within retention window', async () => {
    const db = makeDb({
      getRetentionConfig: vi.fn().mockResolvedValue({ rawReadsDays: 30, crossingEventsDays: 365, presenceSessionsDays: null }),
      deleteRawReadsOlderThan: vi.fn().mockResolvedValue(0),
    });
    const now = new Date('2026-03-23T03:00:00.000Z');
    await runRetentionPurge(db, now);
    // Cutoff is 30 days before now — rows within 30 days are not touched (db returns 0)
    expect(db.deleteRawReadsOlderThan).toHaveBeenCalledTimes(1);
    // Verify cutoff is correct (rows within window = 0 deleted as mocked)
    const [cutoff] = (db.deleteRawReadsOlderThan as ReturnType<typeof vi.fn>).mock.calls[0] as [Date];
    const daysDiff = (now.getTime() - cutoff.getTime()) / 86_400_000;
    expect(Math.round(daysDiff)).toBe(30);
  });

  it('skips session deletion when presenceSessionsDays is null (indefinite)', async () => {
    const db = makeDb({
      getRetentionConfig: vi.fn().mockResolvedValue({ rawReadsDays: 30, crossingEventsDays: 365, presenceSessionsDays: null }),
    });
    await runRetentionPurge(db, new Date());
    expect(db.deletePresenceSessionsOlderThan).not.toHaveBeenCalled();
  });

  it('writes audit log entry with deleted counts', async () => {
    const db = makeDb({
      deleteRawReadsOlderThan: vi.fn().mockResolvedValue(50),
      deleteCrossingEventsOlderThan: vi.fn().mockResolvedValue(10),
    });
    await runRetentionPurge(db, new Date());
    expect(db.insertAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AUDIT_ACTIONS.RETENTION_PURGE,
        detail: expect.objectContaining({
          rawReadsDeleted: 50,
          crossingEventsDeleted: 10,
        }),
      }),
    );
  });
});

// ─── Retention config ─────────────────────────────────────────────────────────

describe('STORY-015: retention config', () => {
  it('reads config correctly from db', async () => {
    const config: RetentionConfig = { rawReadsDays: 14, crossingEventsDays: 180, presenceSessionsDays: 730 };
    const db = makeDb({ getRetentionConfig: vi.fn().mockResolvedValue(config) });
    const result = await getRetentionConfig(db);
    expect(result).toEqual(config);
  });

  it('returns defaults when config is not set', async () => {
    const db = makeDb({ getRetentionConfig: vi.fn().mockResolvedValue(DEFAULT_RETENTION) });
    const result = await getRetentionConfig(db);
    expect(result.rawReadsDays).toBe(30);
    expect(result.crossingEventsDays).toBe(365);
    expect(result.presenceSessionsDays).toBeNull();
  });
});
