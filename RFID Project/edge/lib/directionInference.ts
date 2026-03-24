import type { RawRead } from './llrp';

export type Direction = 'IN' | 'OUT' | 'UNKNOWN';

export interface DirectionResult {
  direction: Direction;
  confidence: number;
}

interface SensorSignal {
  pin1FiredFirst: boolean | null; // true = IN, false = OUT, null = no sensor data
}

// Infer crossing direction from a set of raw reads within a read window.
// Zone A = exterior (antenna port 1), Zone B = interior (antenna port 2).
// IN:  Zone A reads appear before Zone B within the crossing window.
// OUT: Zone B reads appear before Zone A within the crossing window.
export function inferDirection(
  reads: RawRead[],
  directionWindowMs: number,
  sensor: SensorSignal = { pin1FiredFirst: null },
): DirectionResult {
  if (reads.length === 0) {
    return { direction: 'UNKNOWN', confidence: 0 };
  }

  const zoneAReads = reads.filter((r) => r.antennaZone === 'zone-a');
  const zoneBReads = reads.filter((r) => r.antennaZone === 'zone-b');

  // Only one zone has reads → UNKNOWN
  if (zoneAReads.length === 0 || zoneBReads.length === 0) {
    return { direction: 'UNKNOWN', confidence: 0 };
  }

  const firstA = Math.min(...zoneAReads.map((r) => r.ts.getTime()));
  const firstB = Math.min(...zoneBReads.map((r) => r.ts.getTime()));
  const timeDeltaMs = Math.abs(firstA - firstB);

  // Time delta exceeds crossing window → UNKNOWN
  if (timeDeltaMs > directionWindowMs) {
    return { direction: 'UNKNOWN', confidence: 0 };
  }

  // Check for interleaved reads with no clear first-zone majority
  if (isAmbiguous(reads)) {
    return { direction: 'UNKNOWN', confidence: 0 };
  }

  // Determine antenna-inferred direction
  const antennaDirection: Direction = firstA < firstB ? 'IN' : 'OUT';

  // Base confidence: 1.0 - (delta / window), clamped to [0.5, 1.0]
  let confidence = 1.0 - timeDeltaMs / directionWindowMs;
  confidence = Math.max(0.5, Math.min(1.0, confidence));

  // Sensor confirmation/conflict adjustment
  if (sensor.pin1FiredFirst !== null) {
    const sensorDirection: Direction = sensor.pin1FiredFirst ? 'IN' : 'OUT';
    if (sensorDirection === antennaDirection) {
      // Sensors confirm — boost confidence
      confidence = Math.min(1.0, confidence + 0.15);
    } else {
      // Sensors conflict — reduce confidence
      confidence = Math.max(0, confidence - 0.2);
    }
  }

  return { direction: antennaDirection, confidence };
}

// Returns true when zone reads are so interleaved that no clear first-zone majority exists.
// "No clear majority" = the first read from each zone alternates more than once.
function isAmbiguous(reads: RawRead[]): boolean {
  if (reads.length < 4) return false;

  const sorted = [...reads].sort((a, b) => a.ts.getTime() - b.ts.getTime());
  let transitions = 0;
  let lastZone = sorted[0].antennaZone;

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].antennaZone !== lastZone) {
      transitions++;
      lastZone = sorted[i].antennaZone;
    }
  }

  // 3+ transitions with no majority run = ambiguous
  return transitions >= 3 && !hasFirstZoneMajority(sorted);
}

function hasFirstZoneMajority(sorted: RawRead[]): boolean {
  if (sorted.length === 0) return false;
  const firstZone = sorted[0].antennaZone;
  const firstZoneCount = sorted.filter((r) => r.antennaZone === firstZone).length;
  return firstZoneCount > sorted.length / 2;
}
