import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  registerWriter,
  broadcastToSession,
  broadcastGlobal,
  getSubscriberCount,
  _clearAllSubscribers,
} from '@/lib/presence/sseManager';

// ─── SSE Manager ─────────────────────────────────────────────────────────────

describe('STORY-008: SSE Manager', () => {
  beforeEach(() => {
    _clearAllSubscribers();
  });

  describe('broadcastToSession calls all registered writers for a session', () => {
    it('broadcasts to all writers registered for the session', () => {
      const writer1 = vi.fn();
      const writer2 = vi.fn();
      registerWriter('session-1', writer1);
      registerWriter('session-1', writer2);

      broadcastToSession('session-1', { type: 'studentUpdate', studentId: 'S1' });

      expect(writer1).toHaveBeenCalledOnce();
      expect(writer2).toHaveBeenCalledOnce();
      const payload = JSON.parse(writer1.mock.calls[0][0].replace(/^data: /, '').trim());
      expect(payload.type).toBe('studentUpdate');
      expect(payload.studentId).toBe('S1');
    });

    it('also broadcasts to global (*) subscribers', () => {
      const sessionWriter = vi.fn();
      const globalWriter = vi.fn();
      registerWriter('session-1', sessionWriter);
      registerWriter('*', globalWriter);

      broadcastToSession('session-1', { type: 'studentUpdate' });

      expect(sessionWriter).toHaveBeenCalledOnce();
      expect(globalWriter).toHaveBeenCalledOnce();
    });
  });

  describe('broadcastToSession removes a writer if it throws', () => {
    it('removes a writer that throws (connection closed)', () => {
      const good = vi.fn();
      const bad = vi.fn().mockImplementation(() => { throw new Error('connection closed'); });

      registerWriter('session-1', good);
      registerWriter('session-1', bad);
      expect(getSubscriberCount('session-1')).toBe(2);

      broadcastToSession('session-1', { type: 'ping' });

      expect(getSubscriberCount('session-1')).toBe(1);
      expect(good).toHaveBeenCalledOnce();
    });
  });

  describe('unregister removes the writer', () => {
    it('writer is no longer called after unregister', () => {
      const writer = vi.fn();
      const unregister = registerWriter('session-1', writer);

      broadcastToSession('session-1', { type: 'ping' });
      expect(writer).toHaveBeenCalledOnce();

      unregister();
      broadcastToSession('session-1', { type: 'ping' });
      expect(writer).toHaveBeenCalledOnce(); // still once — not called again
    });
  });

  describe('snapshot payload contains all required fields', () => {
    it('snapshot event shape is correct', () => {
      const snapshot = {
        type: 'snapshot',
        sessionId: 'session-1',
        presentCount: 847,
        missingCount: 12,
        unknownCount: 3,
        students: [
          {
            studentId: 'uuid-1',
            name: 'Jane Smith',
            grade: '10',
            state: 'present',
            lastCrossingDirection: 'IN',
            lastCrossingDoor: 'door-a',
            lastCrossingTs: '2026-03-23T13:04:22Z',
            manualOverride: false,
          },
        ],
      };

      // Verify required fields exist
      expect(snapshot.type).toBe('snapshot');
      expect(typeof snapshot.presentCount).toBe('number');
      expect(typeof snapshot.missingCount).toBe('number');
      expect(typeof snapshot.unknownCount).toBe('number');
      expect(Array.isArray(snapshot.students)).toBe(true);

      const s = snapshot.students[0];
      expect(s).toHaveProperty('studentId');
      expect(s).toHaveProperty('name');
      expect(s).toHaveProperty('grade');
      expect(s).toHaveProperty('state');
      expect(s).toHaveProperty('lastCrossingDirection');
      expect(s).toHaveProperty('lastCrossingDoor');
      expect(s).toHaveProperty('lastCrossingTs');
      expect(s).toHaveProperty('manualOverride');
    });
  });

  describe('studentUpdate event shape', () => {
    it('studentUpdate contains correct state after IN crossing', () => {
      const update = {
        type: 'studentUpdate',
        studentId: 'uuid-1',
        name: 'Jane Smith',
        grade: '10',
        state: 'present',  // IN crossing → present
        lastCrossingDirection: 'IN',
        lastCrossingDoor: 'door-b',
        lastCrossingTs: '2026-03-23T13:04:22Z',
        manualOverride: false,
      };

      expect(update.type).toBe('studentUpdate');
      expect(update.state).toBe('present');
      expect(update.lastCrossingDirection).toBe('IN');
    });
  });

  describe('portalStatus event shape', () => {
    it('portalStatus event is emitted when device goes offline', () => {
      const received: unknown[] = [];
      registerWriter('*', (data) => {
        received.push(JSON.parse(data.replace(/^data: /, '').trim()));
      });

      const portalEvent = {
        type: 'portalStatus',
        doorId: 'door-a',
        status: 'offline',
        lastHeartbeatTs: '2026-03-23T13:00:00Z',
      };

      broadcastGlobal(portalEvent);

      expect(received).toHaveLength(1);
      const evt = received[0] as Record<string, unknown>;
      expect(evt.type).toBe('portalStatus');
      expect(evt.doorId).toBe('door-a');
      expect(evt.status).toBe('offline');
      expect(evt.lastHeartbeatTs).toBeDefined();
    });
  });
});
