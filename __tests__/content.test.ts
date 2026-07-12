import { describe, it, expect } from "vitest";
import {
  NAV_LINKS,
  USE_SCALE_CONTENT,
  ORCHESTRATOR_CONTENT,
  RESEARCH_CONTENT,
  GOVERNANCE_CONTENT,
  AMBASSADORS_CONTENT,
  CHALLENGE_CONTENT,
} from "@/lib/content";

describe("content library", () => {
  it("NAV_LINKS has 7 entries each with href and label", () => {
    expect(NAV_LINKS).toHaveLength(7);
    NAV_LINKS.forEach((link) => {
      expect(link).toHaveProperty("href");
      expect(link).toHaveProperty("label");
    });
  });

  it("USE_SCALE_CONTENT has 5 levels (0-4)", () => {
    expect(USE_SCALE_CONTENT.levels).toHaveLength(5);
    USE_SCALE_CONTENT.levels.forEach((level, i) => {
      expect(level.number).toBe(i);
      expect(level.name).toBeTruthy();
      expect(level.definition).toBeTruthy();
      expect(level.scenario).toBeTruthy();
    });
  });

  it("ORCHESTRATOR_CONTENT has 3 tiers", () => {
    expect(ORCHESTRATOR_CONTENT.tiers).toHaveLength(3);
  });

  it("RESEARCH_CONTENT has 6 stats", () => {
    expect(RESEARCH_CONTENT.stats).toHaveLength(6);
    RESEARCH_CONTENT.stats.forEach((stat) => {
      expect(typeof stat.value).toBe("number");
      expect(stat.label).toBeTruthy();
      expect(stat.source).toBeTruthy();
    });
  });

  it("GOVERNANCE_CONTENT has 4 risk tiers", () => {
    expect(GOVERNANCE_CONTENT.riskTiers).toHaveLength(4);
  });

  it("AMBASSADORS_CONTENT has 4 sessions", () => {
    expect(AMBASSADORS_CONTENT.sessions).toHaveLength(4);
  });

  it("CHALLENGE_CONTENT judging rubric weights sum to 100", () => {
    const total = CHALLENGE_CONTENT.rubric.reduce((sum, r) => sum + r.weight, 0);
    expect(total).toBe(100);
  });
});
