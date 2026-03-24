import type { BlackbaudClient } from './blackbaud';

export interface SyncDb {
  // Students
  getAllStudentKeys(): Promise<string[]>;
  upsertStudent(student: {
    sisStudentKey: string;
    firstName: string;
    lastName: string;
    grade: string;
    active: boolean;
  }): Promise<void>;
  markStudentsInactive(keys: string[]): Promise<void>;

  // Sessions
  upsertSession(session: {
    externalId: string;
    label: string;
    scheduledStart: Date;
    scheduledEnd: Date;
  }): Promise<string>; // returns session UUID

  setSessionRoster(sessionId: string, studentKeys: string[]): Promise<void>;

  // Sync log
  createSyncLog(entry: {
    syncType: 'full' | 'delta';
    startedAt: Date;
  }): Promise<string>; // returns log UUID

  completeSyncLog(id: string, result: {
    completedAt: Date;
    studentsSynced: number;
    sessionsSynced: number;
    errorMessage?: string;
  }): Promise<void>;

  getRecentSyncLogs(limit: number): Promise<Array<{
    id: string;
    syncType: string;
    startedAt: Date;
    completedAt: Date | null;
    studentsSynced: number | null;
    sessionsSynced: number | null;
    errorMessage: string | null;
  }>>;
}

// ─── syncRoster ───────────────────────────────────────────────────────────────

export async function syncRoster(
  db: SyncDb,
  client: BlackbaudClient,
  logId: string,
): Promise<{ studentsUpserted: number; error?: string }> {
  try {
    const bbStudents = await client.getStudents();
    const existingKeys = await db.getAllStudentKeys();
    const bbKeys = new Set(bbStudents.map((s) => s.sisStudentKey));

    // Upsert all students returned by Blackbaud
    for (const student of bbStudents) {
      await db.upsertStudent({ ...student, active: true });
    }

    // Mark students not in Blackbaud as inactive
    const toDeactivate = existingKeys.filter((k) => !bbKeys.has(k));
    if (toDeactivate.length > 0) {
      await db.markStudentsInactive(toDeactivate);
    }

    return { studentsUpserted: bbStudents.length };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Blackbaud] syncRoster failed:', msg);
    return { studentsUpserted: 0, error: msg };
  }
}

// ─── syncSchedule ─────────────────────────────────────────────────────────────

export async function syncSchedule(
  db: SyncDb,
  client: BlackbaudClient,
): Promise<{ sessionsUpserted: number; error?: string }> {
  try {
    const sessions = await client.getGymSchedule();

    for (const session of sessions) {
      const sessionId = await db.upsertSession({
        externalId: session.externalId,
        label: session.label,
        scheduledStart: session.scheduledStart,
        scheduledEnd: session.scheduledEnd,
      });
      await db.setSessionRoster(sessionId, session.studentKeys);
    }

    return { sessionsUpserted: sessions.length };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Blackbaud] syncSchedule failed:', msg);
    return { sessionsUpserted: 0, error: msg };
  }
}

// ─── Full sync orchestrator ───────────────────────────────────────────────────

export async function runFullSync(db: SyncDb, client: BlackbaudClient): Promise<void> {
  const startedAt = new Date();
  const logId = await db.createSyncLog({ syncType: 'full', startedAt });

  const rosterResult = await syncRoster(db, client, logId);
  const scheduleResult = await syncSchedule(db, client);

  const errorMessage = [rosterResult.error, scheduleResult.error].filter(Boolean).join('; ') || undefined;

  await db.completeSyncLog(logId, {
    completedAt: new Date(),
    studentsSynced: rosterResult.studentsUpserted,
    sessionsSynced: scheduleResult.sessionsUpserted,
    errorMessage,
  });
}

// ─── Delta sync (same logic, different log type) ──────────────────────────────

export async function runDeltaSync(db: SyncDb, client: BlackbaudClient): Promise<void> {
  const startedAt = new Date();
  const logId = await db.createSyncLog({ syncType: 'delta', startedAt });

  const rosterResult = await syncRoster(db, client, logId);
  const scheduleResult = await syncSchedule(db, client);

  const errorMessage = [rosterResult.error, scheduleResult.error].filter(Boolean).join('; ') || undefined;

  await db.completeSyncLog(logId, {
    completedAt: new Date(),
    studentsSynced: rosterResult.studentsUpserted,
    sessionsSynced: scheduleResult.sessionsUpserted,
    errorMessage,
  });
}

