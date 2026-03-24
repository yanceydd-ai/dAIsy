import { logAudit } from '@/lib/audit/logAudit';
import { AUDIT_ACTIONS } from '@/lib/audit/actions';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateSessionInput {
  label: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  rosterStudentIds: string[];
  createdBy: string; // Azure AD UPN
}

export interface SessionRow {
  id: string;
  label: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  actualStart: Date | null;
  actualEnd: Date | null;
  status: string;
  createdBy: string;
  rosterCount?: number;
  presentCount?: number;
  missingCount?: number;
}

export interface OverrideInput {
  sessionId: string;
  studentId: string;
  state: string;
  note: string;
  overrideBy: string; // UPN
}

// ─── Injectable DB interface ──────────────────────────────────────────────────

export interface SessionDb {
  getTodaySessions(): Promise<SessionRow[]>;
  getActiveSession(): Promise<SessionRow | null>;
  createSession(input: CreateSessionInput): Promise<string>; // returns new UUID
  setSessionRoster(sessionId: string, studentIds: string[]): Promise<void>;
  startSession(id: string, actualStart: Date): Promise<void>;
  endSession(id: string, actualEnd: Date): Promise<void>;
  createPresenceStatesForRoster(sessionId: string): Promise<void>;
  upsertPresenceOverride(input: OverrideInput): Promise<void>;
  getSessionById(id: string): Promise<SessionRow | null>;
  getRosterStudentIds(sessionId: string): Promise<string[]>;
}

// ─── Session service ──────────────────────────────────────────────────────────

export async function createSession(
  db: SessionDb,
  input: CreateSessionInput,
  userUpn: string,
  userRole: string,
): Promise<string> {
  // Validation
  if (!input.label || input.label.trim().length === 0) {
    throw Object.assign(new Error('Label is required'), { status: 400 });
  }
  if (input.label.length > 200) {
    throw Object.assign(new Error('Label must be 200 characters or fewer'), { status: 400 });
  }
  if (!(input.scheduledStart instanceof Date) || isNaN(input.scheduledStart.getTime())) {
    throw Object.assign(new Error('scheduledStart is required'), { status: 400 });
  }
  if (!(input.scheduledEnd instanceof Date) || isNaN(input.scheduledEnd.getTime())) {
    throw Object.assign(new Error('scheduledEnd is required'), { status: 400 });
  }
  if (input.scheduledEnd <= input.scheduledStart) {
    throw Object.assign(new Error('scheduledEnd must be after scheduledStart'), { status: 400 });
  }

  const sessionId = await db.createSession(input);
  if (input.rosterStudentIds.length > 0) {
    await db.setSessionRoster(sessionId, input.rosterStudentIds);
  }

  await logAudit({
    userUpn,
    userRole,
    action: AUDIT_ACTIONS.SESSION_CREATED,
    resourceType: 'session',
    resourceId: sessionId,
    detail: { label: input.label, rosterCount: input.rosterStudentIds.length },
  });

  return sessionId;
}

export async function startSession(
  db: SessionDb,
  sessionId: string,
  userUpn: string,
  userRole: string,
): Promise<void> {
  // Check for already-active session
  const active = await db.getActiveSession();
  if (active && active.id !== sessionId) {
    throw Object.assign(
      new Error('Another session is already active'),
      { status: 409 },
    );
  }

  const now = new Date();
  await db.startSession(sessionId, now);
  await db.createPresenceStatesForRoster(sessionId);

  await logAudit({
    userUpn,
    userRole,
    action: AUDIT_ACTIONS.SESSION_STARTED,
    resourceType: 'session',
    resourceId: sessionId,
    detail: { startedAt: now.toISOString() },
  });
}

export async function endSession(
  db: SessionDb,
  sessionId: string,
  userUpn: string,
  userRole: string,
): Promise<void> {
  const now = new Date();
  await db.endSession(sessionId, now);

  await logAudit({
    userUpn,
    userRole,
    action: AUDIT_ACTIONS.SESSION_ENDED,
    resourceType: 'session',
    resourceId: sessionId,
    detail: { endedAt: now.toISOString() },
  });
}

export async function overridePresence(
  db: SessionDb,
  input: OverrideInput,
  userUpn: string,
  userRole: string,
): Promise<void> {
  await db.upsertPresenceOverride(input);

  await logAudit({
    userUpn,
    userRole,
    action: AUDIT_ACTIONS.PRESENCE_OVERRIDE,
    resourceType: 'presence_state',
    resourceId: `${input.sessionId}:${input.studentId}`,
    detail: { state: input.state, note: input.note },
  });
}

