import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { SAFETY_OFFICER } from '@/lib/auth/roles';
import { generateExport, type ExportDb } from '@/lib/export/exportService';
import { AzureBlobStorage } from '@/lib/export/blobStorage';
import { getDb } from '@/db';
import { sessions, presenceStates, students, auditLog } from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';

// ─── DB adapter ───────────────────────────────────────────────────────────────

function makeExportDb(): ExportDb {
  const db = getDb();
  return {
    async getPresenceForExport(sessionId) {
      let sessionLabel: string | null = null;
      if (sessionId) {
        const rows = await db.select({ label: sessions.label }).from(sessions).where(eq(sessions.id, sessionId)).limit(1);
        sessionLabel = rows[0]?.label ?? null;
      } else {
        const rows = await db
          .select({ id: sessions.id, label: sessions.label })
          .from(sessions)
          .where(eq(sessions.status, 'active'))
          .limit(1);
        if (rows[0]) sessionLabel = rows[0].label;
      }

      const presenceRows = sessionId
        ? await db
            .select({
              studentId: students.id,
              firstName: students.firstName,
              lastName: students.lastName,
              grade: students.grade,
              state: presenceStates.state,
              lastCrossingTs: presenceStates.lastUpdatedAt,
              manualOverride: presenceStates.manualOverride,
            })
            .from(presenceStates)
            .innerJoin(students, eq(presenceStates.studentId, students.id))
            .where(and(eq(presenceStates.sessionId, sessionId)))
        : await db
            .select({
              studentId: students.id,
              firstName: students.firstName,
              lastName: students.lastName,
              grade: students.grade,
              state: presenceStates.state,
              lastCrossingTs: presenceStates.lastUpdatedAt,
              manualOverride: presenceStates.manualOverride,
            })
            .from(presenceStates)
            .innerJoin(students, eq(presenceStates.studentId, students.id))
            .where(isNull(presenceStates.sessionId));

      return {
        sessionLabel,
        students: presenceRows.map((r) => ({
          studentId: r.studentId,
          firstName: r.firstName,
          lastName: r.lastName,
          grade: r.grade,
          state: r.state as 'present' | 'missing' | 'unknown',
          lastCrossingTs: r.lastCrossingTs?.toISOString() ?? null,
          lastCrossingDoor: null,
          manualOverride: r.manualOverride,
        })),
      };
    },

    async insertAuditLog(entry) {
      await db.insert(auditLog).values({
        userUpn: entry.userUpn,
        userRole: entry.userRole,
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId ?? null,
        detail: entry.detail,
      });
    },
  };
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole(SAFETY_OFFICER);
    const body = (await req.json()) as { sessionId?: string; format?: string };

    const format = body.format === 'pdf' || body.format === 'csv' ? body.format : null;
    if (!format) {
      return NextResponse.json({ error: 'format must be pdf or csv' }, { status: 400 });
    }

    const result = await generateExport(
      makeExportDb(),
      new AzureBlobStorage(),
      body.sessionId ?? null,
      format,
      session.user.email ?? session.user.name ?? 'unknown',
      SAFETY_OFFICER,
    );

    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof Response) throw err;
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
