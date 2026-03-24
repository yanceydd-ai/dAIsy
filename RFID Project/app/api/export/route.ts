import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { SAFETY_OFFICER } from '@/lib/auth/roles';

// POST /api/export — SAFETY_OFFICER only
export async function POST() {
  try {
    await requireRole(SAFETY_OFFICER);
  } catch (err) {
    return err as Response;
  }

  return NextResponse.json({ message: 'Export — implemented in STORY-012' }, { status: 501 });
}
