import { NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth/requireRole';
import { SAFETY_OFFICER, ACTIVITIES_COORDINATOR } from '@/lib/auth/roles';

// GET /api/sessions — any authenticated role
export async function GET() {
  try {
    await requireAuth();
  } catch (err) {
    return err as Response;
  }

  return NextResponse.json({ message: 'Sessions list — implemented in STORY-010' }, { status: 501 });
}

// POST /api/sessions — SAFETY_OFFICER or ACTIVITIES_COORDINATOR
export async function POST() {
  try {
    await requireRole([SAFETY_OFFICER, ACTIVITIES_COORDINATOR]);
  } catch (err) {
    return err as Response;
  }

  return NextResponse.json({ message: 'Session create — implemented in STORY-010' }, { status: 501 });
}
