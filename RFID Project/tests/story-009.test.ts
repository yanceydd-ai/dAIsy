import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BlackbaudClient } from '@/lib/integrations/blackbaud';
import { syncRoster, syncSchedule, runFullSync, type SyncDb } from '@/lib/integrations/blackbaudSync';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeDb(overrides: Partial<SyncDb> = {}): SyncDb {
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

function makeStudent(key: string) {
  return {
    sisStudentKey: key,
    firstName: 'Jane',
    lastName: 'Smith',
    grade: '10',
  };
}

function makeClient(students = [makeStudent('S1')], sessions = []) {
  return new BlackbaudClient({
    accessToken: 'fake-token',
    fetch: vi.fn().mockImplementation(async (url: string) => {
      if (String(url).includes('/users')) {
        return {
          ok: true,
          json: async () => ({ value: students.map((s) => ({
            id: s.sisStudentKey,
            first_name: s.firstName,
            last_name: s.lastName,
            grade_level_label: s.grade,
          })) }),
        };
      }
      if (String(url).includes('/schedules')) {
        return {
          ok: true,
          json: async () => ({ value: sessions }),
        };
      }
      return { ok: true, json: async () => ({ value: [] }) };
    }) as typeof globalThis.fetch,
  });
}

// ─── syncRoster ───────────────────────────────────────────────────────────────

describe('STORY-009: syncRoster', () => {
  it('upserts new student correctly', async () => {
    const db = makeDb();
    const client = makeClient([makeStudent('NEW_STUDENT')]);
    await syncRoster(db, client, 'log-id');
    expect(db.upsertStudent).toHaveBeenCalledWith(
      expect.objectContaining({ sisStudentKey: 'NEW_STUDENT', active: true }),
    );
  });

  it('updates existing student by sis_student_key', async () => {
    const db = makeDb({
      getAllStudentKeys: vi.fn().mockResolvedValue(['S1']),
    });
    const client = makeClient([{ sisStudentKey: 'S1', firstName: 'Updated', lastName: 'Name', grade: '11' }]);
    await syncRoster(db, client, 'log-id');
    expect(db.upsertStudent).toHaveBeenCalledWith(
      expect.objectContaining({ sisStudentKey: 'S1', firstName: 'Updated', grade: '11' }),
    );
  });

  it('marks absent students as active=false', async () => {
    const db = makeDb({
      getAllStudentKeys: vi.fn().mockResolvedValue(['S1', 'S2', 'S_GONE']),
    });
    const client = makeClient([makeStudent('S1'), makeStudent('S2')]);
    await syncRoster(db, client, 'log-id');
    expect(db.markStudentsInactive).toHaveBeenCalledWith(['S_GONE']);
  });

  it('does not throw on API error — returns error string', async () => {
    const db = makeDb();
    const client = new BlackbaudClient({
      accessToken: 'fake-token',
      fetch: vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({}),
      }) as typeof globalThis.fetch,
    });
    const result = await syncRoster(db, client, 'log-id');
    expect(result.error).toBeDefined();
    expect(db.upsertStudent).not.toHaveBeenCalled();
  });
});

// ─── syncSchedule ─────────────────────────────────────────────────────────────

describe('STORY-009: syncSchedule', () => {
  it('creates session with correct roster', async () => {
    const db = makeDb();
    const sessions = [{
      id: 'ext-001',
      room_name: 'Main Gymnasium',
      start_time: '2026-03-24T09:00:00Z',
      end_time: '2026-03-24T10:00:00Z',
      student_ids: ['S1', 'S2'],
    }];
    const client = makeClient([], sessions as never[]);

    await syncSchedule(db, client);

    expect(db.upsertSession).toHaveBeenCalledWith(
      expect.objectContaining({
        label: 'Main Gymnasium',
      }),
    );
    expect(db.setSessionRoster).toHaveBeenCalledWith('session-uuid-1', ['S1', 'S2']);
  });
});

// ─── Sync log ─────────────────────────────────────────────────────────────────

describe('STORY-009: Sync log', () => {
  it('creates sync log entry for successful sync', async () => {
    const db = makeDb();
    const client = makeClient();
    await runFullSync(db, client);
    expect(db.createSyncLog).toHaveBeenCalledWith(
      expect.objectContaining({ syncType: 'full' }),
    );
    expect(db.completeSyncLog).toHaveBeenCalledWith(
      'log-uuid-1',
      expect.objectContaining({ studentsSynced: 1, errorMessage: undefined }),
    );
  });

  it('creates sync log entry with error message for failed sync', async () => {
    const db = makeDb({
      getAllStudentKeys: vi.fn().mockRejectedValue(new Error('DB connection failed')),
    });
    const client = makeClient();
    await runFullSync(db, client);
    expect(db.completeSyncLog).toHaveBeenCalledWith(
      'log-uuid-1',
      expect.objectContaining({ errorMessage: expect.stringContaining('DB connection failed') }),
    );
  });
});

// ─── OAuth token management ───────────────────────────────────────────────────

describe('STORY-009: BlackbaudClient — OAuth token refresh', () => {
  it('refreshes token when expired', async () => {
    const refreshFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 'new-token',
        expires_in: 3600,
      }),
    });

    const client = new BlackbaudClient({
      // No initial access token — has refresh token
      refreshToken: 'fake-refresh-token',
      clientId: 'client-id',
      clientSecret: 'client-secret',
      fetch: refreshFetch as typeof globalThis.fetch,
    });

    await client.ensureToken();

    expect(refreshFetch).toHaveBeenCalledWith(
      'https://oauth2.sky.blackbaud.com/token',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(client.getTokenState().hasToken).toBe(true);
  });

  it('does not refresh when token is still valid', async () => {
    const fetchSpy = vi.fn();
    const client = new BlackbaudClient({
      accessToken: 'valid-token',
      fetch: fetchSpy as typeof globalThis.fetch,
    });

    await client.ensureToken();

    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
