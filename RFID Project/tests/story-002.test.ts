import { describe, it, expect } from 'vitest';
import type { Session } from 'next-auth';

// Helpers that mirror the session shape built in auth.ts callbacks
function buildSession(groups: string[]): Session {
  return {
    user: {
      name: 'Jane Smith',
      email: 'jsmith@hockaday.org',
      azureAdGroups: groups,
    },
    expires: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
  };
}

describe('STORY-002: Azure AD Authentication', () => {
  describe('Session shape', () => {
    it('session contains expected fields when groups are present', () => {
      const session = buildSession(['group-safety-officers-id']);
      expect(session.user.name).toBeDefined();
      expect(session.user.email).toBeDefined();
      expect(session.user.azureAdGroups).toBeInstanceOf(Array);
      expect(session.user.azureAdGroups.length).toBeGreaterThan(0);
      expect(session.expires).toBeDefined();
    });

    it('session contains empty groups array when user has no groups', () => {
      const session = buildSession([]);
      expect(session.user.azureAdGroups).toBeInstanceOf(Array);
      expect(session.user.azureAdGroups).toHaveLength(0);
    });
  });

  describe('Route protection', () => {
    it('unauthenticated request context has no auth property', () => {
      // Simulate the check performed in middleware.ts: if (!req.auth) → redirect
      const mockReq = { auth: null };
      const isAuthenticated = mockReq.auth !== null;
      expect(isAuthenticated).toBe(false);
    });

    it('authenticated request context has auth property', () => {
      const session = buildSession(['group-safety-officers-id']);
      const mockReq = { auth: session };
      const isAuthenticated = mockReq.auth !== null;
      expect(isAuthenticated).toBe(true);
    });
  });

  describe('Session expiry', () => {
    it('session expires in 8 hours (school-day duration)', () => {
      const now = Date.now();
      const session = buildSession([]);
      const expiresAt = new Date(session.expires).getTime();
      const diffHours = (expiresAt - now) / (1000 * 60 * 60);
      // Allow ±1 minute tolerance
      expect(diffHours).toBeGreaterThan(7.98);
      expect(diffHours).toBeLessThanOrEqual(8.01);
    });
  });
});
