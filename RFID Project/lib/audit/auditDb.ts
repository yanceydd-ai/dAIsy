import { getDb } from '@/db';
import { auditLog, rawReads, crossingEvents, sessions, presenceStates, appConfig } from '@/db/schema';
import { lt, and, gte, lte, eq, ilike, count } from 'drizzle-orm';
import { DEFAULT_RETENTION, type AuditDb, type AuditEntry, type AuditQueryParams, type RetentionConfig } from './auditService';

export function makeAuditDb(): AuditDb {
  const db = getDb();
  return {
    async queryAuditLog({ from, to, userUpn, action, page = 0, pageSize = 50 }) {
      const conditions = [];
      if (from) conditions.push(gte(auditLog.ts, from));
      if (to) conditions.push(lte(auditLog.ts, to));
      if (userUpn) conditions.push(ilike(auditLog.userUpn, `%${userUpn}%`));
      if (action) conditions.push(eq(auditLog.action, action));

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const [rows, totalRows] = await Promise.all([
        db
          .select()
          .from(auditLog)
          .where(where)
          .orderBy(auditLog.ts)
          .limit(pageSize)
          .offset(page * pageSize),
        db.select({ value: count() }).from(auditLog).where(where),
      ]);

      return {
        entries: rows.map((r): AuditEntry => ({
          id: r.id,
          ts: r.ts.toISOString(),
          userUpn: r.userUpn,
          userRole: r.userRole,
          action: r.action,
          resourceType: r.resourceType ?? null,
          resourceId: r.resourceId ?? null,
          detail: r.detail as Record<string, unknown> | null,
          ipAddress: r.ipAddress ?? null,
        })),
        total: Number(totalRows[0]?.value ?? 0),
      };
    },

    async getRetentionConfig() {
      const rows = await db
        .select({ key: appConfig.key, value: appConfig.value })
        .from(appConfig)
        .where(
          and(
            // fetch all retention keys in one query
          ),
        );
      // fallback: just fetch all config and filter
      const allConfig = await db.select().from(appConfig);
      const get = (key: string, defaultVal: string) =>
        allConfig.find((r) => r.key === key)?.value ?? defaultVal;

      return {
        rawReadsDays: parseInt(get('retention_raw_reads_days', String(DEFAULT_RETENTION.rawReadsDays))),
        crossingEventsDays: parseInt(get('retention_crossing_events_days', String(DEFAULT_RETENTION.crossingEventsDays))),
        presenceSessionsDays:
          get('retention_presence_sessions_days', 'indefinite') === 'indefinite'
            ? null
            : parseInt(get('retention_presence_sessions_days', 'indefinite')),
      };
    },

    async setRetentionConfig(config, updatedBy) {
      const now = new Date();
      const entries = [
        { key: 'retention_raw_reads_days', value: String(config.rawReadsDays), updatedAt: now, updatedBy },
        { key: 'retention_crossing_events_days', value: String(config.crossingEventsDays), updatedAt: now, updatedBy },
        {
          key: 'retention_presence_sessions_days',
          value: config.presenceSessionsDays === null ? 'indefinite' : String(config.presenceSessionsDays),
          updatedAt: now,
          updatedBy,
        },
      ];
      for (const entry of entries) {
        await db
          .insert(appConfig)
          .values(entry)
          .onConflictDoUpdate({ target: appConfig.key, set: { value: entry.value, updatedAt: entry.updatedAt, updatedBy: entry.updatedBy } });
      }
    },

    async deleteRawReadsOlderThan(cutoff) {
      const result = await db.delete(rawReads).where(lt(rawReads.ts, cutoff));
      return result.rowCount ?? 0;
    },

    async deleteCrossingEventsOlderThan(cutoff) {
      const result = await db.delete(crossingEvents).where(lt(crossingEvents.ts, cutoff));
      return result.rowCount ?? 0;
    },

    async deletePresenceSessionsOlderThan(cutoff) {
      // Find ended sessions older than cutoff
      const old = await db
        .select({ id: sessions.id })
        .from(sessions)
        .where(and(lt(sessions.actualEnd, cutoff)));

      if (old.length === 0) return 0;
      // Delete their presence states first (FK), then the sessions
      for (const s of old) {
        await db.delete(presenceStates).where(eq(presenceStates.sessionId, s.id));
        await db.delete(sessions).where(eq(sessions.id, s.id));
      }
      return old.length;
    },

    async insertAuditLog(entry) {
      await db.insert(auditLog).values({
        userUpn: entry.userUpn,
        userRole: entry.userRole,
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId ?? null,
        detail: entry.detail,
      });
    },
  };
}
