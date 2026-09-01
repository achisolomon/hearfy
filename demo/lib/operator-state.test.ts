import { describe, expect, it } from "vitest";
import { STAGES } from "./story";
import { exceptions as baseExceptions, pipeline as basePipeline } from "./mock-data";
import { operatorStateAt } from "./operator-state";

describe("the operator's board at a stage", () => {
  it("gives every stage a state", () => {
    for (const s of STAGES) expect(operatorStateAt(s.n)).toBeTruthy();
  });

  it("keeps the nine pipeline stages in order at every stage", () => {
    for (const s of STAGES) {
      const { pipeline } = operatorStateAt(s.n);
      expect(pipeline.map(p => p.stage)).toEqual(basePipeline.map(p => p.stage));
      expect(pipeline.map(p => p.name)).toEqual(basePipeline.map(p => p.name));
    }
  });

  it("marks exactly one pipeline stage as the one Alex is in", () => {
    for (const s of STAGES) {
      const { pipeline } = operatorStateAt(s.n);
      expect(pipeline.filter(p => p.hero)).toHaveLength(1);
      expect(pipeline.find(p => p.hero)?.stage).toBe(s.n);
    }
  });

  it("never shows a negative count", () => {
    for (const s of STAGES) {
      for (const p of operatorStateAt(s.n).pipeline) {
        expect(p.count).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("is deterministic — the same stage always renders the same board", () => {
    for (const s of STAGES) {
      expect(operatorStateAt(s.n)).toEqual(operatorStateAt(s.n));
    }
  });

  it("keeps every seeded exception, whatever the stage", () => {
    for (const s of STAGES) {
      const ids = operatorStateAt(s.n).exceptions.map(e => e.kind + e.patient);
      for (const e of baseExceptions) {
        expect(ids).toContain(e.kind + e.patient);
      }
    }
  });

  it("puts Alex's own exception in the queue only while it is live", () => {
    const has = (stage: number) =>
      operatorStateAt(stage as never).exceptions.some(e => e.patient === "Alex R.");
    // Nothing is wrong before the visit starts...
    expect(has(1)).toBe(false);
    // ...the room is noisy during the exam...
    expect(has(4)).toBe(true);
    // ...and it is resolved by the time the report is signed.
    expect(has(9)).toBe(false);
  });

  it("keeps the exception shape the card renders", () => {
    for (const e of operatorStateAt(4).exceptions) {
      expect(typeof e.kind).toBe("string");
      expect(typeof e.patient).toBe("string");
      expect(typeof e.stage).toBe("number");
      expect(typeof e.detail).toBe("string");
      expect(typeof e.age).toBe("string");
      expect(["high", "medium", "low"]).toContain(e.severity);
    }
  });
});
