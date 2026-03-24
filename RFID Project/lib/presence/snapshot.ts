import { getDb } from '@/db';
import {
  presenceStates,
  students,
  crossingEvents,
  sessions,
  devices,
  doors,
} from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export interface StudentPresenceRow {
  studentId: string;
  name: string;
  grade: string;
  state: string;
  lastCrossingDirection: string | null;
  lastCrossingDoor: string | null;
  lastCrossingTs: string | null;
  manualOverride: boolean;
}

export interface PresenceSnapshot {
  type: 'snapshot';
  sessionId: string | null;
  presentCount: number;
  missingCount: number;
  unknownCount: number;
  students: StudentPresenceRow[];
}

export interface PortalStatusEvent {
  type: 'portalStatus';
  doorId: string;
  status: string;
  lastHeartbeatTs: string | null;
}

export async function getPresenceSnapshot(sessionId: string | null): Promise<PresenceSnapshot> {
  const db = getDb();

  let studentRows: StudentPresenceRow[];

  if (sessionId) {
    // Session-scoped: join presence_states with students and last crossing
    const rows = await db
      .select({
        studentId: students.id,
        firstName: students.firstName,
        lastName: students.lastName,
        grade: students.grade,
        state: presenceStates.state,
        lastCrossingDirection: crossingEvents.direction,
        lastCrossingDoor: crossingEvents.doorId,
        lastCrossingTs: crossingEvents.ts,
        manualOverride: presenceStates.manualOverride,
      })
      .from(presenceStates)
      .innerJoin(students, eq(presenceStates.studentId, students.id))
      .leftJoin(crossingEvents, eq(presenceStates.lastCrossingId, crossingEvents.id))
      .where(eq(presenceStates.sessionId, sessionId));

    studentRows = rows.map((r) => ({
      studentId: r.studentId,
      name: `${r.firstName} ${r.lastName}`,
      grade: r.grade,
      state: r.state,
      lastCrossingDirection: r.lastCrossingDirection ?? null,
      lastCrossingDoor: r.lastCrossingDoor ?? null,
      lastCrossingTs: r.lastCrossingTs?.toISOString() ?? null,
      manualOverride: r.manualOverride,
    }));
  } else {
    // Global: return all students with their latest presence state across any session
    const rows = await db
      .select({
        studentId: students.id,
        firstName: students.firstName,
        lastName: students.lastName,
        grade: students.grade,
        state: sql<string>`COALESCE(${presenceStates.state}, 'missing')`,
        lastCrossingDirection: crossingEvents.direction,
        lastCrossingDoor: crossingEvents.doorId,
        lastCrossingTs: crossingEvents.ts,
        manualOverride: presenceStates.manualOverride,
      })
      .from(students)
      .leftJoin(presenceStates, eq(presenceStates.studentId, students.id))
      .leftJoin(crossingEvents, eq(presenceStates.lastCrossingId, crossingEvents.id))
      .where(eq(students.active, true));

    studentRows = rows.map((r) => ({
      studentId: r.studentId,
      name: `${r.firstName} ${r.lastName}`,
      grade: r.grade,
      state: r.state ?? 'missing',
      lastCrossingDirection: r.lastCrossingDirection ?? null,
      lastCrossingDoor: r.lastCrossingDoor ?? null,
      lastCrossingTs: r.lastCrossingTs?.toISOString() ?? null,
      manualOverride: r.manualOverride ?? false,
    }));
  }

  const presentCount = studentRows.filter((s) => s.state === 'present').length;
  const missingCount = studentRows.filter((s) => s.state === 'missing').length;
  const unknownCount = studentRows.filter((s) => s.state === 'unknown').length;

  return {
    type: 'snapshot',
    sessionId,
    presentCount,
    missingCount,
    unknownCount,
    students: studentRows,
  };
}

export async function getPortalStatuses(): Promise<PortalStatusEvent[]> {
  const db = getDb();
  const rows = await db
    .select({
      doorId: devices.doorId,
      status: devices.status,
      lastHeartbeatAt: devices.lastHeartbeatAt,
    })
    .from(devices)
    .where(eq(devices.type, 'edge_node'));

  return rows.map((r) => ({
    type: 'portalStatus' as const,
    doorId: r.doorId ?? 'unknown',
    status: r.status,
    lastHeartbeatTs: r.lastHeartbeatAt?.toISOString() ?? null,
  }));
}
