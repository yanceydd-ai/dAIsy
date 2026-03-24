import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { COMPLIANCE_OFFICER } from '@/lib/auth/roles';
import { queryAuditLog } from '@/lib/audit/auditService';
import { makeAuditDb } from '@/lib/audit/auditDb';

export async function GET(req: NextRequest) {
  try {
    await requireRole(COMPLIANCE_OFFICER);
  } catch (err) {
    return err as Response;
  }

  const { searchParams } = req.nextUrl;
  const from = searchParams.get('from') ? new Date(searchParams.get('from')!) : undefined;
  const to = searchParams.get('to') ? new Date(searchParams.get('to')!) : undefined;
  const userUpn = searchParams.get('userUpn') ?? undefined;
  const action = searchParams.get('action') ?? undefined;
  const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 0;

  const result = await queryAuditLog(makeAuditDb(), { from, to, userUpn, action, page, pageSize: 50 });
  return NextResponse.json(result);
}
