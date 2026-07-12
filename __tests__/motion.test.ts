import { describe, it, expect } from "vitest";
import { MOTION_VARIANTS } from "@/lib/motion";

describe("MOTION_VARIANTS", () => {
  it("exports fadeUp variant", () => {
    expect(MOTION_VARIANTS.fadeUp).toBeDefined();
    expect(MOTION_VARIANTS.fadeUp.hidden).toEqual({ opacity: 0, y: 24 });
    expect(MOTION_VARIANTS.fadeUp.visible).toMatchObject({ opacity: 1, y: 0 });
  });

  it("exports staggerContainer variant", () => {
    expect(MOTION_VARIANTS.staggerContainer).toBeDefined();
  });

  it("exports expandHeight variant", () => {
    expect(MOTION_VARIANTS.expandHeight.collapsed).toEqual({ height: 0, opacity: 0 });
  });

  it("exports pageTransition variant", () => {
    expect(MOTION_VARIANTS.pageTransition.initial).toMatchObject({ opacity: 0, y: 16 });
  });

  it("exports nodePulse variant", () => {
    expect(MOTION_VARIANTS.nodePulse.idle).toMatchObject({ scale: 1 });
  });

  it("exports petalBreath variant", () => {
    expect(MOTION_VARIANTS.petalBreath.dim).toMatchObject({ opacity: 0.8 });
  });
});
