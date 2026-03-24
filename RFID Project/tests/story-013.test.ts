import { describe, it, expect, vi } from 'vitest';
import {
  assignTag,
  revokeTag,
  importTagsCsv,
  getUntaggedStudentCount,
  type TagDb,
  type CsvRow,
} from '@/lib/tags/tagService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeDb(overrides: Partial<TagDb> = {}): TagDb {
  return {
    getAllTags: vi.fn().mockResolvedValue([]),
    getUntaggedStudentCount: vi.fn().mockResolvedValue(0),
    findTagByEpc: vi.fn().mockResolvedValue(null),
    findActiveAssignmentByEpc: vi.fn().mockResolvedValue(null),
    findStudentById: vi.fn().mockResolvedValue({ id: 'student-1', firstName: 'Alice', lastName: 'Smith' }),
    createTagAndAssignment: vi.fn().mockResolvedValue({ tagId: 'tag-1', assignmentId: 'assignment-1' }),
    findTagById: vi.fn().mockResolvedValue({ id: 'tag-1', status: 'active' }),
    revokeTag: vi.fn().mockResolvedValue(undefined),
    unassignTag: vi.fn().mockResolvedValue(undefined),
    findStudentBySisKey: vi.fn().mockResolvedValue(null),
    upsertTagAssignment: vi.fn().mockResolvedValue('created'),
    insertAuditLog: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

// ─── assignTag ────────────────────────────────────────────────────────────────

describe('STORY-013: assignTag', () => {
  it('creates tag and assignment for valid input', async () => {
    const db = makeDb();
    const result = await assignTag(db, { epc: 'E200AABB', studentId: 'student-1' }, 'admin@hockaday.edu');
    expect(result).toEqual({ tagId: 'tag-1', assignmentId: 'assignment-1' });
    expect(db.createTagAndAssignment).toHaveBeenCalledWith(
      expect.objectContaining({ epc: 'E200AABB', studentId: 'student-1' }),
    );
  });

  it('throws 409 when EPC already has an active assignment', async () => {
    const db = makeDb({
      findActiveAssignmentByEpc: vi.fn().mockResolvedValue({ id: 'existing-assignment' }),
    });
    await expect(
      assignTag(db, { epc: 'E200AABB', studentId: 'student-2' }, 'admin@hockaday.edu'),
    ).rejects.toMatchObject({ status: 409 });
  });

  it('throws 404 when student not found', async () => {
    const db = makeDb({
      findStudentById: vi.fn().mockResolvedValue(null),
    });
    await expect(
      assignTag(db, { epc: 'E200AABB', studentId: 'ghost' }, 'admin@hockaday.edu'),
    ).rejects.toMatchObject({ status: 404 });
  });

  it('writes audit log with correct action', async () => {
    const db = makeDb();
    await assignTag(db, { epc: 'E200AABB', studentId: 'student-1' }, 'admin@hockaday.edu');
    expect(db.insertAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'TAG_ASSIGNED' }),
    );
  });

  // RBAC: non-IT_ADMIN returns 403 is enforced by requireRole at the route level (tested in STORY-002/003)
});

// ─── revokeTag ────────────────────────────────────────────────────────────────

describe('STORY-013: revokeTag', () => {
  it('sets tag status to revoked and unassigns', async () => {
    const db = makeDb();
    await revokeTag(db, { tagId: 'tag-1', reason: 'Lost by student' }, 'admin@hockaday.edu');
    expect(db.revokeTag).toHaveBeenCalledWith('tag-1');
    expect(db.unassignTag).toHaveBeenCalledWith('tag-1', expect.any(Date));
  });

  it('writes audit log with reason', async () => {
    const db = makeDb();
    await revokeTag(db, { tagId: 'tag-1', reason: 'Damaged' }, 'admin@hockaday.edu');
    expect(db.insertAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'TAG_REVOKED',
        detail: expect.objectContaining({ reason: 'Damaged' }),
      }),
    );
  });

  it('throws 404 when tag not found', async () => {
    const db = makeDb({ findTagById: vi.fn().mockResolvedValue(null) });
    await expect(
      revokeTag(db, { tagId: 'ghost', reason: 'test' }, 'admin@hockaday.edu'),
    ).rejects.toMatchObject({ status: 404 });
  });
});

