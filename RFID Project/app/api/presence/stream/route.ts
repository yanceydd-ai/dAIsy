import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/requireRole';

// GET /api/presence/stream — SSE live updates (STORY-008)
// Any authenticated role.
export async function GET(request: Request) {
  try {
    await requireAuth();
  } catch (err) {
    return err as Response;
  }

  // Full SSE implementation in STORY-008.
  return NextResponse.json({ message: 'SSE endpoint — implemented in STORY-008' }, { status: 501 });
}
