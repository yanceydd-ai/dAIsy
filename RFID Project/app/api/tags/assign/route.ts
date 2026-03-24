import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { IT_ADMIN } from '@/lib/auth/roles';
import { assignTag } from '@/lib/tags/tagService';
import { makeTagDb } from '@/lib/tags/tagDb';

export async function POST(req: NextRequest) {
  let session;
  try {
    session = await requireRole(IT_ADMIN);
  } catch (err) {
    return err as Response;
  }

  const body = (await req.json()) as { epc?: string; studentId?: string };
  if (!body.epc || !body.studentId) {
    return NextResponse.json({ error: 'epc and studentId are required' }, { status: 400 });
  }

  try {
    const result = await assignTag(makeTagDb(), { epc: body.epc, studentId: body.studentId }, session.user.email ?? 'unknown');
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e.message ?? 'Internal server error' }, { status: e.status ?? 500 });
  }
}
