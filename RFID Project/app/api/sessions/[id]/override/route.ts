import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { requireAuth } from '@/lib/auth/requireRole';
import { getRoleFromGroups } from '@/lib/auth/roles';
import { overridePresence, createSessionDb } from '@/lib/sessions/sessionService';

// POST /api/sessions/:id/override — any authenticated role
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth();
  } catch (err) {
    return err as Response;
  }

  const { id: sessionId } = await params;
  const session = await auth();
  const userUpn = session?.user?.email ?? 'unknown';
  const userRole = getRoleFromGroups(session?.user?.azureAdGroups ?? []) ?? 'unknown';

  let body: { studentId?: string; state?: string; note?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.studentId || !body.state) {
    return NextResponse.json({ error: 'studentId and state are required' }, { status: 400 });
  }

  try {
    const db = createSessionDb();
    await overridePresence(
      db,
      {
        sessionId,
        studentId: body.studentId,
        state: body.state,
        note: body.note ?? '',
        overrideBy: userUpn,
      },
      userUpn,
      String(userRole),
    );
    return NextResponse.json({ status: 'ok' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
