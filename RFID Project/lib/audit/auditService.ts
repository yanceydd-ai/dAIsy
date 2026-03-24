import { AUDIT_ACTIONS } from './actions';
import { COMPLIANCE_OFFICER } from '@/lib/auth/roles';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuditEntry {
  id: string;
  ts: string;
  userUpn: string;
  userRole: string;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  detail: Record<string, unknown> | null;
  ipAddress: string | null;
}

export interface AuditQueryParams {
  from?: Date;
  to?: Date;
  userUpn?: string;
  action?: string;
  page?: number;   // 0-based
  pageSize?: number;
}

export interface AuditPage {
  entries: AuditEntry[];
  total: number;
  page: number;
  pageSize: number;
}

export interface RetentionConfig {
  rawReadsDays: number;
  crossingEventsDays: number;
  presenceSessionsDays: number | null; // null = indefinite
}

export interface AuditDb {
  // Queries (read-only — audit_log must never be mutated)
  queryAuditLog(params: AuditQueryParams): Promise<{ entries: AuditEntry[]; total: number }>;

  // Retention config
  getRetentionConfig(): Promise<RetentionConfig>;
  setRetentionConfig(config: RetentionConfig, updatedBy: string): Promise<void>;

  // Retention purge
  deleteRawReadsOlderThan(cutoff: Date): Promise<number>;
  deleteCrossingEventsOlderThan(cutoff: Date): Promise<number>;
  deletePresenceSessionsOlderThan(cutoff: Date): Promise<number>;

  // Audit log write (for purge self-logging)
  insertAuditLog(entry: {
    userUpn: string;
    userRole: string;
    action: string;
    resourceType: string;
    resourceId: string | null;
    detail: Record<string, unknown>;
  }): Promise<void>;
}

// ─── Default config ───────────────────────────────────────────────────────────

export const DEFAULT_RETENTION: RetentionConfig = {
  rawReadsDays: 30,
  crossingEventsDays: 365,
  presenceSessionsDays: null,
};

// ─── Audit log query ──────────────────────────────────────────────────────────

export async function queryAuditLog(
  db: AuditDb,
  params: AuditQueryParams,
): Promise<AuditPage> {
  const pageSize = params.pageSize ?? 50;
  const page = params.page ?? 0;
  const { entries, total } = await db.queryAuditLog({ ...params, pageSize, page });
  return { entries, total, page, pageSize };
}

// ─── Retention config ─────────────────────────────────────────────────────────

export async function getRetentionConfig(db: AuditDb): Promise<RetentionConfig> {
  return db.getRetentionConfig();
}

export async function saveRetentionConfig(
  db: AuditDb,
  config: RetentionConfig,
  userUpn: string,
): Promise<void> {
  await db.setRetentionConfig(config, userUpn);
  await db.insertAuditLog({
    userUpn,
    userRole: COMPLIANCE_OFFICER,
    action: AUDIT_ACTIONS.RETENTION_CONFIG_UPDATED,
    resourceType: 'app_config',
    resourceId: null,
    detail: config as unknown as Record<string, unknown>,
  });
}

// ─── Retention purge ──────────────────────────────────────────────────────────

export interface PurgeResult {
  rawReadsDeleted: number;
  crossingEventsDeleted: number;
  presenceSessionsDeleted: number;
}

export async function runRetentionPurge(db: AuditDb, now: Date = new Date()): Promise<PurgeResult> {
  const config = await db.getRetentionConfig();

  const rawReadsCutoff = new Date(now.getTime() - config.rawReadsDays * 86_400_000);
  const crossingCutoff = new Date(now.getTime() - config.crossingEventsDays * 86_400_000);

  const rawReadsDeleted = await db.deleteRawReadsOlderThan(rawReadsCutoff);
  const crossingEventsDeleted = await db.deleteCrossingEventsOlderThan(crossingCutoff);
  let presenceSessionsDeleted = 0;

  if (config.presenceSessionsDays !== null) {
    const sessionCutoff = new Date(now.getTime() - config.presenceSessionsDays * 86_400_000);
    presenceSessionsDeleted = await db.deletePresenceSessionsOlderThan(sessionCutoff);
  }

  await db.insertAuditLog({
    userUpn: 'system',
    userRole: 'system',
    action: AUDIT_ACTIONS.RETENTION_PURGE,
    resourceType: 'retention',
    resourceId: null,
    detail: { rawReadsDeleted, crossingEventsDeleted, presenceSessionsDeleted, ranAt: now.toISOString() },
  });

  return { rawReadsDeleted, crossingEventsDeleted, presenceSessionsDeleted };
}

// ─── Last sync failure detection ─────────────────────────────────────────────

export function lastSyncFailed(logs: Array<{ errorMessage: string | null; completedAt: Date | null }>): boolean {
  const completed = logs.filter((l) => l.completedAt !== null);
  if (completed.length === 0) return false;
  return completed[0].errorMessage !== null;
}

// ─── Next scheduled sync times ────────────────────────────────────────────────

export function nextFullSyncTime(from: Date = new Date()): Date {
  // Nightly at 2:00 AM
  const next = new Date(from);
  next.setHours(2, 0, 0, 0);
  if (next <= from) next.setDate(next.getDate() + 1);
  return next;
}

export function nextDeltaSyncTime(from: Date = new Date()): Date {
  // Every 30 minutes, 7:00–17:00 Mon–Fri
  const next = new Date(from);
  const h = next.getHours();
  const m = next.getMinutes();
  const day = next.getDay(); // 0=Sun, 6=Sat

  // Advance to next 30-min slot within window
  let targetMin = m < 30 ? 30 : 60;
  if (targetMin === 60) { next.setHours(h + 1, 0, 0, 0); }
  else { next.setMinutes(targetMin, 0, 0); }

  // If outside window or weekend, advance to next Monday 7:00
  const ensureInWindow = (d: Date): Date => {
    let attempt = new Date(d);
    for (let i = 0; i < 7; i++) {
      const dow = attempt.getDay();
      const hr = attempt.getHours();
      if (dow >= 1 && dow <= 5 && hr >= 7 && hr < 17) return attempt;
      // Jump to next boundary
      if (hr >= 17 || dow === 0 || dow === 6) {
        attempt.setDate(attempt.getDate() + 1);
        attempt.setHours(7, 0, 0, 0);
      } else if (hr < 7) {
        attempt.setHours(7, 0, 0, 0);
      } else {
        break;
      }
    }
    return attempt;
  };

  return ensureInWindow(next);
}
