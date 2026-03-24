import { describe, it, expect, vi } from 'vitest';
import {
  sortStudentsForExport,
  generateCsv,
  CSV_HEADERS,
  assertSafetyOfficer,
  generateExport,
  type ExportStudent,
  type ExportDb,
  type StorageClient,
} from '@/lib/export/exportService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeStudent(overrides: Partial<ExportStudent> = {}): ExportStudent {
  return {
    studentId: 'student-1',
    firstName: 'Alice',
    lastName: 'Smith',
    grade: '10',
    state: 'present',
    lastCrossingTs: null,
    lastCrossingDoor: null,
    manualOverride: false,
    ...overrides,
  };
}

function makeDb(overrides: Partial<ExportDb> = {}): ExportDb {
  return {
    getPresenceForExport: vi.fn().mockResolvedValue({ sessionLabel: 'PE Period 3', students: [] }),
    insertAuditLog: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function makeStorage(): StorageClient {
  return {
    uploadAndSign: vi.fn().mockResolvedValue({
      url: 'https://blob.example.com/exports/session-1/file.csv?sas=token',
      expiresAt: new Date(Date.now() + 3_600_000),
    }),
  };
}

// ─── sortStudentsForExport ────────────────────────────────────────────────────

describe('STORY-012: sortStudentsForExport', () => {
  it('sorts Missing first, then Unknown, then Present', () => {
    const students = [
      makeStudent({ studentId: 'p1', state: 'present', lastName: 'Alpha' }),
      makeStudent({ studentId: 'u1', state: 'unknown', lastName: 'Beta' }),
      makeStudent({ studentId: 'm1', state: 'missing', lastName: 'Gamma' }),
    ];
    const sorted = sortStudentsForExport(students);
    expect(sorted[0].state).toBe('missing');
    expect(sorted[1].state).toBe('unknown');
    expect(sorted[2].state).toBe('present');
  });

  it('sorts alphabetically by last name within each group', () => {
    const students = [
      makeStudent({ studentId: 'm2', state: 'missing', lastName: 'Zorn', firstName: 'Alice' }),
      makeStudent({ studentId: 'm1', state: 'missing', lastName: 'Adams', firstName: 'Alice' }),
      makeStudent({ studentId: 'p2', state: 'present', lastName: 'Yu', firstName: 'Alice' }),
      makeStudent({ studentId: 'p1', state: 'present', lastName: 'Brown', firstName: 'Alice' }),
    ];
    const sorted = sortStudentsForExport(students);
    expect(sorted[0].lastName).toBe('Adams');  // missing Adams before missing Zorn
    expect(sorted[1].lastName).toBe('Zorn');
    expect(sorted[2].lastName).toBe('Brown');  // present Brown before present Yu
    expect(sorted[3].lastName).toBe('Yu');
  });

  it('sorts by first name as tiebreaker when last names match', () => {
    const students = [
      makeStudent({ studentId: 's2', state: 'present', lastName: 'Smith', firstName: 'Zoe' }),
      makeStudent({ studentId: 's1', state: 'present', lastName: 'Smith', firstName: 'Amy' }),
    ];
    const sorted = sortStudentsForExport(students);
    expect(sorted[0].firstName).toBe('Amy');
    expect(sorted[1].firstName).toBe('Zoe');
  });

  it('does not mutate the input array', () => {
    const students = [
      makeStudent({ studentId: 'p1', state: 'present' }),
      makeStudent({ studentId: 'm1', state: 'missing' }),
    ];
    const original = [...students];
    sortStudentsForExport(students);
    expect(students[0].studentId).toBe(original[0].studentId);
  });
});

// ─── generateCsv ──────────────────────────────────────────────────────────────

describe('STORY-012: generateCsv', () => {
  it('CSV headers match specification', () => {
    expect(CSV_HEADERS).toBe('status,last_name,first_name,grade,last_seen_ts,last_door');
    const csv = generateCsv([]);
    expect(csv).toBe(CSV_HEADERS);
  });

  it('generates correct CSV row for a present student', () => {
    const student = makeStudent({
      state: 'present',
      lastName: 'Smith',
      firstName: 'Alice',
      grade: '10',
      lastCrossingTs: '2026-03-23T13:04:00.000Z',
      lastCrossingDoor: 'Door A',
    });
    const csv = generateCsv([student]);
    const lines = csv.split('\r\n');
    expect(lines[0]).toBe(CSV_HEADERS);
    expect(lines[1]).toBe('present,Smith,Alice,10,2026-03-23T13:04:00.000Z,Door A');
  });

  it('uses missing-first sort order in CSV', () => {
    const students = [
      makeStudent({ studentId: 'p1', state: 'present', lastName: 'Alpha' }),
      makeStudent({ studentId: 'm1', state: 'missing', lastName: 'Zeta' }),
    ];
    const csv = generateCsv(students);
    const lines = csv.split('\r\n');
    expect(lines[1]).toMatch(/^missing/);
    expect(lines[2]).toMatch(/^present/);
  });

  it('uses "manual" status for students with manualOverride', () => {
    const student = makeStudent({ state: 'present', manualOverride: true });
    const csv = generateCsv([student]);
    expect(csv).toContain('manual,');
  });

  it('outputs empty string for null fields', () => {
    const student = makeStudent({ lastCrossingTs: null, lastCrossingDoor: null });
    const csv = generateCsv([student]);
    const dataRow = csv.split('\r\n')[1];
    // last two columns should be empty
    expect(dataRow).toMatch(/,,$/);
  });

  it('escapes commas and quotes in field values', () => {
    const student = makeStudent({ lastName: 'O\'Brien, Jr.', firstName: 'Alice "Ali"' });
    const csv = generateCsv([student]);
    // Comma in lastName → should be quoted
    expect(csv).toContain('"O\'Brien, Jr."');
    // Quote in firstName → should be double-quoted
    expect(csv).toContain('"Alice ""Ali"""');
  });
});

// ─── assertSafetyOfficer ─────────────────────────────────────────────────────

describe('STORY-012: assertSafetyOfficer (API role guard)', () => {
  it('does not throw for SAFETY_OFFICER role', () => {
    expect(() => assertSafetyOfficer('SAFETY_OFFICER')).not.toThrow();
  });

  it('throws with status 403 for non-SAFETY_OFFICER roles', () => {
    const roles = ['ACTIVITIES_COORDINATOR', 'IT_ADMIN', 'COMPLIANCE_OFFICER', null, undefined, ''];
    for (const role of roles) {
      let caught: (Error & { status?: number }) | null = null;
      try {
        assertSafetyOfficer(role);
      } catch (e) {
        caught = e as Error & { status?: number };
      }
      expect(caught).not.toBeNull();
      expect(caught?.status).toBe(403);
    }
  });
});

// ─── generateExport ───────────────────────────────────────────────────────────

describe('STORY-012: generateExport', () => {
  it('writes audit log entry with correct counts', async () => {
    const students = [
      makeStudent({ studentId: 's1', state: 'present' }),
      makeStudent({ studentId: 's2', state: 'missing' }),
      makeStudent({ studentId: 's3', state: 'missing' }),
      makeStudent({ studentId: 's4', state: 'unknown' }),
    ];
    const db = makeDb({
      getPresenceForExport: vi.fn().mockResolvedValue({ sessionLabel: 'PE Period 3', students }),
    });
    const storage = makeStorage();

    await generateExport(db, storage, 'session-1', 'csv', 'officer@hockaday.edu', 'SAFETY_OFFICER');

    expect(db.insertAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'EMERGENCY_EXPORT',
        detail: expect.objectContaining({
          format: 'csv',
          presentCount: 1,
          missingCount: 2,
          unknownCount: 1,
        }),
      }),
    );
  });

  it('uses "Unscheduled" label when sessionLabel is null', async () => {
    const db = makeDb({
      getPresenceForExport: vi.fn().mockResolvedValue({ sessionLabel: null, students: [] }),
    });
    const storage = makeStorage();

    await generateExport(db, storage, null, 'csv', 'officer@hockaday.edu', 'SAFETY_OFFICER');

    expect(db.insertAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({ sessionLabel: 'Unscheduled' }),
      }),
    );
  });

  it('returns downloadUrl and expiresAt from storage client', async () => {
    const db = makeDb();
    const storage = makeStorage();

    const result = await generateExport(db, storage, 'session-1', 'csv', 'officer@hockaday.edu', 'SAFETY_OFFICER');

    expect(result.downloadUrl).toBe('https://blob.example.com/exports/session-1/file.csv?sas=token');
    expect(typeof result.expiresAt).toBe('string');
  });

  it('uploads to the correct path format', async () => {
    const db = makeDb();
    const storage = makeStorage();

    await generateExport(db, storage, 'session-abc', 'csv', 'officer@hockaday.edu', 'SAFETY_OFFICER');

    expect(storage.uploadAndSign).toHaveBeenCalledWith(
      expect.stringMatching(/^exports\/session-abc\/.+\.csv$/),
      expect.anything(),
      'text/csv',
    );
  });
});