// ─── importTagsCsv ────────────────────────────────────────────────────────────

describe('STORY-013: importTagsCsv', () => {
  it('creates tag and assignment for valid row', async () => {
    const db = makeDb({
      findStudentBySisKey: vi.fn().mockResolvedValue({ id: 'student-1' }),
      upsertTagAssignment: vi.fn().mockResolvedValue('created'),
    });
    const rows: CsvRow[] = [{ epc: 'E200AABB', student_sis_key: 'SIS-001' }];
    const result = await importTagsCsv(db, rows, 'admin@hockaday.edu');
    expect(result.created).toBe(1);
    expect(result.skipped).toBe(0);
    expect(result.errors).toHaveLength(0);
    expect(db.upsertTagAssignment).toHaveBeenCalledWith('E200AABB', 'student-1', 'admin@hockaday.edu');
  });

  it('counts unknown student_sis_key as error, not thrown', async () => {
    const db = makeDb({
      findStudentBySisKey: vi.fn().mockResolvedValue(null),
    });
    const rows: CsvRow[] = [{ epc: 'E200AABB', student_sis_key: 'UNKNOWN-SIS' }];
    const result = await importTagsCsv(db, rows, 'admin@hockaday.edu');
    expect(result.created).toBe(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].reason).toMatch(/Unknown student_sis_key/);
  });

  it('counts duplicate EPC as skipped', async () => {
    const db = makeDb({
      findStudentBySisKey: vi.fn().mockResolvedValue({ id: 'student-1' }),
      upsertTagAssignment: vi.fn().mockResolvedValue('skipped'),
    });
    const rows: CsvRow[] = [{ epc: 'E200AABB', student_sis_key: 'SIS-001' }];
    const result = await importTagsCsv(db, rows, 'admin@hockaday.edu');
    expect(result.skipped).toBe(1);
    expect(result.created).toBe(0);
    expect(result.errors).toHaveLength(0);
  });

  it('handles mixed valid, skipped, and error rows', async () => {
    const db = makeDb({
      findStudentBySisKey: vi
        .fn()
        .mockResolvedValueOnce({ id: 'student-1' })   // row 1 — valid
        .mockResolvedValueOnce(null)                    // row 2 — unknown sis key
        .mockResolvedValueOnce({ id: 'student-3' }),   // row 3 — duplicate EPC
      upsertTagAssignment: vi
        .fn()
        .mockResolvedValueOnce('created')
        .mockResolvedValueOnce('skipped'),
    });
    const rows: CsvRow[] = [
      { epc: 'E200AA01', student_sis_key: 'SIS-001' },
      { epc: 'E200AA02', student_sis_key: 'GHOST' },
      { epc: 'E200AA03', student_sis_key: 'SIS-003' },
    ];
    const result = await importTagsCsv(db, rows, 'admin@hockaday.edu');
    expect(result.created).toBe(1);
    expect(result.skipped).toBe(1);
    expect(result.errors).toHaveLength(1);
  });

  it('counts rows with missing epc or student_sis_key as errors', async () => {
    const db = makeDb();
    const rows: CsvRow[] = [
      { epc: '', student_sis_key: 'SIS-001' },
      { epc: 'E200AABB', student_sis_key: '' },
    ];
    const result = await importTagsCsv(db, rows, 'admin@hockaday.edu');
    expect(result.errors).toHaveLength(2);
  });
});

// ─── getUntaggedStudentCount ──────────────────────────────────────────────────

describe('STORY-013: getUntaggedStudentCount', () => {
  it('returns the count from db', async () => {
    const db = makeDb({ getUntaggedStudentCount: vi.fn().mockResolvedValue(7) });
    const count = await getUntaggedStudentCount(db);
    expect(count).toBe(7);
  });
});
