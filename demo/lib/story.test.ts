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
  beatIndexById,
  firstBeatOfStage,
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
