import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { COMPLIANCE_OFFICER } from '@/lib/auth/roles';

// GET /api/audit — COMPLIANCE_OFFICER only
export async function GET() {
  try {
    await requireRole(COMPLIANCE_OFFICER);
  } catch (err) {
    return err as Response;
  }

  return NextResponse.json({ message: 'Audit log — implemented in STORY-015' }, { status: 501 });
}
