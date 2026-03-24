import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import StatusBadge from '@/app/components/StatusBadge';
import StudentRow, { type StudentPresence } from '@/app/components/StudentRow';
import DashboardClient from '@/app/dashboard/DashboardClient';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeStudent(overrides: Partial<StudentPresence> = {}): StudentPresence {
  return {
    studentId: 'student-1',
    name: 'Alice Smith',
    grade: '10',
    state: 'present',
    lastCrossingDirection: 'IN',
    lastCrossingDoor: 'Door A',
    lastCrossingTs: null,
    manualOverride: false,
    ...overrides,
  };
}

// ─── SSE mock infrastructure ──────────────────────────────────────────────────

type SSEHandler = (e: { data: string }) => void;

interface MockEventSource {
  onmessage: SSEHandler | null;
  onerror: (() => void) | null;
  close: ReturnType<typeof vi.fn>;
  _emit: (data: object) => void;
}

let mockEventSourceInstances: MockEventSource[] = [];

class FakeEventSource {
  onmessage: SSEHandler | null = null;
  onerror: (() => void) | null = null;
  close = vi.fn();

  constructor(_url: string) {
    // Store reference so tests can drive events
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this as any)._emit = (data: object) => {
      this.onmessage?.({ data: JSON.stringify(data) });
    };
    mockEventSourceInstances.push(this as unknown as MockEventSource);
  }
}

