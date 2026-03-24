export type PresenceState = 'Inside' | 'Outside' | 'Unknown';
export type Direction = 'IN' | 'OUT' | 'UNKNOWN';

export interface TagStateRecord {
  state: PresenceState;
  lastEventTs: number; // Unix ms
}

const MIN_INTER_EVENT_MS = parseInt(process.env.CLOUD_MIN_INTER_EVENT_MS ?? '10000', 10);

// Cloud-side per-student state machine.
// Mirrors edge StateMachine semantics but operates on student IDs (not EPCs)
// and uses the database as the authoritative state store.
//
// This in-memory map is used as a performance cache — DB is the source of truth.
export class CloudStateMachine {
  private states = new Map<string, TagStateRecord>();
  private minInterEventMs: number;

  constructor(minInterEventMs = MIN_INTER_EVENT_MS) {
    this.minInterEventMs = minInterEventMs;
  }

  // Seed state from the database record (call after DB read).
  seed(studentId: string, state: PresenceState, lastEventTs: number): void {
    this.states.set(studentId, { state, lastEventTs });
  }

  // Apply a direction event for a student.
  // Returns the new state, or null if the event was suppressed.
  apply(
    studentId: string,
    direction: Direction,
    ts: Date,
  ): PresenceState | null {
    const now = ts.getTime();
    const existing = this.states.get(studentId);

    // Enforce minimum inter-event interval
    if (existing && now - existing.lastEventTs < this.minInterEventMs) {
      return null; // too soon — suppress
    }

    const currentState: PresenceState = existing?.state ?? 'Unknown';
    let newState: PresenceState;

    if (direction === 'IN') {
      if (currentState === 'Inside') return null; // already inside — ignore
      newState = 'Inside';
    } else if (direction === 'OUT') {
      if (currentState === 'Outside') return null; // already outside — ignore
      newState = 'Outside';
    } else {
      newState = 'Unknown';
    }

    this.states.set(studentId, { state: newState, lastEventTs: now });
    return newState;
  }

  getState(studentId: string): PresenceState {
    return this.states.get(studentId)?.state ?? 'Unknown';
  }

  reset(studentId: string): void {
    this.states.delete(studentId);
  }
}
