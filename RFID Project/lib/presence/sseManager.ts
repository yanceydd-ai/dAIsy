// Server-side SSE subscriber map.
// Each session maps to a set of writer functions.
// Writers throw when the client has disconnected — we remove them on throw.

type SSEWriter = (data: string) => void;

// Map<sessionId, Set<SSEWriter>>
// sessionId '*' = global (no session filter)
const _subscribers = new Map<string, Set<SSEWriter>>();

export function registerWriter(sessionId: string, writer: SSEWriter): () => void {
  let set = _subscribers.get(sessionId);
  if (!set) {
    set = new Set();
    _subscribers.set(sessionId, set);
  }
  set.add(writer);

  // Return an unregister function
  return () => {
    set!.delete(writer);
    if (set!.size === 0) _subscribers.delete(sessionId);
  };
}

export function broadcastToSession(sessionId: string, event: object): void {
  const data = `data: ${JSON.stringify(event)}\n\n`;

  // Broadcast to session-specific subscribers AND global subscribers
  const targets = new Set<string>([sessionId, '*']);

  for (const target of targets) {
    const writers = _subscribers.get(target);
    if (!writers) continue;

    const dead: SSEWriter[] = [];
    for (const writer of writers) {
      try {
        writer(data);
      } catch {
        dead.push(writer); // connection closed — remove
      }
    }
    for (const w of dead) {
      writers.delete(w);
    }
    if (writers.size === 0) _subscribers.delete(target);
  }
}

export function broadcastGlobal(event: object): void {
  const data = `data: ${JSON.stringify(event)}\n\n`;

  for (const [, writers] of _subscribers) {
    const dead: SSEWriter[] = [];
    for (const writer of writers) {
      try {
        writer(data);
      } catch {
        dead.push(writer);
      }
    }
    for (const w of dead) writers.delete(w);
  }
}

export function getSubscriberCount(sessionId: string): number {
  return _subscribers.get(sessionId)?.size ?? 0;
}

// For testing only
export function _clearAllSubscribers(): void {
  _subscribers.clear();
}