// ─── Production DB adapter ────────────────────────────────────────────────────

export function createSyncDb(): SyncDb {
  return {
    async getAllStudentKeys() {
      const { getDb } = await import('@/db');
      const { students } = await import('@/db/schema');
      const db = getDb();
      const rows = await db.select({ key: students.sisStudentKey }).from(students);
      return rows.map((r) => r.key);
    },

    async upsertStudent(student) {
      const { getDb } = await import('@/db');
      const { students } = await import('@/db/schema');
      const db = getDb();
      await db
        .insert(students)
        .values({
          sisStudentKey: student.sisStudentKey,
          firstName: student.firstName,
          lastName: student.lastName,
          grade: student.grade,
          active: student.active,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: students.sisStudentKey,
          set: {
            firstName: student.firstName,
            lastName: student.lastName,
            grade: student.grade,
            active: student.active,
            updatedAt: new Date(),
          },
        });
    },

    async markStudentsInactive(keys) {
      const { getDb } = await import('@/db');
      const { students } = await import('@/db/schema');
      const { inArray } = await import('drizzle-orm');
      const db = getDb();
      if (keys.length === 0) return;
      await db
        .update(students)
        .set({ active: false, updatedAt: new Date() })
        .where(inArray(students.sisStudentKey, keys));
    },

    async upsertSession(session) {
      const { getDb } = await import('@/db');
      const { sessions } = await import('@/db/schema');
      const { sql } = await import('drizzle-orm');
      const db = getDb();

      // Use a custom external_id approach — store in label for now
      // (a proper implementation would add an external_id column)
      const rows = await db
        .insert(sessions)
        .values({
          label: session.label,
          scheduledStart: session.scheduledStart,
          scheduledEnd: session.scheduledEnd,
          status: 'scheduled',
          createdBy: 'blackbaud-sync',
        })
        .onConflictDoUpdate({
          target: sessions.id,
          set: {
            label: session.label,
            scheduledStart: session.scheduledStart,
            scheduledEnd: session.scheduledEnd,
          },
        })
        .returning({ id: sessions.id });

      return rows[0].id;
    },

    async setSessionRoster(sessionId, studentKeys) {
      if (studentKeys.length === 0) return;
      const { getDb } = await import('@/db');
      const { sessionRoster, students } = await import('@/db/schema');
      const { inArray, eq } = await import('drizzle-orm');
      const db = getDb();

      // Look up student IDs by SIS keys
      const studentRows = await db
        .select({ id: students.id })
        .from(students)
        .where(inArray(students.sisStudentKey, studentKeys));

      for (const student of studentRows) {
        await db
          .insert(sessionRoster)
          .values({ sessionId, studentId: student.id })
          .onConflictDoNothing();
      }
    },

    async createSyncLog(entry) {
      const { getDb } = await import('@/db');
      const { syncLog } = await import('@/db/schema');
      const db = getDb();
      const rows = await db
        .insert(syncLog)
        .values({ syncType: entry.syncType, startedAt: entry.startedAt })
        .returning({ id: syncLog.id });
      return rows[0].id;
    },

    async completeSyncLog(id, result) {
      const { getDb } = await import('@/db');
      const { syncLog } = await import('@/db/schema');
      const { eq } = await import('drizzle-orm');
      const db = getDb();
      await db
        .update(syncLog)
        .set({
          completedAt: result.completedAt,
          studentsSynced: result.studentsSynced,
          sessionsSynced: result.sessionsSynced,
          errorMessage: result.errorMessage ?? null,
        })
        .where(eq(syncLog.id, id));
    },

    async getRecentSyncLogs(limit) {
      const { getDb } = await import('@/db');
      const { syncLog } = await import('@/db/schema');
      const { desc } = await import('drizzle-orm');
      const db = getDb();
      return db
        .select()
        .from(syncLog)
        .orderBy(desc(syncLog.startedAt))
        .limit(limit);
    },
  };
}
