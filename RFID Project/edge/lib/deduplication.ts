import type { RawRead } from './llrp';

// Returns one read per EPC (the first read chronologically) within the dedup window.
// Reads outside the window are preserved as-is.
export function deduplicateReads(reads: RawRead[], windowMs: number): RawRead[] {
  if (reads.length === 0) return [];

  // Sort chronologically
  const sorted = [...reads].sort((a, b) => a.ts.getTime() - b.ts.getTime());

  const seen = new Map<string, number>(); // epc → first seen timestamp
  const result: RawRead[] = [];

  for (const read of sorted) {
    const firstSeen = seen.get(read.epc);

    if (firstSeen === undefined) {
      // First time seeing this EPC — keep it
      seen.set(read.epc, read.ts.getTime());
      result.push(read);
    } else if (read.ts.getTime() - firstSeen > windowMs) {
      // Outside the dedup window — treat as a new read
      seen.set(read.epc, read.ts.getTime());
      result.push(read);
    }
    // Within the dedup window → drop the duplicate
  }

  return result;
}
