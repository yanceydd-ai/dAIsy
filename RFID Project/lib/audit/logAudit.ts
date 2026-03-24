import type { AuditAction } from './actions';

interface LogAuditParams {
  userUpn: string;
  userRole: string;
  action: AuditAction;
  resourceType?: string;
  resourceId?: string;
  detail?: Record<string, unknown>;
  ipAddress?: string;
}

// Writes an immutable audit log entry.
// Never throws — if the write fails, logs to console.error and continues.
// The audit record is written synchronously within the request.
export async function logAudit(params: LogAuditParams): Promise<void> {
  try {
    // Dynamic import so this module is safe to import in edge/test environments
    const { drizzle } = await import('drizzle-orm/postgres-js');
    const postgres = (await import('postgres')).default;
    const { auditLog } = await import('@/db/schema');

    const url = process.env.DATABASE_URL;
    if (!url) {
      console.error('[logAudit] DATABASE_URL not set — audit entry not written');
      return;
    }

    const client = postgres(url, { max: 1 });
    const db = drizzle(client);

    await db.insert(auditLog).values({
      userUpn: params.userUpn,
      userRole: params.userRole,
      action: params.action,
      resourceType: params.resourceType ?? null,
      resourceId: params.resourceId ?? null,
      detail: params.detail ?? null,
      ipAddress: params.ipAddress ?? null,
    });

    await client.end();
  } catch (err) {
    console.error('[logAudit] Failed to write audit entry:', err);
  }
}