// ─── Production DB adapter ────────────────────────────────────────────────────

export function createSessionDb(): SessionDb {
  return {
    async getTodaySessions() {
      const { getDb } = await import('@/db');
      const { sessions, presenceStates } = await import('@/db/schema');
      const { sql, gte, lt } = await import('drizzle-orm');
      const db = getDb();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      return db
        .select()
        .from(sessions)
        .where(sql`${sessions.scheduledStart} >= ${today} AND ${sessions.scheduledStart} < ${tomorrow}`)
        .orderBy(sessions.scheduledStart);
    },

    async getActiveSession() {
      const { getDb } = await import('@/db');
      const { sessions } = await import('@/db/schema');
      const { eq } = await import('drizzle-orm');
      const db = getDb();
      const rows = await db.select().from(sessions).where(eq(sessions.status, 'active')).limit(1);
      return rows[0] ?? null;
    },

    async createSession(input) {
      const { getDb } = await import('@/db');
      const { sessions } = await import('@/db/schema');
      const db = getDb();
      const rows = await db
        .insert(sessions)
        .values({
          label: input.label,
          scheduledStart: input.scheduledStart,
          scheduledEnd: input.scheduledEnd,
          status: 'scheduled',
          createdBy: input.createdBy,
        })
        .returning({ id: sessions.id });
      return rows[0].id;
    },

    async setSessionRoster(sessionId, studentIds) {
      const { getDb } = await import('@/db');
      const { sessionRoster } = await import('@/db/schema');
      const db = getDb();
      for (const studentId of studentIds) {
        await db
          .insert(sessionRoster)
          .values({ sessionId, studentId })
          .onConflictDoNothing();
      }
    },

    async startSession(id, actualStart) {
      const { getDb } = await import('@/db');
      const { sessions } = await import('@/db/schema');
      const { eq } = await import('drizzle-orm');
      const db = getDb();
      await db.update(sessions).set({ status: 'active', actualStart }).where(eq(sessions.id, id));
    },

    async endSession(id, actualEnd) {
      const { getDb } = await import('@/db');
      const { sessions } = await import('@/db/schema');
      const { eq } = await import('drizzle-orm');
      const db = getDb();
      await db.update(sessions).set({ status: 'ended', actualEnd }).where(eq(sessions.id, id));
    },

    async createPresenceStatesForRoster(sessionId) {
      const { getDb } = await import('@/db');
      const { sessionRoster, presenceStates } = await import('@/db/schema');
      const { eq } = await import('drizzle-orm');
      const db = getDb();
      const roster = await db
        .select({ studentId: sessionRoster.studentId })
        .from(sessionRoster)
        .where(eq(sessionRoster.sessionId, sessionId));

      for (const { studentId } of roster) {
        await db
          .insert(presenceStates)
          .values({
            sessionId,
            studentId,
            state: 'missing',
            lastUpdatedAt: new Date(),
          })
          .onConflictDoNothing();
      }
    },

    async upsertPresenceOverride(input) {
      const { getDb } = await import('@/db');
      const { presenceStates } = await import('@/db/schema');
      const db = getDb();
      await db
        .insert(presenceStates)
        .values({
          sessionId: input.sessionId,
          studentId: input.studentId,
          state: input.state,
          manualOverride: true,
          manualOverrideNote: input.note,
          manualOverrideBy: input.overrideBy,
          lastUpdatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [presenceStates.sessionId, presenceStates.studentId],
          set: {
            state: input.state,
            manualOverride: true,
            manualOverrideNote: input.note,
            manualOverrideBy: input.overrideBy,
            lastUpdatedAt: new Date(),
          },
        });
    },

    async getSessionById(id) {
      const { getDb } = await import('@/db');
      const { sessions } = await import('@/db/schema');
      const { eq } = await import('drizzle-orm');
      const db = getDb();
      const rows = await db.select().from(sessions).where(eq(sessions.id, id)).limit(1);
      return rows[0] ?? null;
    },

    async getRosterStudentIds(sessionId) {
      const { getDb } = await import('@/db');
      const { sessionRoster } = await import('@/db/schema');
      const { eq } = await import('drizzle-orm');
      const db = getDb();
      const rows = await db
        .select({ studentId: sessionRoster.studentId })
        .from(sessionRoster)
        .where(eq(sessionRoster.sessionId, sessionId));
      return rows.map((r) => r.studentId);
    },
  };
}
