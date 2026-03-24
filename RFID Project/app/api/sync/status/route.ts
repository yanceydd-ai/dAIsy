import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { IT_ADMIN } from '@/lib/auth/roles';

// GET /api/sync/status — IT_ADMIN only
export async function GET() {
  try {
    await requireRole(IT_ADMIN);
  } catch (err) {
    return err as Response;
  }

  return NextResponse.json({ message: 'Sync status — implemented in STORY-016' }, { status: 501 });
}
