import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { IT_ADMIN } from '@/lib/auth/roles';
import { importTagsCsv, type CsvRow } from '@/lib/tags/tagService';
import { makeTagDb } from '@/lib/tags/tagDb';
import Papa from 'papaparse';

export async function POST(req: NextRequest) {
  let session;
  try {
    session = await requireRole(IT_ADMIN);
  } catch (err) {
    return err as Response;
  }

  const formData = await req.formData();
  const file = formData.get('file');
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'file is required' }, { status: 400 });
  }

  const text = await file.text();
  const parsed = Papa.parse<CsvRow>(text, { header: true, skipEmptyLines: true });

  const result = await importTagsCsv(makeTagDb(), parsed.data, session.user.email ?? 'unknown');
  return NextResponse.json(result);
}
