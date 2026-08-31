import { describe, expect, it } from "vitest";
import {
  NO_RED_FLAG,
  dismissDiversion,
  selectRedFlag,
  showsDiversion,
} from "./red-flag";

describe("red flag diversion", () => {
  it("shows nothing before any symptom is selected", () => {
    expect(showsDiversion(NO_RED_FLAG)).toBe(false);
  });

  it("diverts as soon as a red-flag symptom is selected", () => {
    expect(showsDiversion(selectRedFlag(NO_RED_FLAG))).toBe(true);
  });

  it("returns to the questions when the viewer backs out", () => {
    const s = dismissDiversion(selectRedFlag(NO_RED_FLAG));
    expect(showsDiversion(s)).toBe(false);
  });

  // The reported bug: after backing out once, every later symptom click was
  // dead — the dismissal outlived the answer it was dismissing.
  it("diverts again when a symptom is selected after backing out", () => {
    const backedOut = dismissDiversion(selectRedFlag(NO_RED_FLAG));
    expect(showsDiversion(selectRedFlag(backedOut))).toBe(true);
  });

  it("survives any number of select/back-out rounds", () => {
    let s = NO_RED_FLAG;
    for (let i = 0; i < 5; i++) {
      s = selectRedFlag(s);
      expect(showsDiversion(s)).toBe(true);
      s = dismissDiversion(s);
      expect(showsDiversion(s)).toBe(false);
    }
  });

  // The latch is what carries `everFlagged` across the shell's remounts; a
  // remount must not resurrect a diversion the viewer already stepped out of.
  it("keeps the flag remembered but stays dismissed across a remount", () => {
    const s = dismissDiversion(selectRedFlag(NO_RED_FLAG));
    expect(s.everFlagged).toBe(true);
    expect(showsDiversion(s)).toBe(false);
  });
});
