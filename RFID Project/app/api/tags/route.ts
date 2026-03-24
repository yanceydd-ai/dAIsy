import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { IT_ADMIN } from '@/lib/auth/roles';
import { makeTagDb } from '@/lib/tags/tagDb';

export async function GET() {
  try {
    await requireRole(IT_ADMIN);
  } catch (err) {
    return err as Response;
  }

  const db = makeTagDb();
  const [tags, untaggedCount] = await Promise.all([db.getAllTags(), db.getUntaggedStudentCount()]);
  return NextResponse.json({ tags, untaggedCount });
}
