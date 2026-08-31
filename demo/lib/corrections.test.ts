import { describe, expect, it } from "vitest";
import { BEATS, beatIndexById } from "./story";
import { EXAM_STEPS } from "./exam";
import { componentFiles, sourceOf } from "./screens";

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

  // Refined 2026-08-31: the compare screen shows a picture of each device,
  // in both the desktop table and the phone cards.
  it("shows a device picture on the compare screen", () => {
    const src = sourceOf("components/screens/patient/commerce.tsx");
    expect((src.match(/DeviceThumb/g) ?? []).length).toBeGreaterThanOrEqual(3);
  });

  // Item 12 — a signing beat sits between checkout and activation. Refined
  // 2026-08-31: the PATIENT leads it — contract, terms, card and signature
  // are approved on the patient's own phone, and the CMA's screen is a
  // read-only mirror of those inputs (lib/signing is the shared store; its
  // own test file pins that every approval starts unchecked).
  it("requires the patient's signing page before activation", () => {
    const signing = beatIndexById("signing");
    expect(signing).toBe(beatIndexById("checkout") + 1);
    expect(beatIndexById("activate")).toBe(signing + 1);
    expect(BEATS[signing].lead).toBe("patient");
    expect(BEATS[signing].screens.patient).toBe("signing");
    expect(BEATS[signing].screens.cma).toBe("cma-signing");
    // The patient screen owns the actions; the CMA mirror can take none.
    const patientSrc = sourceOf("components/screens/patient/commerce.tsx");
    expect(patientSrc).toMatch(/toggleSigningItem/);
    expect(patientSrc).toMatch(/onClick=\{sign\}/);
    const cmaSrc = sourceOf("components/screens/cma/suitcase.tsx");
    expect(cmaSrc).toMatch(/useSigning/);
    expect(cmaSrc, "the CMA mirror must not write signing state").not.toMatch(/toggleSigningItem|[^.]sign\(\)/);
  });

  // Item 13 — the call runs from the first exam step until the patient is
  // fitted and happy, on BOTH sides. Refined 2026-08-31: identity, consent
  // and the kit checklist are the CMA's own pre-exam tasks (no call there),
  // and on a tablet the call is a Zoom-like half of the screen.
  it("keeps the call live from the first exam step until the fit, both sides", () => {
    const withCall = [
      "components/screens/cma/exam.tsx",
      "components/screens/cma/handoff.tsx",
      "components/screens/cma/suitcase.tsx",
    ];
    for (const file of withCall) {
      expect(sourceOf(file), `${file} must render the call split`).toMatch(/CallSplit/);
    }
    const withoutCall = [
      "components/screens/cma/arrival.tsx",
      "components/screens/cma/setup.tsx",
    ];
    for (const file of withoutCall) {
      expect(sourceOf(file), `${file} is pre-exam — no call`).not.toMatch(/CallSplit|AudiologistCallTile/);
    }
    // The audiologist sees the room on every screen of hers until the
    // prescription is locked — monitoring, review, signature, consult.
    for (const file of [
      "components/screens/audiologist/supervision.tsx",
      "components/screens/audiologist/review.tsx",
      "components/screens/audiologist/consult.tsx",
    ]) {
      expect(sourceOf(file), `${file} must render the home feed`).toMatch(/HomeFeed/);
    }
    expect(sourceOf("components/screens/audiologist/home-feed.tsx")).toMatch(/Talk to the room/);
  });

  // Refined 2026-08-31: the video is the SAME size in the SAME place on
  // every screen that carries it — the geometry lives in exactly one
  // component, and every video screen on both sides renders through it.
  it("defines the call's size and place in one component only", () => {
    const geometry = /minmax\(0,380px\)/;
    expect(sourceOf("components/screens/video-split.tsx")).toMatch(geometry);
    for (const file of componentFiles()) {
      if (file.endsWith("video-split.tsx")) continue;
      expect(sourceOf(file), `${file} must not define its own video column`).not.toMatch(geometry);
    }
    for (const file of [
      "components/screens/cma/call-tile.tsx",
      "components/screens/audiologist/supervision.tsx",
      "components/screens/audiologist/review.tsx",
      "components/screens/audiologist/consult.tsx",
    ]) {
      expect(sourceOf(file), `${file} must place its video via VideoSplit`).toMatch(/VideoSplit/);
    }
  });

  // Refined 2026-08-31: every audiologist screen opens with the same page
  // header — eyebrow plus title — including the two sign-off screens,
  // which used to start at a bare card.
  it("gives every audiologist screen the standard page header", () => {
    for (const file of [
      "components/screens/audiologist/supervision.tsx",
      "components/screens/audiologist/review.tsx",
      "components/screens/audiologist/consult.tsx",
    ]) {
      const eyebrows = sourceOf(file).match(/tracking-\[\.2em\]/g) ?? [];
      expect(eyebrows.length, `${file} holds two screens — each needs a header`).toBeGreaterThanOrEqual(2);
    }
  });

  // Refined 2026-08-31: the patient's exam feels like a hearing lab with
  // the audiologist right next to them — her live strip is on every exam
  // step of the patient's phone.
  it("keeps Dr. Reed next to the patient through the exam", () => {
    const src = sourceOf("components/screens/patient/exam.tsx");
    expect((src.match(/<AudiologistStrip /g) ?? []).length).toBeGreaterThanOrEqual(3);
  });

  // Only the patient is on a phone (refined 2026-08-31): every CMA screen
  // uses the tablet column, not the phone-width strip.
  it("lays out every CMA screen for a tablet", () => {
    for (const file of [
      "components/screens/cma/day.tsx",
      "components/screens/cma/arrival.tsx",
      "components/screens/cma/setup.tsx",
      "components/screens/cma/exam.tsx",
      "components/screens/cma/handoff.tsx",
      "components/screens/cma/suitcase.tsx",
    ]) {
      expect(sourceOf(file), `${file} must use the tablet Shell`).toMatch(/<Shell tablet>/);
    }
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
