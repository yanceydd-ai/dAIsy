import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { requireRole } from '@/lib/auth/requireRole';
import { SAFETY_OFFICER, ACTIVITIES_COORDINATOR, getRoleFromGroups } from '@/lib/auth/roles';
import { endSession, createSessionDb } from '@/lib/sessions/sessionService';

// PATCH /api/sessions/:id/end — SAFETY_OFFICER or ACTIVITIES_COORDINATOR
export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole([SAFETY_OFFICER, ACTIVITIES_COORDINATOR]);
  } catch (err) {
    return err as Response;
  }

  const { id } = await params;
  const session = await auth();
  const userUpn = session?.user?.email ?? 'unknown';
  const userRole = getRoleFromGroups(session?.user?.azureAdGroups ?? []) ?? 'unknown';

  try {
    const db = createSessionDb();
    await endSession(db, id, userUpn, String(userRole));
    return NextResponse.json({ status: 'ended' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
