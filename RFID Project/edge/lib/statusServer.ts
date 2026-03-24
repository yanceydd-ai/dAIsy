import http from 'http';
import type { EdgeDb } from './database';
import { readPresenceCache } from './presenceCache';

const STATUS_PORT = 3001;

// Starts a local HTTP server on port 3001 (or a custom port for testing).
// GET /status → JSON array of presence cache entries.
// No authentication — localhost only.
export function createStatusServer(db: EdgeDb, port = STATUS_PORT): http.Server {
  const server = http.createServer(async (req, res) => {
    if (req.method === 'GET' && req.url === '/status') {
      try {
        const cache = await readPresenceCache(db);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(cache));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: msg }));
      }
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  server.listen(port, '127.0.0.1', () => {
    console.log(`[Status] HTTP server listening on http://127.0.0.1:${port}/status`);
  });

  return server;
}
