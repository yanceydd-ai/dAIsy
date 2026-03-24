import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { IT_ADMIN } from '@/lib/auth/roles';

// POST /api/sync/blackbaud — IT_ADMIN only
export async function POST() {
  try {
    await requireRole(IT_ADMIN);
  } catch (err) {
    return err as Response;
  }

  return NextResponse.json({ message: 'Blackbaud sync — implemented in STORY-009' }, { status: 501 });
}
