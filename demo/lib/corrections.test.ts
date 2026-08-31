import { describe, expect, it } from "vitest";
import { BEATS, beatIndexById } from "./story";
import { EXAM_STEPS } from "./exam";
import { sourceOf } from "./screens";

/**
 * One test per item on the corrections sheet (2026-08-31, owner Achi Solomon).
 * Where the change is pure logic it asserts the logic; where it lives in JSX
 * it reads the source, the same way regressions.test.ts holds its invariants.
 */

describe("corrections sheet 2026-08-31", () => {
  // Item 1 — the door check verifies the person, not the kit.
  it("confirms identity by ID scan and SSN tail, never by kit ID", () => {
    const src = sourceOf("components/screens/cma/arrival.tsx");
    expect(src).not.toMatch(/Kit ID/);
    expect(src).toMatch(/Scan photo ID/);
    expect(src).toMatch(/ssnLast4/);
  });

  // Item 2 — consent starts unchecked; it is given, never presumed.
  it("starts every consent box unchecked", () => {
    const src = sourceOf("components/screens/cma/arrival.tsx");
    expect(src).not.toMatch(/care:\s*true/);
    expect(src).toMatch(/care:\s*false,\s*telehealth:\s*false,\s*recording:\s*false/);
  });

  // Item 3 — the ear health check captures one image per ear.
  it("renders one otoscopy capture per ear", () => {
    const src = sourceOf("components/exam/otoscopy-step.tsx");
    expect(src).toMatch(/Right ear/);
    expect(src).toMatch(/Left ear/);
    expect(src).not.toMatch(/>Both ears</);
  });

  // Item 4 — the hearing test shows two results, one per ear, in the step
  // and again on the results screen.
  it("presents pure tone results per ear in the step and the results screen", () => {
    for (const file of ["components/exam/puretone-step.tsx", "components/screens/patient/results.tsx"]) {
      const src = sourceOf(file);
      expect(src).toMatch(/Right ear/);
      expect(src).toMatch(/Left ear/);
    }
    // The results screen charts each ear separately, not as one overlay.
    expect(sourceOf("components/screens/patient/results.tsx")).toMatch(/Audiogram ear=/);
    // Refined 2026-08-31: the sweep animates through BOTH ears via the
    // lib-tested advanceSweep state machine, not a frozen one-ear snapshot.
    expect(sourceOf("components/exam/puretone-step.tsx")).toMatch(/advanceSweep/);
  });

  // Item 5 — tympanometry is a full step between the ear check and the
  // hearing test, with a beat and a screen for both roles.
  it("runs tympanometry right after the ear health check", () => {
    const ids = EXAM_STEPS.map(s => s.id);
    expect(ids.indexOf("tympanometry")).toBe(ids.indexOf("otoscopy") + 1);
    // Named for what it is (Achi, 2026-08-31): the screen says Tympanometry.
    expect(EXAM_STEPS.find(s => s.id === "tympanometry")?.title).toBe("Tympanometry");
    expect(beatIndexById("tympanometry")).toBe(beatIndexById("otoscopy") + 1);
    const beat = BEATS[beatIndexById("tympanometry")];
    expect(beat.screens.cma).toBe("cma-tympanometry");
    expect(beat.screens.patient).toBe("tympanometry");
  });

  // Item 6 — bone conduction is mandatory; nothing frames it as added on.
  // Refined 2026-08-31: the audiologist MONITORS it like any other step —
  // no "Intervene / Add bone conduction" call to action.
  it("treats bone conduction as a standard step, never an addition", () => {
    expect(EXAM_STEPS.find(s => s.id === "bone")?.conditional).toBe(false);
    const src = sourceOf("components/screens/cma/exam.tsx");
    expect(src).not.toMatch(/added this step/);
    expect(src).not.toMatch(/· added/);
    const monitor = sourceOf("components/screens/audiologist/supervision.tsx");
    expect(monitor).not.toMatch(/Add bone conduction/);
    expect(monitor).not.toMatch(/>Intervene</);
  });

  // Item 9 — the step sells the service package, not the hardware.
  it("labels the compare step by service package", () => {
    expect(sourceOf("components/screens/registry.tsx")).toMatch(/compare:"Compare service packages"/);
    expect(sourceOf("components/screens/patient/commerce.tsx")).toMatch(/Compare service packages/);
  });

  // Item 12 — a signing beat sits between checkout and activation, and its
  // agreement boxes start unchecked like consent does.
  it("requires the signing page before activation", () => {
    const signing = beatIndexById("signing");
    expect(signing).toBe(beatIndexById("checkout") + 1);
    expect(beatIndexById("activate")).toBe(signing + 1);
    expect(BEATS[signing].screens.cma).toBe("cma-signing");
    const src = sourceOf("components/screens/cma/suitcase.tsx");
    expect(src).toMatch(/contract:\s*false,\s*terms:\s*false,\s*card:\s*false/);
  });

  // Item 13 — the audiologist is on the CMA's screen from the moment the
  // tests start through the sale. Refined 2026-08-31: identity, consent and
  // the kit checklist are the CMA's own pre-exam tasks, so those pages stay
  // uncluttered — the video presence starts with the first exam step.
  it("keeps the audiologist live from the first exam step to activation", () => {
    const withTile = [
      "components/screens/cma/exam.tsx",
      "components/screens/cma/handoff.tsx",
      "components/screens/cma/suitcase.tsx",
    ];
    for (const file of withTile) {
      expect(sourceOf(file), `${file} must render AudiologistCallTile`).toMatch(/AudiologistCallTile/);
    }
    const withoutTile = [
      "components/screens/cma/arrival.tsx",
      "components/screens/cma/setup.tsx",
    ];
    for (const file of withoutTile) {
      expect(sourceOf(file), `${file} is pre-exam — no call tile`).not.toMatch(/AudiologistCallTile/);
    }
    // And the video runs both ways (refined 2026-08-31): the audiologist's
    // monitor shows the home feed with the patient's spoken feedback and a
    // talk-back control.
    const monitor = sourceOf("components/screens/audiologist/supervision.tsx");
    expect(monitor).toMatch(/HomeFeed/);
    expect(monitor).toMatch(/Talk to the room/);
  });

  // Items 5, 12 — every CMA screen a beat points at must be wired in the
  // role view, or the shell falls back to a "not built yet" stub mid-demo.
  it("wires every CMA screen the script points at", () => {
    const roleView = sourceOf("components/shell/role-view.tsx");
    const cmaScreens = [...new Set(BEATS.map(b => b.screens.cma))];
    for (const id of cmaScreens) {
      expect(roleView, `role-view must handle ${id}`).toContain(`case "${id}"`);
    }
  });

  // Item 14 — the after-delivery screen carries the whole care record and
  // the calibration service mock.
  it("summarises the care record and offers calibration after delivery", () => {
    const src = sourceOf("components/screens/patient/support.tsx");
    for (const marker of ["Hearing results", "serials", "visitHistory", "membership", "Documents you signed", "Calibrate my devices"]) {
      expect(src, `support screen must include ${marker}`).toContain(marker);
    }
  });
});
