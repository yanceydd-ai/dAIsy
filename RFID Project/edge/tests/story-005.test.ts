import { describe, it, expect } from 'vitest';
import { inferDirection } from '../lib/directionInference';
import { deduplicateReads } from '../lib/deduplication';
import { EdgeStateMachine } from '../lib/stateMachine';
import { CrossingEventProcessor } from '../lib/crossingEvents';
import type { RawRead } from '../lib/llrp';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function read(epc: string, zone: 'zone-a' | 'zone-b', offsetMs: number, rssi = -68): RawRead {
  return { epc, antennaZone: zone, rssi, ts: new Date(1000 + offsetMs) };
}

const WINDOW_MS = 3000;

// ─── inferDirection ───────────────────────────────────────────────────────────

describe('STORY-005: Direction Inference and Crossing Events', () => {
  describe('inferDirection — IN case', () => {
    it('returns IN when zone-a reads appear before zone-b', () => {
      const reads = [
        read('EPC1', 'zone-a', 0),
        read('EPC1', 'zone-a', 200),
        read('EPC1', 'zone-b', 800),
      ];
      const result = inferDirection(reads, WINDOW_MS);
      expect(result.direction).toBe('IN');
      expect(result.confidence).toBeGreaterThan(0);
    });
  });

  describe('inferDirection — OUT case', () => {
    it('returns OUT when zone-b reads appear before zone-a', () => {
      const reads = [
        read('EPC1', 'zone-b', 0),
        read('EPC1', 'zone-b', 100),
        read('EPC1', 'zone-a', 700),
      ];
      const result = inferDirection(reads, WINDOW_MS);
      expect(result.direction).toBe('OUT');
      expect(result.confidence).toBeGreaterThan(0);
    });
  });

  describe('inferDirection — UNKNOWN: single zone only', () => {
    it('returns UNKNOWN when only zone-a has reads', () => {
      const reads = [read('EPC1', 'zone-a', 0), read('EPC1', 'zone-a', 100)];
      const result = inferDirection(reads, WINDOW_MS);
      expect(result.direction).toBe('UNKNOWN');
      expect(result.confidence).toBe(0);
    });

    it('returns UNKNOWN when only zone-b has reads', () => {
      const reads = [read('EPC1', 'zone-b', 0)];
      const result = inferDirection(reads, WINDOW_MS);
      expect(result.direction).toBe('UNKNOWN');
      expect(result.confidence).toBe(0);
    });
  });

  describe('inferDirection — UNKNOWN: interleaved reads', () => {
    it('returns UNKNOWN when reads are ambiguously interleaved', () => {
      // a-b-a-b-a-b — no clear first-zone majority
      const reads = [
        read('EPC1', 'zone-a', 0),
        read('EPC1', 'zone-b', 50),
        read('EPC1', 'zone-a', 100),
        read('EPC1', 'zone-b', 150),
        read('EPC1', 'zone-a', 200),
        read('EPC1', 'zone-b', 250),
      ];
      const result = inferDirection(reads, WINDOW_MS);
      expect(result.direction).toBe('UNKNOWN');
    });
  });

  describe('inferDirection — confidence boost when sensors confirm', () => {
    it('boosts confidence by 0.15 when sensor direction matches antenna direction', () => {
      const reads = [
        read('EPC1', 'zone-a', 0),
        read('EPC1', 'zone-b', 1000), // 1s delta → base confidence ~0.667
      ];
      const withoutSensor = inferDirection(reads, WINDOW_MS);
      const withSensor = inferDirection(reads, WINDOW_MS, { pin1FiredFirst: true }); // IN = confirm

      expect(withSensor.confidence).toBeGreaterThan(withoutSensor.confidence);
      expect(withSensor.confidence).toBeCloseTo(
        Math.min(1.0, withoutSensor.confidence + 0.15),
        5,
      );
    });
  });

  describe('inferDirection — confidence reduction when sensors conflict', () => {
    it('reduces confidence by 0.20 when sensor direction conflicts with antenna', () => {
      const reads = [
        read('EPC1', 'zone-a', 0),
        read('EPC1', 'zone-b', 500), // antenna says IN
      ];
      const withoutSensor = inferDirection(reads, WINDOW_MS);
      const conflicting = inferDirection(reads, WINDOW_MS, { pin1FiredFirst: false }); // OUT = conflict

      expect(conflicting.confidence).toBeLessThan(withoutSensor.confidence);
      expect(conflicting.confidence).toBeCloseTo(
        Math.max(0, withoutSensor.confidence - 0.2),
        5,
      );
    });
  });

  describe('inferDirection — confidence clamped to [0.5, 1.0]', () => {
    it('base confidence is never below 0.5 (just before window edge)', () => {
      const reads = [
        read('EPC1', 'zone-a', 0),
        read('EPC1', 'zone-b', 2999), // 2999ms — just inside window
      ];
      const result = inferDirection(reads, WINDOW_MS);
      expect(result.confidence).toBeGreaterThanOrEqual(0.5);
    });

    it('sensor-boosted confidence is never above 1.0', () => {
      const reads = [
        read('EPC1', 'zone-a', 0),
        read('EPC1', 'zone-b', 10), // near-zero delta → confidence ~1.0 base
      ];
      const result = inferDirection(reads, WINDOW_MS, { pin1FiredFirst: true });
      expect(result.confidence).toBeLessThanOrEqual(1.0);
    });
  });

  // ─── deduplicateReads ────────────────────────────────────────────────────────

  describe('deduplicateReads', () => {
    it('collapses duplicate EPCs within the dedup window', () => {
      const reads = [
        read('EPC1', 'zone-a', 0),
        read('EPC1', 'zone-b', 500),  // same EPC, within 5s window
        read('EPC1', 'zone-a', 1000), // same EPC, within 5s window
      ];
      const result = deduplicateReads(reads, 5000);
      expect(result.filter((r) => r.epc === 'EPC1')).toHaveLength(1);
    });

    it('preserves distinct EPCs', () => {
      const reads = [
        read('EPC1', 'zone-a', 0),
        read('EPC2', 'zone-b', 100),
        read('EPC3', 'zone-a', 200),
      ];
      const result = deduplicateReads(reads, 5000);
      expect(result).toHaveLength(3);
    });

    it('returns the first read chronologically for each EPC', () => {
      const reads = [
        read('EPC1', 'zone-b', 500), // second in time
        read('EPC1', 'zone-a', 0),   // first in time
      ];
      const result = deduplicateReads(reads, 5000);
      expect(result).toHaveLength(1);
      expect(result[0].antennaZone).toBe('zone-a'); // the first one chronologically
    });
  });

  // ─── EdgeStateMachine ────────────────────────────────────────────────────────

  describe('EdgeStateMachine', () => {
    it('ignores IN event when tag is already Inside', () => {
      const sm = new EdgeStateMachine(0); // no min interval for tests
      sm.apply('EPC1', 'IN', new Date(1000));
      const result = sm.apply('EPC1', 'IN', new Date(2000));
      expect(result).toBeNull();
      expect(sm.getState('EPC1')).toBe('Inside');
    });

    it('ignores OUT event when tag is already Outside', () => {
      const sm = new EdgeStateMachine(0);
      sm.apply('EPC1', 'OUT', new Date(1000));
      const result = sm.apply('EPC1', 'OUT', new Date(2000));
      expect(result).toBeNull();
      expect(sm.getState('EPC1')).toBe('Outside');
    });

    it('allows both IN and OUT transitions from Unknown', () => {
      const sm1 = new EdgeStateMachine(0);
      expect(sm1.apply('EPC1', 'IN', new Date(1000))).toBe('Inside');

      const sm2 = new EdgeStateMachine(0);
      expect(sm2.apply('EPC2', 'OUT', new Date(1000))).toBe('Outside');
    });
  });

  // ─── Crossing event suppression ──────────────────────────────────────────────

  describe('Crossing event suppression', () => {
    it('does not emit when confidence is below threshold', () => {
      const processor = new CrossingEventProcessor({
        deviceId: 'test', doorId: 'door-a',
        dedupWindowMs: 5000, directionWindowMs: 3000,
        confidenceThreshold: 0.8, minInterEventMs: 0,
      });

      // 2999ms delta → confidence = 1 - 2999/3000 ≈ 0.0003 (well below 0.8)
      const reads = [
        read('EPC1', 'zone-a', 0),
        read('EPC1', 'zone-b', 2999),
      ];
      const events = processor.process(reads);
      expect(events).toHaveLength(0);
    });

    it('does not emit within min inter-event interval', () => {
      const processor = new CrossingEventProcessor({
        deviceId: 'test', doorId: 'door-a',
        dedupWindowMs: 5000, directionWindowMs: 3000,
        confidenceThreshold: 0.5, minInterEventMs: 10_000,
      });

      const readsIn = [read('EPC1', 'zone-a', 0), read('EPC1', 'zone-b', 100)];
      const first = processor.process(readsIn);
      expect(first).toHaveLength(1);

      // Second event within 10s (ts is still near 1000ms base)
      const readsIn2 = [read('EPC1', 'zone-a', 200), read('EPC1', 'zone-b', 300)];
      const second = processor.process(readsIn2);
      expect(second).toHaveLength(0);
    });
  });
});
