import { getDb } from '@/db';
import { tags, studentTags, students, auditLog } from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import type { TagDb, TagRow } from './tagService';

export function makeTagDb(): TagDb {
  const db = getDb();
  return {
    async getAllTags() {
      const rows = await db
        .select({
          tagId: tags.id,
          epc: tags.epc,
          tagType: tags.tagType,
          issuedOn: tags.issuedOn,
          status: tags.status,
          assignmentId: studentTags.id,
          studentId: students.id,
          firstName: students.firstName,
          lastName: students.lastName,
          grade: students.grade,
          assignedAt: studentTags.assignedAt,
        })
        .from(tags)
        .leftJoin(studentTags, and(eq(studentTags.tagId, tags.id), isNull(studentTags.unassignedAt)))
        .leftJoin(students, eq(students.id, studentTags.studentId));

      return rows.map((r): TagRow => ({
        tagId: r.tagId,
        epc: r.epc,
        tagType: r.tagType,
        issuedOn: String(r.issuedOn),
        status: r.status as TagRow['status'],
        assignmentId: r.assignmentId ?? null,
        studentId: r.studentId ?? null,
        studentName: r.firstName && r.lastName ? `${r.firstName} ${r.lastName}` : null,
        grade: r.grade ?? null,
        assignedAt: r.assignedAt?.toISOString() ?? null,
      }));
    },

    async getUntaggedStudentCount() {
      // Active students with no active tag assignment
      const allStudents = await db.select({ id: students.id }).from(students).where(eq(students.active, true));
      const taggedStudents = await db
        .select({ studentId: studentTags.studentId })
        .from(studentTags)
        .where(isNull(studentTags.unassignedAt));
      const taggedIds = new Set(taggedStudents.map((r) => r.studentId));
      return allStudents.filter((s) => !taggedIds.has(s.id)).length;
    },

    async findTagByEpc(epc) {
      const rows = await db.select({ id: tags.id, status: tags.status }).from(tags).where(eq(tags.epc, epc)).limit(1);
      return rows[0] ?? null;
    },

    async findActiveAssignmentByEpc(epc) {
      const tagRows = await db.select({ id: tags.id }).from(tags).where(eq(tags.epc, epc)).limit(1);
      if (!tagRows[0]) return null;
      const rows = await db
        .select({ id: studentTags.id })
        .from(studentTags)
        .where(and(eq(studentTags.tagId, tagRows[0].id), isNull(studentTags.unassignedAt)))
        .limit(1);
      return rows[0] ?? null;
    },

    async findStudentById(studentId) {
      const rows = await db
        .select({ id: students.id, firstName: students.firstName, lastName: students.lastName })
        .from(students)
        .where(eq(students.id, studentId))
        .limit(1);
      return rows[0] ?? null;
    },

    async createTagAndAssignment({ epc, studentId, issuedOn, assignedBy }) {
      // Create tag
      const [tag] = await db
        .insert(tags)
        .values({ epc, tagType: 'UHF_PASSIVE', issuedOn, status: 'active' })
        .returning({ id: tags.id });
      // Create assignment
      const [assignment] = await db
        .insert(studentTags)
        .values({ tagId: tag.id, studentId, assignedBy })
        .returning({ id: studentTags.id });
      return { tagId: tag.id, assignmentId: assignment.id };
    },

    async findTagById(tagId) {
      const rows = await db.select({ id: tags.id, status: tags.status }).from(tags).where(eq(tags.id, tagId)).limit(1);
      return rows[0] ?? null;
    },

    async revokeTag(tagId) {
      await db.update(tags).set({ status: 'revoked' }).where(eq(tags.id, tagId));
    },

    async unassignTag(tagId, now) {
      await db
        .update(studentTags)
        .set({ unassignedAt: now })
        .where(and(eq(studentTags.tagId, tagId), isNull(studentTags.unassignedAt)));
    },

    async findStudentBySisKey(sisKey) {
      const rows = await db
        .select({ id: students.id })
        .from(students)
        .where(eq(students.sisStudentKey, sisKey))
        .limit(1);
      return rows[0] ?? null;
    },

    async upsertTagAssignment(epc, studentId, assignedBy) {
      // Check for existing active assignment for this EPC
      const tagRows = await db.select({ id: tags.id }).from(tags).where(eq(tags.epc, epc)).limit(1);
      if (tagRows[0]) {
        const existing = await db
          .select({ id: studentTags.id })
          .from(studentTags)
          .where(and(eq(studentTags.tagId, tagRows[0].id), isNull(studentTags.unassignedAt)))
          .limit(1);
        if (existing[0]) return 'skipped';
        // Tag exists but not actively assigned — create new assignment
        await db.insert(studentTags).values({ tagId: tagRows[0].id, studentId, assignedBy });
        return 'created';
      }
      // Create tag + assignment
      const today = new Date().toISOString().slice(0, 10);
      const [tag] = await db
        .insert(tags)
        .values({ epc, tagType: 'UHF_PASSIVE', issuedOn: today, status: 'active' })
        .returning({ id: tags.id });
      await db.insert(studentTags).values({ tagId: tag.id, studentId, assignedBy });
      return 'created';
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
