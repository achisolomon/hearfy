import { describe, expect, it } from "vitest";
import { BEATS, beatIndexById } from "./story";
import { sourceOf } from "./screens";

/**
 * The audiologist leads the ear check and tympanometry (owner, 2026-09-02:
 * "these pages are not CMA, it is the audiologist").
 *
 * She leads the JUDGMENT, not the scope — the CMA is still the hands in the
 * room, which is why `screens.cma` below must survive untouched. An
 * audiologist personally operating an otoscope would be 1:1, and the
 * supervision panel next door claims 1:6.
 */
describe("the audiologist leads the ear check and tympanometry", () => {
  const BEAT_IDS = ["otoscopy", "tympanometry"] as const;

  it("gives both beats to the audiologist", () => {
    for (const id of BEAT_IDS) {
      expect(BEATS[beatIndexById(id)].lead, id).toBe("audiologist");
    }
  });

  /**
   * The specific regression of changing `lead` alone: guided mode would light
   * her tab and then render `aud-panel` — her six-exam queue — in place of the
   * exam step the owner was actually looking at.
   */
  it("points her at the exam step, not at her supervision queue", () => {
    expect(BEATS[beatIndexById("otoscopy")].screens.audiologist).toBe("aud-otoscopy");
    expect(BEATS[beatIndexById("tympanometry")].screens.audiologist).toBe("aud-tympanometry");
  });

  /** She leads; the CMA still operates. Her screens are untouched. */
  it("leaves the CMA and patient screens exactly where they were", () => {
    const oto = BEATS[beatIndexById("otoscopy")];
    expect(oto.screens.cma).toBe("cma-otoscopy");
    expect(oto.screens.patient).toBe("otoscopy");
    const tymp = BEATS[beatIndexById("tympanometry")];
    expect(tymp.screens.cma).toBe("cma-tympanometry");
    expect(tymp.screens.patient).toBe("tympanometry");
  });

  /** Only these two beats move. The rest of Stage 4 stays the CMA's. */
  it("does not move any other Stage 4 beat", () => {
    for (const id of ["arrived", "consent", "setup", "puretone"]) {
      expect(BEATS[beatIndexById(id)].lead, id).toBe("cma");
    }
  });
});

describe("her framing on the shared step components", () => {
  /**
   * The steps are SHARED — the capture the CMA took is the capture she reads
   * (the same rule that already keeps the clinical review from drawing its
   * own second ear). So the copy branches; the markup does not fork.
   */
  it("carries a third framing branch on both steps", () => {
    for (const f of ["components/exam/otoscopy-step.tsx",
                     "components/exam/tympanometry-step.tsx"]) {
      expect(sourceOf(f), f).toMatch(/framing === "audiologist"/);
    }
  });

  it("widens the Framing union rather than forking the component", () => {
    const src = sourceOf("components/exam/otoscopy-step.tsx");
    expect(src).toMatch(/export type Framing = "patient" \| "cma" \| "audiologist"/);
  });

  /** She is not told how to hold a scope she is not holding. */
  it("does not give her the CMA's procedure copy", () => {
    const src = sourceOf("components/exam/otoscopy-step.tsx");
    const hers = src.split('framing === "audiologist"')[1] ?? "";
    expect(hers.slice(0, 300)).not.toMatch(/Angle the scope/);
  });
});
