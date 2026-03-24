import { inferDirection } from './directionInference';
import { deduplicateReads } from './deduplication';
import { EdgeStateMachine } from './stateMachine';
import type { RawRead } from './llrp';

export interface CrossingEvent {
  id: string;        // UUID — used for cloud-side deduplication
  deviceId: string;
  doorId: string;
  epc: string;
  direction: 'IN' | 'OUT' | 'UNKNOWN';
  confidence: number;
  zoneSequence: string[];
  sensorConfirmed: boolean;
  timestamp: string; // ISO 8601
  rawReadCount: number;
}

export interface CrossingEventProcessorOptions {
  deviceId: string;
  doorId: string;
  dedupWindowMs: number;
  directionWindowMs: number;
  confidenceThreshold: number;
  minInterEventMs: number;
}

export class CrossingEventProcessor {
  private stateMachine: EdgeStateMachine;
  private opts: CrossingEventProcessorOptions;

  constructor(opts: CrossingEventProcessorOptions) {
    this.opts = opts;
    this.stateMachine = new EdgeStateMachine(opts.minInterEventMs);
  }

  // Process a batch of raw reads from a single read window.
  // Returns a CrossingEvent for each EPC that passes all filters, or empty array.
  process(reads: RawRead[], sensorConfirmed = false): CrossingEvent[] {
    if (reads.length === 0) return [];

    // Group reads by EPC after deduplication
    // Deduplicate per EPC+zone so that direction inference retains reads from both zones.
    const zoneAReads = deduplicateReads(reads.filter(r => r.antennaZone === 'zone-a'), this.opts.dedupWindowMs);
    const zoneBReads = deduplicateReads(reads.filter(r => r.antennaZone === 'zone-b'), this.opts.dedupWindowMs);
    const deduped = [...zoneAReads, ...zoneBReads];

    const byEpc = new Map<string, RawRead[]>();

    for (const read of deduped) {
      const existing = byEpc.get(read.epc) ?? [];
      existing.push(read);
      byEpc.set(read.epc, existing);
    }

    const events: CrossingEvent[] = [];

    for (const [epc, epcReads] of byEpc) {
      const { direction, confidence } = inferDirection(
        epcReads,
        this.opts.directionWindowMs,
        { pin1FiredFirst: sensorConfirmed ? true : null },
      );

      // Suppress UNKNOWN direction
      if (direction === 'UNKNOWN') continue;

      // Suppress below confidence threshold
      if (confidence < this.opts.confidenceThreshold) continue;

      // Apply state machine — suppress invalid/too-soon transitions
      const ts = new Date(Math.min(...epcReads.map((r) => r.ts.getTime())));
      const newState = this.stateMachine.apply(epc, direction, ts);
      if (newState === null) continue;

      const sorted = [...epcReads].sort((a, b) => a.ts.getTime() - b.ts.getTime());
      const zoneSequence = [...new Set(sorted.map((r) => r.antennaZone))];

      events.push({
        id: crypto.randomUUID(),
        deviceId: this.opts.deviceId,
        doorId: this.opts.doorId,
        epc,
        direction,
        confidence,
        zoneSequence,
        sensorConfirmed,
        timestamp: ts.toISOString(),
        rawReadCount: reads.filter((r) => r.epc === epc).length,
      });
    }

    return events;
  }
}
