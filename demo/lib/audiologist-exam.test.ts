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

  /**
   * She opens on her whole queue, THEN dives into one exam (owner,
   * 2026-09-02). `aud-panel` was already her screen during arrival, consent
   * and setup, but she led none of those, so a guided walk never landed on it
   * — the viewer met her mid-exam having never seen there were six.
   */
  it("shows her six-exam overview after the kit checklist, before the ear check", () => {
    const setup = beatIndexById("setup");
    const overview = beatIndexById("overview");
    const otoscopy = beatIndexById("otoscopy");
    expect(overview).toBe(setup + 1);
    expect(otoscopy).toBe(overview + 1);
    expect(BEATS[overview].lead).toBe("audiologist");
    expect(BEATS[overview].screens.audiologist).toBe("aud-panel");
  });

  /** The panel introduces her once; it is not shown again as a second beat. */
  it("gives the six-exam panel exactly one beat that leads with it", () => {
    const led = BEATS.filter(b => b.lead === "audiologist" && b.screens.audiologist === "aud-panel");
    expect(led.map(b => b.id)).toEqual(["overview"]);
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

describe("the retake override", () => {
  /**
   * The override must never write to `lib/mock-data`: it is module state the
   * CMA's and the patient's screens read from the same import, so a mutation
   * there would change two other roles' screens as a side effect of her
   * clicking a button on hers.
   */
  it("passes status down as a prop instead of mutating mock-data", () => {
    for (const f of ["components/exam/otoscopy-step.tsx",
                     "components/exam/tympanometry-step.tsx"]) {
      const src = sourceOf(f);
      expect(src, f).toMatch(/status\?:/);
      // No assignment into the imported mock objects.
      expect(src, f).not.toMatch(/\b(otoscopy|tympanometry)\.(left|right)\s*=/);
    }
  });

  it("keeps the mock values as the default so other roles are unaffected", () => {
    for (const f of ["components/exam/otoscopy-step.tsx",
                     "components/exam/tympanometry-step.tsx"]) {
      const src = sourceOf(f);
      // The override is read off `status` and then EVERY use of it falls back
      // to the mock with `??`. Asserting the fallback rather than one spelling
      // of it: the point is that an absent override changes nothing for the
      // CMA and the patient, who pass no `status` at all.
      expect(src, f).toMatch(/const over = status\?\.\[/);
      expect(src, f).toMatch(/over\?\.tone \?\? \w+\.tone/);
      expect(src, f).toMatch(/over\?\.label \?\?/);
    }
  });
});

describe("her exam screens", () => {
  const SRC = () => sourceOf("components/screens/audiologist/exam.tsx");

  /**
   * The video is the PATIENT, not Dr. Reed (owner, 2026-09-02). She is the one
   * watching; showing her own face back at her is the mirror pointed the wrong
   * way. `HomeFeed` already selects `room-patient.mp4` for these beats via
   * `TESTING_BEATS`, so this is composition, not new footage.
   */
  it("shows the patient's feed, never Dr. Reed's", () => {
    expect(SRC()).toMatch(/HomeFeed/);
    expect(SRC()).not.toMatch(/ReedFeed|CallSplit|AudiologistStrip/);
  });

  /** Both beats named, so HomeFeed picks the testing clip and his lines. */
  it("names its beat so the feed and captions follow the story", () => {
    expect(SRC()).toMatch(/beat="otoscopy"/);
    expect(SRC()).toMatch(/beat="tympanometry"/);
  });

  /**
   * The call geometry is defined in ONE place. Two new screens rolling their
   * own container is exactly the drift `CALL_HEADER_MIN` exists to stop — the
   * call once landed at three different x positions across roles.
   */
  it("uses the shared call container and column", () => {
    expect(SRC()).toMatch(/CallShell/);
    expect(SRC()).toMatch(/VideoSplit/);
    expect(SRC()).not.toMatch(/max-w-(4xl|5xl)/);
  });

  /** Her screen's own job: the retake decision. */
  it("gives her an accept and a retake control", () => {
    expect(SRC()).toMatch(/Accept both/);
    expect(SRC()).toMatch(/retake|re-run/i);
  });

  /**
   * EITHER ear can be sent back, not just one (owner, 2026-09-02: "she also
   * needs to be able to send the left ear").
   *
   * The first cut had a single shared button that named the right ear, so the
   * left was un-rejectable — and the left canal is the one carrying cerumen in
   * this data, i.e. exactly the ear most likely to need returning. The control
   * now renders per ear via `earAction`, so it names no side at all: which ear
   * it acts on is its position in the grid.
   */
  it("lets her send back either ear, not one hardcoded side", () => {
    const src = SRC();
    // A set, so both ears can be out at once — not a single-choice union.
    expect(src).toMatch(/ReadonlySet<Side>/);
    // The control is per-ear, handed to the step to render inside each card.
    expect(src).toMatch(/earAction=/);
    // And it must not hardcode a side in the button copy.
    expect(src).not.toMatch(/Send right ear back|Send left ear back/);
  });

  /** Both steps must accept the per-ear slot, or only one exam gets it. */
  it("wires the per-ear control into both exam steps", () => {
    for (const f of ["components/exam/otoscopy-step.tsx",
                     "components/exam/tympanometry-step.tsx"]) {
      const src = sourceOf(f);
      expect(src, f).toMatch(/earAction\?:/);
      expect(src, f).toMatch(/earAction\(ear\.side\)/);
    }
  });

  /**
   * Each step asks about its own artefact. The judgment card was shared
   * wording, so the tympanometry screen showed an audiologist looking at two
   * tympanograms a card asking her to accept "captures".
   */
  it("asks about traces on tympanometry and captures on the ear check", () => {
    const src = SRC();
    expect(src).toMatch(/prompt="Accept both captures/);
    expect(src).toMatch(/prompt="Accept both traces/);
  });

  /** The steps are shared, not re-drawn. */
  it("reuses the shared step components", () => {
    expect(SRC()).toMatch(/OtoscopyStep/);
    expect(SRC()).toMatch(/TympanometryStep/);
  });
});

describe("routing", () => {
  /**
   * Every screen id the script names must resolve to a real component. An
   * unrouted id does not throw — it renders the "not built yet" stub, so the
   * failure is silent until someone walks the demo.
   */
  it("routes both of her new screens", () => {
    const src = sourceOf("components/shell/role-view.tsx");
    expect(src).toMatch(/case "aud-otoscopy": return <AudOtoscopy/);
    expect(src).toMatch(/case "aud-tympanometry": return <AudTympanometry/);
  });

  it("leaves no audiologist screen in the script unrouted", () => {
    const src = sourceOf("components/shell/role-view.tsx");
    const ids = new Set(BEATS.map(b => String(b.screens.audiologist)));
    for (const id of ids) {
      expect(src, `${id} falls through to Stub`).toMatch(`case "${id}":`);
    }
  });
});
