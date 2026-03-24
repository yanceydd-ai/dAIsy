import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { IT_ADMIN } from '@/lib/auth/roles';
import { createSyncDb } from '@/lib/integrations/blackbaudSync';

// GET /api/sync/status — IT_ADMIN only — returns last 10 sync log entries
export async function GET() {
  try {
    await requireRole(IT_ADMIN);
  } catch (err) {
    return err as Response;
  }

  try {
    const db = createSyncDb();
    const logs = await db.getRecentSyncLogs(10);
    return NextResponse.json({ logs });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
