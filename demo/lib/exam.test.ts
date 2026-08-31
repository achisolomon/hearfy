import { describe, expect, it } from "vitest";
import { EXAM_STEPS, stepsFor, nextStep, type PureToneOutcome } from "./exam";

describe("exam sequence", () => {
  // Corrections sheet 2026-08-31: tympanometry sits between the ear health
  // check and the hearing test (item 5).
  it("lists every step in clinical order", () => {
    expect(EXAM_STEPS.map(s => s.id)).toEqual([
      "otoscopy", "tympanometry", "puretone", "speech", "bone", "analysis",
    ]);
  });

  // Corrections sheet 2026-08-31, item 6: bone conduction is mandatory for
  // every exam — a normal pure tone no longer skips it.
  it("runs every step regardless of the pure tone outcome", () => {
    for (const outcome of ["normal", "abnormal"] as const) {
      expect(stepsFor(outcome).map(s => s.id)).toEqual(EXAM_STEPS.map(s => s.id));
    }
  });

  it("marks no step conditional", () => {
    expect(EXAM_STEPS.filter(s => s.conditional)).toEqual([]);
  });

  it("advances to the next step for either outcome", () => {
    expect(nextStep("otoscopy", "normal")).toBe("tympanometry");
    expect(nextStep("speech", "abnormal")).toBe("bone");
    expect(nextStep("speech", "normal")).toBe("bone");
    expect(nextStep("bone", "normal")).toBe("analysis");
  });

  it("returns null past the last step", () => {
    expect(nextStep("analysis", "abnormal")).toBeNull();
  });

  it("treats an unknown step as finished rather than throwing", () => {
    expect(nextStep("not-a-step", "normal" as PureToneOutcome)).toBeNull();
  });
});
