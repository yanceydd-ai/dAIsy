export type PresenceState = 'Outside' | 'Inside' | 'Unknown';
export type Direction = 'IN' | 'OUT' | 'UNKNOWN';

export interface TagState {
  state: PresenceState;
  lastEventTs: number; // Unix ms
}

// Per-tag state machine. Maintains state: Outside | Inside | Unknown.
// Invalid transitions (IN when already Inside, OUT when already Outside) are ignored.
// Enforces minimum inter-event interval to prevent oscillation.
export class EdgeStateMachine {
  private states = new Map<string, TagState>();
  private minInterEventMs: number;

  constructor(minInterEventMs = 10_000) {
    this.minInterEventMs = minInterEventMs;
  }

  // Apply a crossing event to the state machine.
  // Returns the new state, or null if the event was suppressed.
  apply(epc: string, direction: Direction, ts: Date): PresenceState | null {
    const now = ts.getTime();
    const existing = this.states.get(epc);

    // Enforce minimum inter-event interval
    if (existing && now - existing.lastEventTs < this.minInterEventMs) {
      return null; // suppress — too soon
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
      // UNKNOWN direction
      newState = 'Unknown';
    }

    this.states.set(epc, { state: newState, lastEventTs: now });
    return newState;
  }

  getState(epc: string): PresenceState {
    return this.states.get(epc)?.state ?? 'Unknown';
  }

  reset(epc: string) {
    this.states.delete(epc);
  }

  resetAll() {
    this.states.clear();
  }
}
