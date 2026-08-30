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
    const beats = beatsForRole("operator");
    // The operator's dashboard is ambient at every beat, so a solo operator
    // walk is a single stop — never 31 presses of Next on the same screen.
    expect(beats.length).toBe(1);
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
});

describe("solo walk boundaries", () => {
  it("a role whose screen never changes has a one-beat walk", () => {
    // The operator's dashboard is ambient at every beat. Pressing Next must
    // not advance — and the shell must not read that as the demo ending.
    const beats = beatsForRole("operator");
    expect(beats).toEqual([0]);
    expect(nextBeatForRole(0, "operator")).toBe(0);
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
