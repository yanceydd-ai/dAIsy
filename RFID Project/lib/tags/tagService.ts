import { AUDIT_ACTIONS } from '@/lib/audit/actions';
import { IT_ADMIN } from '@/lib/auth/roles';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TagRow {
  tagId: string;
  epc: string;
  tagType: string;
  issuedOn: string;
  status: 'active' | 'revoked' | 'lost';
  assignmentId: string | null;
  studentId: string | null;
  studentName: string | null;
  grade: string | null;
  assignedAt: string | null;
}

export interface ImportResult {
  created: number;
  skipped: number;
  errors: Array<{ row: number; reason: string }>;
}

export interface TagDb {
  // Listing
  getAllTags(): Promise<TagRow[]>;
  getUntaggedStudentCount(): Promise<number>;

  // Assign
  findTagByEpc(epc: string): Promise<{ id: string; status: string } | null>;
  findActiveAssignmentByEpc(epc: string): Promise<{ id: string } | null>;
  findStudentById(studentId: string): Promise<{ id: string; firstName: string; lastName: string } | null>;
  createTagAndAssignment(data: {
    epc: string;
    studentId: string;
    issuedOn: string;
    assignedBy: string;
  }): Promise<{ tagId: string; assignmentId: string }>;

  // Revoke
  findTagById(tagId: string): Promise<{ id: string; status: string } | null>;
  revokeTag(tagId: string): Promise<void>;
  unassignTag(tagId: string, now: Date): Promise<void>;

  // Import
  findStudentBySisKey(sisKey: string): Promise<{ id: string } | null>;
  upsertTagAssignment(epc: string, studentId: string, assignedBy: string): Promise<'created' | 'skipped'>;

  // Audit
  insertAuditLog(entry: {
    userUpn: string;
    userRole: string;
    action: string;
    resourceType: string;
    resourceId: string | null;
    detail: Record<string, unknown>;
  }): Promise<void>;
}

// ─── assign ───────────────────────────────────────────────────────────────────

export async function assignTag(
  db: TagDb,
  { epc, studentId }: { epc: string; studentId: string },
  userUpn: string,
): Promise<{ tagId: string; assignmentId: string }> {
  // 409 if EPC already has an active assignment
  const existing = await db.findActiveAssignmentByEpc(epc);
  if (existing) {
    const err = Object.assign(new Error('EPC already assigned to an active student'), { status: 409 });
    throw err;
  }

  const student = await db.findStudentById(studentId);
  if (!student) {
    const err = Object.assign(new Error('Student not found'), { status: 404 });
    throw err;
  }

  const result = await db.createTagAndAssignment({
    epc,
    studentId,
    issuedOn: new Date().toISOString().slice(0, 10),
    assignedBy: userUpn,
  });

  await db.insertAuditLog({
    userUpn,
    userRole: IT_ADMIN,
    action: AUDIT_ACTIONS.TAG_ASSIGNED,
    resourceType: 'tag',
    resourceId: result.tagId,
    detail: { epc, studentId, studentName: `${student.firstName} ${student.lastName}` },
  });

  return result;
}

// ─── revoke ───────────────────────────────────────────────────────────────────

export async function revokeTag(
  db: TagDb,
  { tagId, reason }: { tagId: string; reason: string },
  userUpn: string,
): Promise<void> {
  const tag = await db.findTagById(tagId);
  if (!tag) {
    const err = Object.assign(new Error('Tag not found'), { status: 404 });
    throw err;
  }

  const now = new Date();
  await db.revokeTag(tagId);
  await db.unassignTag(tagId, now);

  await db.insertAuditLog({
    userUpn,
    userRole: IT_ADMIN,
    action: AUDIT_ACTIONS.TAG_REVOKED,
    resourceType: 'tag',
    resourceId: tagId,
    detail: { reason },
  });
}

// ─── importCsv ────────────────────────────────────────────────────────────────

export interface CsvRow {
  epc: string;
  student_sis_key: string;
}

export async function importTagsCsv(
  db: TagDb,
  rows: CsvRow[],
  userUpn: string,
): Promise<ImportResult> {
  let created = 0;
  let skipped = 0;
  const errors: Array<{ row: number; reason: string }> = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // 1-based, account for header

    if (!row.epc || !row.student_sis_key) {
      errors.push({ row: rowNum, reason: 'Missing epc or student_sis_key' });
      continue;
    }

    const student = await db.findStudentBySisKey(row.student_sis_key);
    if (!student) {
      errors.push({ row: rowNum, reason: `Unknown student_sis_key: ${row.student_sis_key}` });
      continue;
    }

    const outcome = await db.upsertTagAssignment(row.epc, student.id, userUpn);
    if (outcome === 'created') {
      created++;
    } else {
      skipped++;
    }
  }

  await db.insertAuditLog({
    userUpn,
    userRole: IT_ADMIN,
    action: AUDIT_ACTIONS.TAG_IMPORTED,
    resourceType: 'tag',
    resourceId: null,
    detail: { created, skipped, errorCount: errors.length },
  });

  return { created, skipped, errors };
}

// ─── getUntaggedCount ─────────────────────────────────────────────────────────

export async function getUntaggedStudentCount(db: TagDb): Promise<number> {
  return db.getUntaggedStudentCount();
}
