import { describe, expect, it } from "vitest";
import { EXAM_STEPS, stepsFor, nextStep, type PureToneOutcome } from "./exam";

describe("exam sequence", () => {
  it("lists every step in clinical order", () => {
    expect(EXAM_STEPS.map(s => s.id)).toEqual([
      "otoscopy", "puretone", "speech", "bone", "analysis",
    ]);
  });

  it("includes bone conduction when pure tone is abnormal", () => {
    expect(stepsFor("abnormal").map(s => s.id)).toEqual([
      "otoscopy", "puretone", "speech", "bone", "analysis",
    ]);
  });

  it("skips bone conduction when pure tone is normal", () => {
    expect(stepsFor("normal").map(s => s.id)).toEqual([
      "otoscopy", "puretone", "speech", "analysis",
    ]);
  });

  it("advances to the next step for the given outcome", () => {
    expect(nextStep("speech", "abnormal")).toBe("bone");
    expect(nextStep("speech", "normal")).toBe("analysis");
  });

  it("returns null past the last step", () => {
    expect(nextStep("analysis", "abnormal")).toBeNull();
  });

  it("treats an unknown step as finished rather than throwing", () => {
    expect(nextStep("not-a-step", "normal" as PureToneOutcome)).toBeNull();
  });
});
