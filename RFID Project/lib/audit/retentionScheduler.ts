import cron from 'node-cron';
import { runRetentionPurge } from './auditService';
import { makeAuditDb } from './auditDb';

let _started = false;

export function startRetentionScheduler(): void {
  if (_started) return;
  if (typeof window !== 'undefined') return;
  _started = true;

  // Nightly retention purge at 3:00 AM
  cron.schedule('0 3 * * *', async () => {
    console.log('[Retention] Starting nightly data retention purge');
    try {
      const result = await runRetentionPurge(makeAuditDb());
      console.log(`[Retention] Purge complete — raw_reads: ${result.rawReadsDeleted}, crossing_events: ${result.crossingEventsDeleted}, sessions: ${result.presenceSessionsDeleted}`);
    } catch (err) {
      console.error('[Retention] Purge failed:', err);
    }
  });

  console.log('[Retention] Scheduler started — nightly purge at 03:00');
}
