import cron from 'node-cron';
import { BlackbaudClient } from './blackbaud';
import { runFullSync, runDeltaSync, createSyncDb } from './blackbaudSync';

let _started = false;

export function startBlackbaudScheduler(): void {
  if (_started) return;
  if (typeof window !== 'undefined') return; // browser — skip
  _started = true;

  const client = new BlackbaudClient();
  const db = createSyncDb();

  // Nightly full sync at 2:00 AM server time
  cron.schedule('0 2 * * *', async () => {
    console.log('[Blackbaud] Starting nightly full sync');
    await runFullSync(db, client).catch((err: unknown) => {
      console.error('[Blackbaud] Nightly sync failed:', err);
    });
  });

  // Delta sync every 30 minutes during school hours (7:00 AM – 6:00 PM, Mon–Fri)
  cron.schedule('*/30 7-17 * * 1-5', async () => {
    console.log('[Blackbaud] Starting delta sync');
    await runDeltaSync(db, client).catch((err: unknown) => {
      console.error('[Blackbaud] Delta sync failed:', err);
    });
  });

  console.log('[Blackbaud] Scheduler started — nightly sync at 02:00, delta sync every 30min (school hours Mon-Fri)');
}
