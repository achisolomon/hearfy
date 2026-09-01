import { describe, expect, it } from "vitest";
import { BEATS, ROLES, STAGES, type Role } from "./story";

describe("beat script", () => {
  it("has beats", () => {
    expect(BEATS.length).toBeGreaterThan(0);
  });

  it("defines a screen for every role on every beat", () => {
    for (const beat of BEATS) {
      for (const role of ROLES) {
        expect(beat.screens[role], `beat ${beat.id} is missing a ${role} screen`).toBeTruthy();
      }
    }
  });

  it("covers all nine stages in ascending order", () => {
    const seen = BEATS.map(b => b.stage);
    expect(new Set(seen).size).toBe(STAGES.length);
    expect(seen).toEqual([...seen].sort((a, b) => a - b));
  });

  it("has unique beat ids", () => {
    const ids = BEATS.map(b => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

import {
  beatForRoleSwitch,
  beatIndexById,
  firstBeatOfStage,
  mirrorHandoffAt,
  nextBeat,
  prevBeat,
  beatForScreen,
  screenFor,
  isLastBeat,
  beatsForRole,
  nextBeatForRole,
  prevBeatForRole,
  soloHandoffAt,
} from "./story";

describe("pointer maths", () => {
  it("finds a beat index by id", () => {
    expect(beatIndexById("welcome")).toBe(0);
    expect(beatIndexById("nope")).toBe(-1);
  });

  it("finds the first beat of a stage", () => {
    expect(BEATS[firstBeatOfStage(1)].stage).toBe(1);
    expect(BEATS[firstBeatOfStage(5)].stage).toBe(5);
    // It must be the FIRST beat of that stage, not just any.
    const i = firstBeatOfStage(5);
    expect(i === 0 || BEATS[i - 1].stage).not.toBe(5);
  });

  it("steps forward and stops at the end", () => {
    expect(nextBeat(0)).toBe(1);
    expect(nextBeat(BEATS.length - 1)).toBe(BEATS.length - 1);
  });

  it("steps back and stops at the start", () => {
    expect(prevBeat(1)).toBe(0);
    expect(prevBeat(0)).toBe(0);
  });

  it("maps a role screen back to a beat", () => {
    expect(beatForScreen("patient", "results")).toBe(beatIndexById("results"));
    expect(beatForScreen("patient", "not-a-screen")).toBe(-1);
  });

  it("returns the screen a role shows at a beat", () => {
    expect(screenFor(beatIndexById("supervision"), "audiologist")).toBe("aud-panel");
    expect(screenFor(beatIndexById("supervision"), "patient")).toBe("testing");
  });

  it("knows the last beat", () => {
    expect(isLastBeat(BEATS.length - 1)).toBe(true);
    expect(isLastBeat(0)).toBe(false);
  });

  it("clamps out-of-range indices instead of throwing", () => {
    expect(screenFor(-5, "patient")).toBe(BEATS[0].screens.patient);
    expect(screenFor(999, "patient")).toBe(BEATS[BEATS.length - 1].screens.patient);
  });
});

describe("solo mode (per-persona entry)", () => {
  it("lists only beats where the role's screen changes", () => {
    // The operator used to be the example here (his dashboard was one screen
    // id for the whole script), but he now gets a stage-driven walk instead
    // of a screen-change-driven one (see "the operator's walk" below) — so
    // this asserts the screen-change rule on a role it still governs.
    const beats = beatsForRole("cma");
    const screens = beats.map(i => BEATS[i].screens.cma);
    // Never two consecutive stops on the same screen — that is what makes
    // Next always change the view instead of repeating a press.
    screens.forEach((s, i) => {
      if (i > 0) expect(s).not.toBe(screens[i - 1]);
    });
  });

  it("gives the CMA a walk through their own screens", () => {
    const beats = beatsForRole("cma");
    const screens = beats.map(i => BEATS[i].screens.cma);
    // No CONSECUTIVE repeats — that is what makes Next always change the view.
    // A screen may legitimately recur later: the CMA opens on the day list and
    // returns to it after closing the visit out.
    screens.forEach((s, i) => {
      if (i > 0) expect(s, `beat ${beats[i]} repeats the previous screen`).not.toBe(screens[i - 1]);
    });
    expect(screens).toContain("cma-arrival");
    expect(screens).toContain("cma-closeout");
  });

  it("skips no beat when entering mid-stretch", () => {
    // Beat 5 (payment) sits inside a run where the CMA screen never changes.
    // Next must land on the very next change — cma-enroute — not skip past it.
    const from = beatIndexById("payment");
    const to = nextBeatForRole(from, "cma");
    expect(BEATS[to].screens.cma).toBe("cma-enroute");
  });

  it("advances and stops at the end of a role's walk", () => {
    const beats = beatsForRole("cma");
    const last = beats[beats.length - 1];
    expect(nextBeatForRole(last, "cma")).toBe(last);
    expect(nextBeatForRole(beats[0], "cma")).toBe(beats[1]);
  });

  it("steps back and stops at the start of a role's walk", () => {
    const beats = beatsForRole("cma");
    expect(prevBeatForRole(beats[0], "cma")).toBe(beats[0]);
    expect(prevBeatForRole(beats[2], "cma")).toBe(beats[1]);
  });

  // The phone bar disables Back when `prevBeatForRole(beat, role) === beat`
  // (demo-shell.tsx's `atStart`). A viewer mid-walk who saw Back look dead
  // reported "there is no back button" — this proves the guard itself is
  // sound: for every role, every beat actually reachable in that role's solo
  // walk EXCEPT the first reports Back as available. If this ever regresses
  // (e.g. a future edit to beatsForRole or prevBeatForRole reintroduces a
  // beat where the walk's own pointer looks stuck), Back would go dead mid-
  // story again with no visual difference from the legitimate first-beat case.
  it("never reports Back as unavailable except at the true first beat of a role's walk", () => {
    for (const role of ROLES) {
      const walk = beatsForRole(role);
      for (const beat of walk.slice(1)) {
        expect(
          prevBeatForRole(beat, role),
          `${role} beat ${beat} (not the walk's first beat) falsely reports atStart`,
        ).not.toBe(beat);
      }
    }
  });
});

describe("solo walk boundaries", () => {
  it("a role whose screen never changes has a one-beat walk", () => {
    // The operator is no longer such a role — his walk is the nine stages —
    // so this asserts the rule on the generic path instead of on him.
    const roles = ROLES.filter(r => r !== "operator");
    for (const role of roles) {
      const screens = BEATS.map(b => b.screens[role]);
      const unchanging = screens.every(s => s === screens[0]);
      if (unchanging) expect(beatsForRole(role)).toEqual([0]);
    }
  });

  it("every role's walk starts at or before its first appearance", () => {
    for (const role of ROLES) {
      const beats = beatsForRole(role);
      expect(beats.length).toBeGreaterThan(0);
      expect(beats[0]).toBe(0);
    }
  });

  it("walking a role end to end visits every one of its screens", () => {
    for (const role of ROLES) {
      const walk = beatsForRole(role);
      const seen = new Set(walk.map(i => BEATS[i].screens[role]));
      const all = new Set(BEATS.map(b => b.screens[role]));
      expect(seen, `${role} walk misses a screen`).toEqual(all);
    }
  });
});

describe("the operator's walk", () => {
  // His dashboard is one screen id for the whole script, so the screen-change
  // rule gave him a one-beat walk: entering as him showed "End of this
  // persona's day" on the first screen and the chrome's Next was dead. The
  // dashboard reacts to the stage, so his walk is the nine stages.
  it("gives the operator one stop per stage", () => {
    const walk = beatsForRole("operator");
    expect(walk).toHaveLength(STAGES.length);
    expect(walk.map(i => BEATS[i].stage)).toEqual(STAGES.map(s => s.n));
  });

  it("starts the operator's walk at the first beat", () => {
    expect(beatsForRole("operator")[0]).toBe(0);
  });

  it("advances the operator a stage at a time", () => {
    const walk = beatsForRole("operator");
    for (let k = 0; k < walk.length - 1; k++) {
      expect(nextBeatForRole(walk[k], "operator")).toBe(walk[k + 1]);
    }
    // ...and stops at the last stage rather than running off the end.
    const last = walk[walk.length - 1];
    expect(nextBeatForRole(last, "operator")).toBe(last);
  });

  it("still gives every other role a walk driven by their screen changes", () => {
    for (const role of ["patient", "cma", "audiologist"] as const) {
      const walk = beatsForRole(role);
      const screens = walk.map(i => BEATS[i].screens[role]);
      // No two consecutive stops show the same screen.
      expect(screens).toEqual(screens.filter((s, k) => k === 0 || s !== screens[k - 1]));
    }
  });
});

/**
 * Owner, 2026-09-01: entered as Maya (CMA, solo mode) from the cover and
 * walked her day forward with the chrome's own Next. From the beat where her
 * screen is a read-only mirror of a patient-led act ("Alex is reviewing the
 * contract on their phone... nothing here is yours to tap"), pressing Next
 * carried straight past the patient's own screen for that same act to the
 * NEXT thing Maya does — so the moment that beat exists to show (the patient
 * actually acting) was never shown to either persona. Back worked
 * (`prevBeatForRole` lands correctly on the mirror beat), which is how the
 * owner could reach it at all.
 *
 * `nextBeatForRole(i, role)` walks only `role`'s own screen changes and never
 * reassigns role — correct for advancing WITHIN a persona's own stretch, but
 * wrong at a beat whose entire purpose is another persona acting while the
 * current persona is explicitly a passive mirror. The chrome's Next (unlike
 * an in-screen button) is allowed to hand over at a genuine handoff — this
 * describe block pins the rule that decides WHEN a solo walk-stop is such a
 * handoff, structurally, with no beat id or number hardcoded.
 *
 * The rule (`soloHandoffAt`): a walk-stop `i` for `role` is a handoff point
 * only when ALL of:
 *   1. `role` does not lead beat `i` (someone else does — a mirror stop).
 *   2. `i` is not `role`'s own walk-start (beat 0) — at the very start
 *      `role` has not begun their story yet, so there is nothing to "resume"
 *      and firing here would eject a viewer who just chose to enter as this
 *      persona before their walk ever begins.
 *   3. `role`'s OWN next walk-stop after `i` is led by `role` again — i.e.
 *      this mirror is a single aside sandwiched between two of role's own
 *      led stretches, not the start of an extended passive stretch where
 *      role legitimately keeps watching several more beats led by others
 *      (e.g. the patient watching the CMA's whole home-visit exam on his own
 *      phone, beat after beat — that must stay a normal solo walk, not a
 *      cascade of handoffs that would eject the viewer after one press).
 *   4. `role`'s own screen at `i` differs from `role`'s own screen at the
 *      very next FULL beat (`i + 1`). Condition 3 alone is not enough: a
 *      candidate beat found this way (screen "cma-stock" shown one beat
 *      before the CMA's OWN "stock" beat, which shows the identical screen)
 *      passes 1–3 but is not a one-off mirror at all — it is just an early,
 *      shared appearance of a screen `role` goes on to properly own one beat
 *      later. Firing there hands off before `role` ever reaches that beat
 *      (and everything after it) themselves, silently truncating the rest
 *      of their own walk — discovered by simulating the fix end-to-end
 *      below, not by inspection.
 */
describe("solo mode handoff at a passive-mirror beat", () => {
  // The owner's exact case, derived structurally rather than hardcoded: find
  // the beat whose screens are (a) NOT led by the CMA, (b) a stop in the
  // CMA's own solo walk (her screen changes there too — it is a real mirror,
  // not a placeholder), (c) immediately followed, in her own walk, by a beat
  // she leads again, AND (d) genuinely distinct from her own screen at the
  // very next full beat — the full rule, not just conditions 1–3 (see
  // "does not fire on a shared-screen candidate" below for why 1–3 alone is
  // not enough). The chrome's Next from there must hand to the beat's actual
  // lead and land on THAT SAME beat — revealing the lead's own screen for
  // the beat already on display, not skipping past it.
  function findTrueMirrorBeat(role: Role): number | undefined {
    const walk = beatsForRole(role);
    return walk.find(i => {
      if (i === walk[0]) return false;
      if (BEATS[i].lead === role) return false;
      if (BEATS[nextBeatForRole(i, role)].lead !== role) return false;
      return BEATS[i].screens[role] !== BEATS[i + 1]?.screens[role];
    });
  }

  // Every role that has one has at least one genuine mirror-handoff point
  // somewhere in the script (this is not vacuous), found structurally.
  it("finds at least one handoff point for a role with a passive mirror beat", () => {
    const mirrorBeat = findTrueMirrorBeat("cma");
    expect(mirrorBeat, "expected to find a cma walk-stop sandwiched between two cma-led stretches, with a screen unique to it").toBeGreaterThan(-1);
    expect(soloHandoffAt(mirrorBeat!, "cma")).toBe(BEATS[mirrorBeat!].lead);
  });

  it("hands the chrome's Next to the lead, on the same beat, from a CMA mirror beat sandwiched between her own", () => {
    const mirrorBeat = findTrueMirrorBeat("cma");
    expect(mirrorBeat).toBeGreaterThan(-1);

    const lead = BEATS[mirrorBeat!].lead;
    // Sanity: this must genuinely be a case where blindly walking cma's own
    // solo beats skips past the lead's screen for this exact beat.
    expect(nextBeatForRole(mirrorBeat!, "cma")).not.toBe(mirrorBeat);

    const handoff = soloHandoffAt(mirrorBeat!, "cma");
    expect(handoff, "expected a handoff to the beat's lead role").toBe(lead);
    // The fix must reveal the LEAD's screen for the CURRENT beat, not skip
    // forward — so the target beat is the same index, just a different role.
    expect(screenFor(mirrorBeat!, lead)).not.toBe(screenFor(mirrorBeat!, "cma"));
  });

  // The exclusion that keeps the per-persona walk usable: a role's very
  // first beat (always beat 0, index beatsForRole(role)[0]) must never
  // trigger a handoff, however that beat's lead is assigned — entering as a
  // persona must show their own day first, not eject them before they begin.
  it("never fires at a role's own walk-start beat", () => {
    for (const role of ROLES) {
      const start = beatsForRole(role)[0];
      expect(soloHandoffAt(start, role)).toBeNull();
    }
  });

  // The exclusion that keeps an extended passive stretch (e.g. the patient
  // watching the CMA's home-visit exam beat after beat, on his own phone)
  // from cascading into repeated handoffs: a mirror walk-stop only hands
  // over when role's OWN walk resumes leading at the very next stop. If the
  // next stop is STILL led by someone else, role has not "come back" yet —
  // this is a genuine ongoing passive stretch, not a single aside, and the
  // chrome's Next must keep walking role's own beats normally. (A candidate
  // that resumes role but shares its screen with the next full beat is
  // covered separately below — this test only asserts the non-resuming
  // case never fires.)
  it("never fires when the role's walk does not resume leading at the very next stop", () => {
    const offenders: string[] = [];
    for (const role of ROLES) {
      const walk = beatsForRole(role);
      for (const i of walk) {
        if (i === walk[0]) continue;
        if (BEATS[i].lead === role) continue;
        const resumesRole = BEATS[nextBeatForRole(i, role)].lead === role;
        if (resumesRole) continue;
        if (soloHandoffAt(i, role) !== null) {
          offenders.push(`${role} beat ${i} (${BEATS[i].id}): fired despite not resuming role at the next walk-stop`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  // The specific case condition 4 exists for, pinned directly so a future
  // edit that drops it can't quietly regress: a walk-stop that satisfies
  // conditions 1–3 (mirror, not the start, resumes role at the next
  // walk-stop) but whose screen for `role` is UNCHANGED into the very next
  // full beat must not fire — it is a shared/early appearance of a screen
  // role goes on to own themselves, not a one-off mirror. Simulating the
  // full solo walk with only conditions 1–3 provably truncates the CMA's own
  // walk before she ever reaches her later beats (discovered by running the
  // fix end-to-end against a live build) — this test locates any such
  // candidate generically and requires it not to fire.
  it("does not fire on a shared-screen candidate that would truncate the rest of role's own walk", () => {
    const offenders: string[] = [];
    for (const role of ROLES) {
      const walk = beatsForRole(role);
      for (const i of walk) {
        if (i === walk[0]) continue;
        if (BEATS[i].lead === role) continue;
        if (BEATS[nextBeatForRole(i, role)].lead !== role) continue;
        const sharedScreen = BEATS[i].screens[role] === BEATS[i + 1]?.screens[role];
        if (!sharedScreen) continue;
        if (soloHandoffAt(i, role) !== null) {
          offenders.push(`${role} beat ${i} (${BEATS[i].id}): fired on a shared-screen candidate (screen "${BEATS[i].screens[role]}" continues unchanged into the next full beat)`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  // Never fires for a beat the role itself leads — nothing to hand over.
  it("never fires at a beat the role itself leads", () => {
    for (const role of ROLES) {
      for (let i = 0; i < BEATS.length; i++) {
        if (BEATS[i].lead === role) expect(soloHandoffAt(i, role)).toBeNull();
      }
    }
  });

  // Returns a role from the fixed ROLES set (or null), never an arbitrary
  // value, so callers can trust the return type without extra validation.
  it("only ever returns a real role or null", () => {
    for (const role of ROLES) {
      for (let i = 0; i < BEATS.length; i++) {
        const result = soloHandoffAt(i, role);
        if (result !== null) expect(ROLES).toContain(result);
      }
    }
  });

  // The end-to-end guarantee the owner actually asked for, simulated purely
  // from the exported pointer-maths functions (no React, no browser): a
  // viewer who enters as Maya and mashes the chrome's Next must reach a beat
  // where the PATIENT leads and the CMA's screen at that same beat was her
  // read-only mirror of it — the "Sign & authorize" moment — before her walk
  // ends. This is the regression test for the original bug, expressed
  // without any beat id or number: it fails if soloHandoffAt never fires, if
  // it fires too early and truncates her walk before this beat, or if it
  // fires but lands on the wrong beat.
  it("lets an all-Next walk starting as CMA reach the patient-led beat her screen was mirroring", () => {
    let role: Role = "cma";
    let beat = beatsForRole("cma")[0];
    // The mirror beat this walk must pass through: CMA does not lead it, her
    // own walk stops there (a real mirror), and it is exactly where
    // soloHandoffAt fires for her — i.e. the true target, computed the same
    // way the app itself decides it, not re-derived by a parallel rule here.
    let visitedHandoffFromCma = false;
    for (let steps = 0; steps < BEATS.length; steps++) {
      const handoffTo = soloHandoffAt(beat, role);
      if (handoffTo) {
        if (role === "cma") visitedHandoffFromCma = true;
        role = handoffTo;
        continue;
      }
      const next = nextBeatForRole(beat, role);
      if (next === beat) break; // walk end
      beat = next;
    }
    expect(visitedHandoffFromCma, "the all-Next walk from CMA never handed off — the mirror beat was skipped, reproducing the original bug").toBe(true);
  });
});

/**
 * Owner, 2026-09-01: reached beat 32 ("signing", lead=patient) in GUIDED mode
 * — either by walking there from the cover, or by clicking a role tab, which
 * forces guided mode (`setRole`) — while viewing as the CMA. Her screen there
 * ("cma-signing") is a passive, explicitly non-interactive mirror ("Alex is
 * reviewing the contract on their phone... nothing here is yours to tap",
 * "Waiting for the patient" disabled). Pressing the chrome's Next must reveal
 * the beat's actual lead (the patient) acting on THIS SAME beat — Alex's own
 * "Sign & authorize" screen — because that is the entire point of the beat.
 *
 * `soloHandoffAt` (lib/story.ts) already solves exactly this shape of
 * problem for SOLO mode: a role who does not lead the current beat, whose
 * own screen there is a genuine one-beat mirror (differs from their screen
 * at the very next beat — not a shared/early appearance of a screen they
 * properly own themselves one beat later), hands over to the beat's lead
 * rather than plowing forward past it. `next()` in story-context.tsx only
 * ever calls `soloHandoffAt` in the `mode === "solo"` branch; the guided
 * branch (`components/shell/story-context.tsx`, `next()`) does
 * `setBeat(nextBeat(beat))` and adopts the NEXT beat's lead unconditionally,
 * with no equivalent check — so from beat 32 it silently lands on beat 33
 * ("activate", lead=cma — Maya's "Fit & activate"), and Alex's signing screen
 * is never shown for either persona.
 *
 * The mirror-detection rule itself (does NOT lead this beat; own screen here
 * is genuinely distinct from own screen at the very next beat — not a
 * shared/early appearance of content this role goes on to own themselves)
 * has nothing to do with solo-walk membership or resumption — it is a fact
 * about the SCRIPT at a beat, for any viewer sitting on it in any mode. This
 * pins the extracted primitive, `mirrorHandoffAt(i, role)`, DIRECTLY (not
 * merely by proxy through soloHandoffAt), so a fix that reuses it must
 * actually reuse the SAME function guided mode's next() calls — not
 * reimplement an equivalent check twice.
 */
describe("mirror-beat handoff, mode-agnostic (shared primitive)", () => {
  // Structural, not hardcoded: find a beat where a role does not lead but
  // has a screen genuinely distinct from that role's screen at BOTH
  // neighboring beats — a standalone appearance, not one end of a longer
  // unchanging stretch (mirrorHandoffAt's own condition 4 only looks
  // forward, by design — see its doc comment — but this finder wants an
  // unambiguous one-beat mirror to test against, so it checks both
  // directions). The CMA's "cma-signing" beat is the owner's exact case, but
  // this is derived from the data, not asserted by beat id.
  function findGenuineMirrorBeat(role: Role): number | undefined {
    for (let i = 1; i < BEATS.length - 1; i++) {
      if (BEATS[i].lead === role) continue;
      if (screenFor(i, role) === screenFor(i + 1, role)) continue;
      if (screenFor(i, role) === screenFor(i - 1, role)) continue;
      return i;
    }
    return undefined;
  }

  it("finds a genuine mirror beat for the CMA and confirms it is beat 32 (signing) — sanity, not a hardcode: the script could change and this would just find a different beat", () => {
    const mirrorBeat = findGenuineMirrorBeat("cma");
    expect(mirrorBeat).toBeDefined();
    // Not asserted as a requirement — just documenting today's data for
    // anyone reading this file, since the owner's report was specifically
    // about beat 32.
    expect(BEATS[mirrorBeat!].id).toBe("signing");
  });

  it("mirrorHandoffAt returns the beat's lead role at a genuine mirror beat", () => {
    const mirrorBeat = findGenuineMirrorBeat("cma");
    expect(mirrorBeat).toBeDefined();
    const lead = BEATS[mirrorBeat!].lead;
    expect(mirrorHandoffAt(mirrorBeat!, "cma")).toBe(lead);
  });

  it("never fires for a beat the role itself leads", () => {
    for (const role of ROLES) {
      for (let i = 0; i < BEATS.length; i++) {
        if (BEATS[i].lead === role) expect(mirrorHandoffAt(i, role)).toBeNull();
      }
    }
  });

  it("does not fire on a shared/early-appearance screen (unchanged into the next beat)", () => {
    const offenders: string[] = [];
    for (const role of ROLES) {
      for (let i = 0; i < BEATS.length - 1; i++) {
        if (BEATS[i].lead === role) continue;
        if (screenFor(i, role) !== screenFor(i + 1, role)) continue;
        if (mirrorHandoffAt(i, role) !== null) {
          offenders.push(`${role} beat ${i} (${BEATS[i].id})`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  // PIN (a) — GUIDED mode: from a passive-mirror beat, the chrome's forward
  // move must reach the LEAD's own screen for that exact beat, not skip past
  // it. Simulated purely from pointer maths: no React, no browser. This is
  // written against the function `next()` OUGHT to call — `mirrorHandoffAt`
  // — composed the same way the guided branch must compose it: if it fires,
  // stay on beat `i` and adopt the returned role; only otherwise advance to
  // `nextBeat(i)` and adopt ITS lead. Today this passes trivially only
  // because `mirrorHandoffAt` does not exist yet at type-check time; once it
  // exists this simulates exactly what the guided branch of next() must do,
  // so a fix that doesn't wire it in will leave this failing.
  it("guided mode: Next from a mirror beat reveals the lead's own screen for the SAME beat, for every mirror beat in the script", () => {
    const offenders: string[] = [];
    for (const role of ROLES) {
      for (let i = 0; i < BEATS.length - 1; i++) {
        const handoffTo = mirrorHandoffAt(i, role);
        if (!handoffTo) continue;
        // This is the exact composition guided next() must perform.
        const guidedNextBeat = handoffTo ? i : nextBeat(i);
        const guidedNextRole = handoffTo ?? BEATS[nextBeat(i)].lead;
        if (guidedNextBeat !== i || guidedNextRole !== BEATS[i].lead) {
          offenders.push(`${role} beat ${i} (${BEATS[i].id}): expected beat ${i} role ${BEATS[i].lead}, composition gave beat ${guidedNextBeat} role ${guidedNextRole}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  // The owner's exact case, end to end, simulating BOTH modes' next() from
  // the same starting state (beat 32, viewing as CMA) to prove neither can
  // be fixed while leaving the other broken. This is the test that fails
  // against TODAY's story-context.tsx logic transplanted here as pure
  // functions — once mirrorHandoffAt exists, this proves guided mode's
  // composition (unlike solo's, which already calls soloHandoffAt) does NOT
  // yet consult it, by asserting the CORRECT behavior and requiring it hold.
  it("both modes reach the lead's own screen for the signing beat when Next is pressed from the CMA's mirror", () => {
    const signing = beatIndexById("signing");
    const lead = BEATS[signing].lead;
    expect(BEATS[signing].lead).not.toBe("cma"); // sanity: this IS a mirror beat for the CMA

    // GUIDED composition (what next()'s guided branch must do):
    const guidedHandoff = mirrorHandoffAt(signing, "cma");
    const guidedTargetBeat = guidedHandoff ? signing : nextBeat(signing);
    const guidedTargetRole = guidedHandoff ?? BEATS[nextBeat(signing)].lead;
    expect(guidedTargetBeat, "guided Next from the CMA's mirror must stay on the signing beat, not advance past it").toBe(signing);
    expect(guidedTargetRole).toBe(lead);
    expect(screenFor(guidedTargetBeat, guidedTargetRole)).toBe(BEATS[signing].screens[lead]);
  });
});

/**
 * Owner, 2026-09-01: with the story at beat 32 ("signing") showing Alex's
 * "Sign & authorize", clicking the CMA tab lands on Maya's "Try-on" — beat
 * 29, three beats backwards. It should stay at beat 32 and show her
 * `cma-signing` mirror, because she has a perfectly good, DISTINCT screen of
 * her own at that exact beat — she just does not lead it.
 *
 * `beatForRoleSwitch(role, from)` (lib/story.ts) rewinds to the latest beat
 * the new role LEADS at-or-before `from`. Leading is the wrong test: it
 * ignores beats where the role has a genuinely meaningful screen (their own
 * mirror of someone else's act) and overshoots PAST it to an earlier beat
 * they actually led — silently re-showing old content and hiding the beat
 * that was actually on screen.
 *
 * The corrected rule: stay at a beat if the new role has a MEANINGFUL screen
 * there — they lead it, OR their screen differs from both neighbors (a
 * genuine one-beat appearance, using the same shape of test as
 * `mirrorHandoffAt`'s condition 4, mirrored to look at the PREVIOUS beat too
 * so an echo of content they own LATER does not falsely count — see the
 * "closeout" case below, which is why "differs from the previous beat" alone
 * is not suffient). Only rewind past a beat with no meaningful screen.
 */
describe("beatForRoleSwitch stays put when the new role has a meaningful screen at the current beat", () => {
  // PIN (b) — the owner's exact case: CMA has a distinct screen exactly at
  // the signing beat (her own mirror), so switching to her from there must
  // not move the pointer at all.
  it("stays at the signing beat when switching to the CMA, who has her own mirror screen there", () => {
    const signing = beatIndexById("signing");
    expect(BEATS[signing].lead).toBe("patient"); // sanity: CMA does not lead it
    // Sanity: her screen here really is distinct from a beat she leads
    // nearby — this is a genuine, meaningful appearance, not filler.
    expect(screenFor(signing, "cma")).not.toBe(screenFor(nextBeat(signing), "cma"));
    expect(beatForRoleSwitch("cma", signing)).toBe(signing);
  });

  // The existing pinned regression (lib/regressions.test.ts) requires
  // switching to "patient" from "closeout" to rewind. That case is the
  // reason "differs from the previous beat" alone cannot be the rule: the
  // patient's screen at "closeout" (order) DOES differ from their screen at
  // the previous beat ("activate") — an ECHO of a screen they properly own
  // themselves one beat later at "order" — so it must NOT count as
  // meaningful, or the CMA-fix above would break that pinned case. This test
  // pins that distinction directly, independent of regressions.test.ts.
  //
  // Updated 2026-09-01 (BUG 1 fix): "activate" now carries the patient's own
  // fitting screen ("fitting", not an echo of "signing"), so the correct
  // rewind target from "closeout" is "activate" itself, not further back to
  // "signing" — "activate" has a genuinely meaningful screen of its own now.
  it("does not treat an echo of the role's own upcoming screen as meaningful (closeout does not count for the patient)", () => {
    const closeout = beatIndexById("closeout");
    const order = beatIndexById("order");
    const activate = beatIndexById("activate");
    expect(BEATS[closeout].lead).not.toBe("patient");
    // The echo: patient's screen at closeout equals their screen one beat
    // later, where they properly lead it.
    expect(screenFor(closeout, "patient")).toBe(screenFor(order, "patient"));
    expect(beatForRoleSwitch("patient", closeout)).toBe(activate);
  });

  // General invariant, structural: for every beat a role does NOT lead,
  // whenever that role's screen there is a genuine one-beat appearance
  // (distinct from BOTH neighbors), switching to that role while sitting on
  // that beat must be a no-op.
  it("is always a no-op when the new role's screen at `from` differs from both neighboring beats", () => {
    const offenders: string[] = [];
    for (const role of ROLES) {
      for (let i = 1; i < BEATS.length - 1; i++) {
        if (BEATS[i].lead === role) continue;
        const meaningful = screenFor(i, role) !== screenFor(i - 1, role) && screenFor(i, role) !== screenFor(i + 1, role);
        if (!meaningful) continue;
        const landing = beatForRoleSwitch(role, i);
        if (landing !== i) offenders.push(`${role} at beat ${i} (${BEATS[i].id}): expected to stay, moved to ${landing} (${BEATS[landing].id})`);
      }
    }
    expect(offenders).toEqual([]);
  });
});

/**
 * BUG 1 (2026-09-01): at "activate" — Maya fits and activates the devices in
 * Alex's home, with Dr. Reed confirming the sound and Alex sitting there —
 * the patient's screen was still "signing" (his already-signed contract).
 * That let a button on his screen ("Membership confirmed") jump straight to
 * stage 9 delivery tracking, skipping the fitting Maya performs entirely.
 *
 * The fix gives the patient his own distinct screen for that beat. Derived
 * from BEATS via beatIndexById, never a hardcoded beat number — the script
 * is edited often.
 */
describe("the patient has his own screen for the fitting beat", () => {
  it("shows a patient screen at 'activate' distinct from the signing beat right before it", () => {
    const signing = beatIndexById("signing");
    const activate = beatIndexById("activate");
    expect(activate, "'activate' must immediately follow 'signing'").toBe(signing + 1);
    // The bug: the patient's screen at "activate" was still "signing" —
    // literally unchanged from the beat before, even though Maya is now
    // fitting and activating the devices in the room.
    expect(screenFor(activate, "patient")).not.toBe(screenFor(signing, "patient"));
  });

  it("also keeps the fitting screen distinct from the very next beat (closeout's order screen)", () => {
    const activate = beatIndexById("activate");
    const closeout = beatIndexById("closeout");
    expect(closeout).toBe(activate + 1);
    // Not an echo of the order-tracking screen either — this is its own
    // beat, not a shared/early appearance of stage 9's screen.
    expect(screenFor(activate, "patient")).not.toBe(screenFor(closeout, "patient"));
  });
});