beforeEach(() => {
  mockEventSourceInstances = [];
  vi.stubGlobal('EventSource', FakeEventSource);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// Helper: emit a message on the most recent SSE instance
function emitSSE(data: object) {
  const instance = mockEventSourceInstances[mockEventSourceInstances.length - 1];
  if (!instance) throw new Error('No EventSource instance created');
  instance._emit(data);
}

// ─── StatusBadge ─────────────────────────────────────────────────────────────

describe('STORY-011: StatusBadge', () => {
  it('renders PRESENT label for present state', () => {
    render(<StatusBadge state="present" />);
    expect(screen.getByText('PRESENT')).toBeInTheDocument();
  });

  it('renders MISSING label for missing state', () => {
    render(<StatusBadge state="missing" />);
    expect(screen.getByText('MISSING')).toBeInTheDocument();
  });

  it('renders UNKNOWN label for unknown state', () => {
    render(<StatusBadge state="unknown" />);
    expect(screen.getByText('UNKNOWN')).toBeInTheDocument();
  });

  it('renders MANUAL label for manual state', () => {
    render(<StatusBadge state="manual" />);
    expect(screen.getByText('MANUAL')).toBeInTheDocument();
  });
});

// ─── StudentRow ───────────────────────────────────────────────────────────────

describe('STORY-011: StudentRow', () => {
  it('renders PRESENT badge for present student', () => {
    render(<StudentRow student={makeStudent({ state: 'present' })} sessionId={null} />);
    expect(screen.getByText('PRESENT')).toBeInTheDocument();
  });

  it('renders MISSING badge for missing student', () => {
    render(<StudentRow student={makeStudent({ state: 'missing' })} sessionId={null} />);
    expect(screen.getByText('MISSING')).toBeInTheDocument();
  });

  it('renders UNKNOWN badge for unknown student', () => {
    render(<StudentRow student={makeStudent({ state: 'unknown' })} sessionId={null} />);
    expect(screen.getByText('UNKNOWN')).toBeInTheDocument();
  });

  it('renders MANUAL badge when manualOverride is true', () => {
    render(<StudentRow student={makeStudent({ state: 'present', manualOverride: true })} sessionId={null} />);
    expect(screen.getByText('MANUAL')).toBeInTheDocument();
  });

  it('renders student name', () => {
    render(<StudentRow student={makeStudent({ name: 'Jane Doe' })} sessionId={null} />);
    expect(screen.getAllByText('Jane Doe').length).toBeGreaterThan(0);
  });

  it('calls onOverride with studentId when Override presence is clicked', async () => {
    const onOverride = vi.fn();
    render(
      <StudentRow
        student={makeStudent({ studentId: 'student-42' })}
        sessionId={null}
        onOverride={onOverride}
      />,
    );
    fireEvent.click(screen.getByLabelText('More options'));
    fireEvent.click(screen.getByText('Override presence'));
    expect(onOverride).toHaveBeenCalledWith('student-42');
  });
});

// ─── DashboardClient ──────────────────────────────────────────────────────────

describe('STORY-011: DashboardClient — snapshot', () => {
  it('renders correct counts from snapshot event', async () => {
    render(<DashboardClient isSafetyOfficer={false} />);

    await act(async () => {
      emitSSE({
        type: 'snapshot',
        sessionId: 'session-1',
        presentCount: 2,
        missingCount: 1,
        unknownCount: 0,
        students: [
          makeStudent({ studentId: 's1', name: 'Alice Smith', state: 'present' }),
          makeStudent({ studentId: 's2', name: 'Bob Jones', state: 'present' }),
          makeStudent({ studentId: 's3', name: 'Carol White', state: 'missing' }),
        ],
      });
    });

    // Missing (1) and Present (2) appear in both desktop headers and mobile tab buttons
    expect(screen.getAllByText(/missing \(1\)/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/present \(2\)/i).length).toBeGreaterThan(0);
  });

  it('missing tab is default when missing count > 0', async () => {
    render(<DashboardClient isSafetyOfficer={false} />);

    await act(async () => {
      emitSSE({
        type: 'snapshot',
        sessionId: 'session-1',
        presentCount: 1,
        missingCount: 1,
        unknownCount: 0,
        students: [
          makeStudent({ studentId: 's1', name: 'Alice Smith', state: 'present' }),
          makeStudent({ studentId: 's2', name: 'Bob Jones', state: 'missing' }),
        ],
      });
    });

    // The missing tab button should have the active styling (border-brand-green)
    const missingBtn = screen.getByRole('button', { name: /missing/i });
    expect(missingBtn.className).toMatch(/border-brand-green|text-brand-green/);
  });
});

describe('STORY-011: DashboardClient — studentUpdate SSE', () => {
  it('updates student state on studentUpdate without full re-render', async () => {
    render(<DashboardClient isSafetyOfficer={false} />);

    // Initial snapshot with Alice present
    await act(async () => {
      emitSSE({
        type: 'snapshot',
        sessionId: 'session-1',
        presentCount: 1,
        missingCount: 0,
        unknownCount: 0,
        students: [makeStudent({ studentId: 's1', name: 'Alice Smith', state: 'present' })],
      });
    });

    // Sanity: Alice is present — appears in both desktop and mobile views
    expect(screen.getAllByText(/present \(1\)/i).length).toBeGreaterThan(0);

    // Alice transitions to missing
    await act(async () => {
      emitSSE({
        type: 'studentUpdate',
        studentId: 's1',
        name: 'Alice Smith',
        grade: '10',
        state: 'missing',
        lastCrossingDirection: 'OUT',
        lastCrossingDoor: 'Door A',
        lastCrossingTs: null,
        manualOverride: false,
      });
    });

    expect(screen.getAllByText(/missing \(1\)/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/present \(0\)/i).length).toBeGreaterThan(0);
  });
});

describe('STORY-011: DashboardClient — portalStatus', () => {
  it('renders offline banner when portalStatus offline event received', async () => {
    render(<DashboardClient isSafetyOfficer={false} />);

    await act(async () => {
      emitSSE({
        type: 'portalStatus',
        doorId: 'door-a',
        status: 'offline',
        lastHeartbeatTs: null,
      });
    });

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/door-a portal offline/i)).toBeInTheDocument();
  });

  it('does not render offline banner when all portals are online', async () => {
    render(<DashboardClient isSafetyOfficer={false} />);

    await act(async () => {
      emitSSE({
        type: 'portalStatus',
        doorId: 'door-a',
        status: 'online',
        lastHeartbeatTs: new Date().toISOString(),
      });
    });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('STORY-011: DashboardClient — EmergencyExportButton RBAC', () => {
  it('does not render EmergencyExportButton for non-safety-officer', () => {
    render(<DashboardClient isSafetyOfficer={false} />);
    expect(screen.queryAllByLabelText('Export emergency roster')).toHaveLength(0);
  });

  it('renders EmergencyExportButton for safety officer', () => {
    render(<DashboardClient isSafetyOfficer={true} />);
    // Dashboard renders two instances (desktop hidden + mobile fixed), both behind isSafetyOfficer guard
    expect(screen.getAllByLabelText('Export emergency roster').length).toBeGreaterThan(0);
  });
});

describe('STORY-011: DashboardClient — no active session banner', () => {
  it('renders no-session banner when sessionId is null after snapshot', async () => {
    render(<DashboardClient isSafetyOfficer={false} />);

    await act(async () => {
      emitSSE({
        type: 'snapshot',
        sessionId: null,
        presentCount: 0,
        missingCount: 0,
        unknownCount: 0,
        students: [],
      });
    });

    expect(screen.getByText(/no active session/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /start session/i })).toHaveAttribute('href', '/sessions');
  });
});
