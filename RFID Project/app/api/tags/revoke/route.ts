import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { IT_ADMIN } from '@/lib/auth/roles';
import { revokeTag } from '@/lib/tags/tagService';
import { makeTagDb } from '@/lib/tags/tagDb';

export async function POST(req: NextRequest) {
  let session;
  try {
    session = await requireRole(IT_ADMIN);
  } catch (err) {
    return err as Response;
  }

  const body = (await req.json()) as { tagId?: string; reason?: string };
  if (!body.tagId || !body.reason) {
    return NextResponse.json({ error: 'tagId and reason are required' }, { status: 400 });
  }

  try {
    await revokeTag(makeTagDb(), { tagId: body.tagId, reason: body.reason }, session.user.email ?? 'unknown');
    return NextResponse.json({ ok: true });
  } catch (err) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json({ error: e.message ?? 'Internal server error' }, { status: e.status ?? 500 });
  }
}
