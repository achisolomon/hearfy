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
