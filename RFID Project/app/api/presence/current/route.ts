import { type NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/requireRole';
import { getPresenceSnapshot } from '@/lib/presence/snapshot';

// GET /api/presence/current — non-streaming snapshot (STORY-008)
// Any authenticated role.
export async function GET(req: NextRequest) {
  try {
    await requireAuth();
  } catch (err) {
    return err as Response;
  }

  const sessionId = req.nextUrl.searchParams.get('sessionId') ?? null;

  try {
    const snapshot = await getPresenceSnapshot(sessionId);
    return NextResponse.json(snapshot);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
