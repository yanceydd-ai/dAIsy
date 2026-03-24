import { type NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth/requireRole';
import { registerWriter } from '@/lib/presence/sseManager';
import { getPresenceSnapshot, getPortalStatuses } from '@/lib/presence/snapshot';

const PING_INTERVAL_MS = 30_000;

// GET /api/presence/stream — SSE live updates (STORY-008)
// Any authenticated role.
export async function GET(req: NextRequest) {
  try {
    await requireAuth();
  } catch (err) {
    return err as Response;
  }

  const sessionId = req.nextUrl.searchParams.get('sessionId') ?? '*';

  const encoder = new TextEncoder();
  let unregister: (() => void) | null = null;
  let pingTimer: NodeJS.Timeout | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      const write = (data: string) => {
        controller.enqueue(encoder.encode(data));
      };

      // Register this writer for live updates
      unregister = registerWriter(sessionId, write);

      // Send initial snapshot
      try {
        const snapshotSessionId = sessionId === '*' ? null : sessionId;
        const snapshot = await getPresenceSnapshot(snapshotSessionId);
        write(`data: ${JSON.stringify(snapshot)}\n\n`);

        // Send current portal statuses
        const portals = await getPortalStatuses();
        for (const portal of portals) {
          write(`data: ${JSON.stringify(portal)}\n\n`);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[SSE] Failed to send initial snapshot:', msg);
      }

      // Keep-alive ping every 30s
      pingTimer = setInterval(() => {
        try {
          write(': ping\n\n');
        } catch {
          // Client disconnected
        }
      }, PING_INTERVAL_MS);
    },

    cancel() {
      unregister?.();
      if (pingTimer) clearInterval(pingTimer);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
