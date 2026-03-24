import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/requireRole';

// GET /api/presence/current — snapshot (STORY-008)
// Any authenticated role.
export async function GET(request: Request) {
  try {
    await requireAuth();
  } catch (err) {
    return err as Response;
  }

  return NextResponse.json({ message: 'Snapshot endpoint — implemented in STORY-008' }, { status: 501 });
}
