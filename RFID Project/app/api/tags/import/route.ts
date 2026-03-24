import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { IT_ADMIN } from '@/lib/auth/roles';

// POST /api/tags/import — IT_ADMIN only
export async function POST() {
  try {
    await requireRole(IT_ADMIN);
  } catch (err) {
    return err as Response;
  }

  return NextResponse.json({ message: 'Tag import — implemented in STORY-013' }, { status: 501 });
}
