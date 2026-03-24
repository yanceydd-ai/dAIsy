import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { requireAuth, requireRole } from '@/lib/auth/requireRole';
import { SAFETY_OFFICER, ACTIVITIES_COORDINATOR } from '@/lib/auth/roles';
import { getRoleFromGroups } from '@/lib/auth/roles';
import { createSession, createSessionDb } from '@/lib/sessions/sessionService';

// GET /api/sessions — any authenticated role — returns today's sessions
export async function GET() {
  try {
    await requireAuth();
  } catch (err) {
    return err as Response;
  }

  try {
    const db = createSessionDb();
    const sessions = await db.getTodaySessions();
    return NextResponse.json({ sessions });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/sessions — SAFETY_OFFICER or ACTIVITIES_COORDINATOR
export async function POST(req: NextRequest) {
  try {
    await requireRole([SAFETY_OFFICER, ACTIVITIES_COORDINATOR]);
  } catch (err) {
    return err as Response;
  }

  const session = await auth();
  const userUpn = session?.user?.email ?? 'unknown';
  const userRole = getRoleFromGroups(session?.user?.azureAdGroups ?? []) ?? 'unknown';

  let body: { label?: string; scheduledStart?: string; scheduledEnd?: string; rosterStudentIds?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const db = createSessionDb();
    const sessionId = await createSession(
      db,
      {
        label: body.label ?? '',
        scheduledStart: body.scheduledStart ? new Date(body.scheduledStart) : new Date(NaN),
        scheduledEnd: body.scheduledEnd ? new Date(body.scheduledEnd) : new Date(NaN),
        rosterStudentIds: body.rosterStudentIds ?? [],
        createdBy: userUpn,
      },
      userUpn,
      String(userRole),
    );
    return NextResponse.json({ sessionId }, { status: 201 });
  } catch (err: unknown) {
    const e = err as { status?: number; message?: string };
    const status = e.status === 400 ? 400 : 500;
    return NextResponse.json({ error: e.message ?? 'Internal error' }, { status });
  }
}
