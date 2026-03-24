import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { IT_ADMIN } from '@/lib/auth/roles';
import { BlackbaudClient } from '@/lib/integrations/blackbaud';
import { runFullSync, createSyncDb } from '@/lib/integrations/blackbaudSync';

// POST /api/sync/blackbaud — IT_ADMIN only — triggers immediate full sync
export async function POST() {
  try {
    await requireRole(IT_ADMIN);
  } catch (err) {
    return err as Response;
  }

  // Fire and forget — sync runs in background
  const db = createSyncDb();
  const client = new BlackbaudClient();
  runFullSync(db, client).catch((err: unknown) => {
    console.error('[Blackbaud] Manual sync failed:', err);
  });

  return NextResponse.json({ status: 'started' });
}
