import { describe, it, expect, vi } from 'vitest';
import {
  createSession,
  startSession,
  endSession,
  overridePresence,
  type SessionDb,
} from '@/lib/sessions/sessionService';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeDb(overrides: Partial<SessionDb> = {}): SessionDb {
  return {
    getTodaySessions: vi.fn().mockResolvedValue([]),
    getActiveSession: vi.fn().mockResolvedValue(null),
    createSession: vi.fn().mockResolvedValue('session-uuid-1'),
    setSessionRoster: vi.fn().mockResolvedValue(undefined),
    startSession: vi.fn().mockResolvedValue(undefined),
    endSession: vi.fn().mockResolvedValue(undefined),
    createPresenceStatesForRoster: vi.fn().mockResolvedValue(undefined),
    upsertPresenceOverride: vi.fn().mockResolvedValue(undefined),
    getSessionById: vi.fn().mockResolvedValue(null),
    getRosterStudentIds: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
}

function futureDate(offsetMs = 60_000): Date {
  return new Date(Date.now() + offsetMs);
}

// ─── createSession ────────────────────────────────────────────────────────────

describe('STORY-010: createSession', () => {
  it('creates session with correct roster', async () => {
    const db = makeDb();
    const id = await createSession(
      db,
      {
        label: 'Period 3 PE',
        scheduledStart: futureDate(60_000),
        scheduledEnd: futureDate(3_600_000),
        rosterStudentIds: ['student-1', 'student-2'],
        createdBy: 'teacher@hockaday.edu',
      },
      'teacher@hockaday.edu',
      'ACTIVITIES_COORDINATOR',
    );
    expect(id).toBe('session-uuid-1');
    expect(db.setSessionRoster).toHaveBeenCalledWith('session-uuid-1', ['student-1', 'student-2']);
  });

  it('validation: end before start returns error with status 400', async () => {
    const db = makeDb();
    const start = futureDate(60_000);
    const end = new Date(start.getTime() - 1); // before start
    await expect(
      createSession(
        db,
        { label: 'Test', scheduledStart: start, scheduledEnd: end, rosterStudentIds: [], createdBy: 'u' },
        'u',
        'role',
      ),
    ).rejects.toMatchObject({ status: 400, message: expect.stringContaining('after') });
  });

  it('validation: missing label returns error with status 400', async () => {
    const db = makeDb();
    await expect(
      createSession(
        db,
        { label: '', scheduledStart: futureDate(), scheduledEnd: futureDate(3600_000), rosterStudentIds: [], createdBy: 'u' },
        'u',
        'role',
      ),
    ).rejects.toMatchObject({ status: 400 });
  });
});

// ─── startSession ─────────────────────────────────────────────────────────────

describe('STORY-010: startSession', () => {
  it('returns 409 when another session is already active', async () => {
    const db = makeDb({
      getActiveSession: vi.fn().mockResolvedValue({
        id: 'other-session-id',
        label: 'Other',
        status: 'active',
        scheduledStart: new Date(),
        scheduledEnd: new Date(),
        actualStart: new Date(),
        actualEnd: null,
        createdBy: 'u',
      }),
    });

    await expect(startSession(db, 'my-session-id', 'u', 'role')).rejects.toMatchObject({
      status: 409,
      message: expect.stringContaining('already active'),
    });
  });

  it('creates presence_states for all roster students when started', async () => {
    const db = makeDb();
    await startSession(db, 'session-uuid-1', 'u', 'role');
    expect(db.startSession).toHaveBeenCalledWith('session-uuid-1', expect.any(Date));
    expect(db.createPresenceStatesForRoster).toHaveBeenCalledWith('session-uuid-1');
  });
});

// ─── endSession ───────────────────────────────────────────────────────────────

describe('STORY-010: endSession', () => {
  it('sets status to ended via db.endSession', async () => {
    const db = makeDb();
    await endSession(db, 'session-uuid-1', 'u', 'role');
    expect(db.endSession).toHaveBeenCalledWith('session-uuid-1', expect.any(Date));
  });
});

// ─── overridePresence ─────────────────────────────────────────────────────────

describe('STORY-010: overridePresence', () => {
  it('sets manual_override fields correctly', async () => {
    const db = makeDb();
    await overridePresence(
      db,
      {
        sessionId: 'session-1',
        studentId: 'student-1',
        state: 'present',
        note: 'Student checked in at front desk',
        overrideBy: 'officer@hockaday.edu',
      },
      'officer@hockaday.edu',
      'SAFETY_OFFICER',
    );
    expect(db.upsertPresenceOverride).toHaveBeenCalledWith(
      expect.objectContaining({
        state: 'present',
        note: 'Student checked in at front desk',
        overrideBy: 'officer@hockaday.edu',
      }),
    );
  });
});

// Note: RBAC for session routes is enforced by requireRole() (tested in STORY-002/003).
// The session routes are guarded by SAFETY_OFFICER | ACTIVITIES_COORDINATOR as per AC-010-02/03/04.
