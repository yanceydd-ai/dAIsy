import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { COMPLIANCE_OFFICER } from '@/lib/auth/roles';
import { getRetentionConfig, saveRetentionConfig, type RetentionConfig } from '@/lib/audit/auditService';
import { makeAuditDb } from '@/lib/audit/auditDb';

export async function GET() {
  try {
    await requireRole(COMPLIANCE_OFFICER);
  } catch (err) {
    return err as Response;
  }
  const config = await getRetentionConfig(makeAuditDb());
  return NextResponse.json(config);
}

export async function POST(req: NextRequest) {
  let session;
  try {
    session = await requireRole(COMPLIANCE_OFFICER);
  } catch (err) {
    return err as Response;
  }

  const body = (await req.json()) as Partial<RetentionConfig>;
  const config: RetentionConfig = {
    rawReadsDays: body.rawReadsDays ?? 30,
    crossingEventsDays: body.crossingEventsDays ?? 365,
    presenceSessionsDays: body.presenceSessionsDays ?? null,
  };

  await saveRetentionConfig(makeAuditDb(), config, session.user.email ?? 'unknown');
  return NextResponse.json({ ok: true });
}
