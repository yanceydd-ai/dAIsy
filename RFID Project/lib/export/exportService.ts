import { AUDIT_ACTIONS } from '@/lib/audit/actions';
import { SAFETY_OFFICER } from '@/lib/auth/roles';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ExportStudent {
  studentId: string;
  firstName: string;
  lastName: string;
  grade: string;
  state: 'present' | 'missing' | 'unknown';
  lastCrossingTs: string | null;
  lastCrossingDoor: string | null;
  manualOverride: boolean;
}

export interface ExportDb {
  getPresenceForExport(sessionId: string | null): Promise<{
    sessionLabel: string | null;
    students: ExportStudent[];
  }>;
  insertAuditLog(entry: {
    userUpn: string;
    userRole: string;
    action: string;
    resourceType: string;
    resourceId: string | null;
    detail: Record<string, unknown>;
  }): Promise<void>;
}

export interface StorageClient {
  uploadAndSign(
    path: string,
    data: Buffer | string,
    contentType: string,
  ): Promise<{ url: string; expiresAt: Date }>;
}

export interface ExportResult {
  downloadUrl: string;
  expiresAt: string;
}

// ─── RBAC guard (testable without next-auth) ──────────────────────────────────

export function assertSafetyOfficer(role: string | null | undefined): void {
  if (role !== SAFETY_OFFICER) {
    const err = new Error('Forbidden — SAFETY_OFFICER role required');
    (err as NodeJS.ErrnoException & { status: number }).status = 403;
    throw err;
  }
}

// ─── Sort ─────────────────────────────────────────────────────────────────────

const STATE_ORDER: Record<ExportStudent['state'], number> = {
  missing: 0,
  unknown: 1,
  present: 2,
};

export function sortStudentsForExport(students: ExportStudent[]): ExportStudent[] {
  return [...students].sort((a, b) => {
    const stateDiff = STATE_ORDER[a.state] - STATE_ORDER[b.state];
    if (stateDiff !== 0) return stateDiff;
    const lastDiff = a.lastName.localeCompare(b.lastName);
    if (lastDiff !== 0) return lastDiff;
    return a.firstName.localeCompare(b.firstName);
  });
}

// ─── CSV ──────────────────────────────────────────────────────────────────────

export const CSV_HEADERS = 'status,last_name,first_name,grade,last_seen_ts,last_door';

function csvEscape(val: string | null | undefined): string {
  if (val == null) return '';
  if (/[",\r\n]/.test(val)) return `"${val.replace(/"/g, '""')}"`;
  return val;
}

export function generateCsv(students: ExportStudent[]): string {
  const sorted = sortStudentsForExport(students);
  const rows = sorted.map((s) =>
    [
      csvEscape(s.manualOverride ? 'manual' : s.state),
      csvEscape(s.lastName),
      csvEscape(s.firstName),
      csvEscape(s.grade),
      csvEscape(s.lastCrossingTs),
      csvEscape(s.lastCrossingDoor),
    ].join(','),
  );
  return [CSV_HEADERS, ...rows].join('\r\n');
}

// ─── Main export orchestrator ─────────────────────────────────────────────────

export async function generateExport(
  db: ExportDb,
  storage: StorageClient,
  sessionId: string | null,
  format: 'pdf' | 'csv',
  userUpn: string,
  userRole: string,
): Promise<ExportResult> {
  const { sessionLabel, students } = await db.getPresenceForExport(sessionId);
  const label = sessionLabel ?? 'Unscheduled';
  const sorted = sortStudentsForExport(students);

  const presentCount = sorted.filter((s) => s.state === 'present').length;
  const missingCount = sorted.filter((s) => s.state === 'missing').length;
  const unknownCount = sorted.filter((s) => s.state === 'unknown').length;

  const timestamp = new Date().toISOString();
  const path = `exports/${sessionId ?? 'global'}/${timestamp}-${format}.${format === 'pdf' ? 'pdf' : 'csv'}`;

  let fileData: Buffer | string;
  let contentType: string;

  if (format === 'csv') {
    fileData = generateCsv(students);
    contentType = 'text/csv';
  } else {
    // Lazy-load @react-pdf/renderer so it only runs server-side
    const { pdf } = await import('@react-pdf/renderer');
    const { buildEmergencyPdf } = await import('./emergencyPdf');
    const pdfDoc = buildEmergencyPdf({ label, timestamp, userUpn, sorted });
    const pdfBuffer = await pdf(pdfDoc).toBuffer();
    fileData = pdfBuffer;
    contentType = 'application/pdf';
  }

  const { url, expiresAt } = await storage.uploadAndSign(path, fileData, contentType);

  await db.insertAuditLog({
    userUpn,
    userRole,
    action: AUDIT_ACTIONS.EMERGENCY_EXPORT,
    resourceType: 'session',
    resourceId: sessionId,
    detail: { format, sessionLabel: label, presentCount, missingCount, unknownCount },
  });

  return { downloadUrl: url, expiresAt: expiresAt.toISOString() };
}
