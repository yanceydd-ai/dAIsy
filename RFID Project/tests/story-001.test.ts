import { describe, it, expect } from 'vitest';

// AC-001-01 / AC-001-04: Schema exports exist and are importable
describe('STORY-001: Project Scaffolding', () => {
  describe('Schema exports', () => {
    it('all tables are exported from db/schema.ts', async () => {
      const schema = await import('../db/schema');
      expect(schema.students).toBeDefined();
      expect(schema.tags).toBeDefined();
      expect(schema.studentTags).toBeDefined();
      expect(schema.doors).toBeDefined();
      expect(schema.devices).toBeDefined();
      expect(schema.deviceHeartbeats).toBeDefined();
      expect(schema.rawReads).toBeDefined();
      expect(schema.crossingEvents).toBeDefined();
      expect(schema.sessions).toBeDefined();
      expect(schema.sessionRoster).toBeDefined();
      expect(schema.presenceStates).toBeDefined();
      expect(schema.auditLog).toBeDefined();
      expect(schema.syncLog).toBeDefined();
      expect(schema.appConfig).toBeDefined();
    });
  });

  // AC-001-02: Design tokens match spec
  describe('Design tokens', () => {
    it('Hockaday brand colours are defined in globals.css', async () => {
      const fs = await import('fs');
      const css = fs.readFileSync('./app/globals.css', 'utf-8');
      expect(css).toContain('#004023'); // brand green
      expect(css).toContain('#BF202A'); // status missing / emergency
      expect(css).toContain('#519B57'); // status present
      expect(css).toContain('#84B9BF'); // status unknown
      expect(css).toContain('Montserrat'); // brand font
    });
  });
});
