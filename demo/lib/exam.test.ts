import { describe, expect, it } from "vitest";
import { EXAM_STEPS, advanceSweep, stepsFor, nextStep, type PureToneOutcome, type SweepState } from "./exam";

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

describe("pure tone sweep", () => {
  // The animated test must cover BOTH ears (corrections sheet item 4
  // refinement): right first by convention, then left, then done.
  it("advances within the current ear", () => {
    expect(advanceSweep({ phase: "right", progress: 0 }, 2))
      .toEqual({ phase: "right", progress: 2 });
  });

  it("rolls from the right ear to the left at 100", () => {
    expect(advanceSweep({ phase: "right", progress: 99 }, 2))
      .toEqual({ phase: "left", progress: 0 });
  });

  it("finishes after the left ear", () => {
    expect(advanceSweep({ phase: "left", progress: 99 }, 2))
      .toEqual({ phase: "done", progress: 100 });
  });

  it("parks once done", () => {
    const done: SweepState = { phase: "done", progress: 100 };
    expect(advanceSweep(done, 2)).toBe(done);
  });

  it("walks right, then left, then done, from any tick size", () => {
    let s: SweepState = { phase: "right", progress: 0 };
    const phases: string[] = [];
    for (let i = 0; i < 500 && s.phase !== "done"; i++) {
      if (phases[phases.length - 1] !== s.phase) phases.push(s.phase);
      s = advanceSweep(s, 3);
    }
    expect(phases).toEqual(["right", "left"]);
    expect(s.phase).toBe("done");
  });
});
