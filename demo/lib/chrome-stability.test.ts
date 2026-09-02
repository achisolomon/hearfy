import { describe, expect, it } from "vitest";
import { componentFiles, sourceOf } from "./screens";

/**
 * The static half of the chrome-stability guard.
 *
 * `scripts/stability-sweep.mjs` is the real check: it drives a browser through
 * every beat of all four personas and fails when any sticky or fixed element
 * changes position or size. But it needs Chrome and a running dev server, so
 * it cannot run inside `npm test` — and a guard that only runs when someone
 * remembers to run it is how this bug shipped three times.
 *
 * These tests catch the SHAPES that cause the drift, cheaply, on every commit:
 * a label swapped by a ternary inside a persistent control, and a call beat
 * that reserves no header height. They cannot prove the chrome holds still —
 * only the sweep can — but they fail fast on the two patterns that have
 * actually broken it here.
 *
 * The rule they encode, from DESIGN.md: furniture that stays on screen must
 * stay put. When content genuinely varies, RESERVE the tallest or widest case
 * and let the short case leave the remainder empty. Three fixes in this repo
 * use that one pattern — CALL_HEADER_MIN, CALL_NOTE_MIN, and the top bar's
 * stacked Next labels.
 */
describe("persistent chrome reserves space instead of resizing", () => {
  /**
   * A control inside sticky/fixed chrome whose whole content is swapped by a
   * ternary resizes when the two branches differ in length. That is exactly
   * what moved the top bar: `{atWalkEnd ? "End of this persona's day" : ...}`.
   *
   * Text of very different lengths is the signal — a ternary between two short
   * words changes nothing measurable, so the rule only bites when one branch
   * is much longer than the other.
   */
  it("has no long/short text ternary inside a sticky or fixed bar", () => {
    const offenders: string[] = [];
    for (const file of componentFiles()) {
      const src = sourceOf(file);
      if (!/\b(sticky|fixed)\b/.test(src)) continue;
      // `{cond ? "..." : "..."}` — both branches literal strings.
      for (const m of src.matchAll(/\?\s*"([^"]{2,80})"\s*:\s*"([^"]{2,80})"/g)) {
        const [a, b] = [m[1], m[2]];
        // An aria-label or title is text that never renders a box, so its
        // length cannot move anything. Only VISIBLE text has a width — and
        // the same button legitimately carries both, so this must key on the
        // attribute the ternary is assigned to, not on the strings.
        // Walk back to the nearest `=` and see what attribute it belongs to.
        const before = src.slice(Math.max(0, m.index - 120), m.index);
        if (/(aria-[a-z]+|title|alt|placeholder)\s*=\s*\{[^{}]*$/.test(before)) continue;
        // Class-name ternaries are how every conditional style is written here
        // and change no geometry; only prose differing a lot in length does.
        if (/[-:/[\]]/.test(a) || /[-:/[\]]/.test(b)) continue;
        if (Math.abs(a.length - b.length) < 8) continue;
        offenders.push(`${file}: "${a}" / "${b}"`);
      }
    }
    expect(
      offenders,
      "a control in persistent chrome must not swap between labels of very "
      + "different widths — stack both in one grid cell so the wider reserves "
      + "the space (see demo-shell's Next button):\n" + offenders.join("\n"),
    ).toEqual([]);
  });

  // The reservation floors are numbers on purpose: a screen that hard-codes
  // its own height instead of importing them is the drift this exists to stop.
  it("keeps the reserved heights as shared exported constants", () => {
    const vs = sourceOf("components/screens/video-split.tsx");
    for (const name of ["CALL_HEADER_MIN", "CALL_HEADER_MIN_SM", "CALL_NOTE_MIN"]) {
      expect(vs, `${name} must be exported for screens and guards to share`)
        .toMatch(new RegExp(`export const ${name}\\s*=\\s*\\d+`));
    }
  });

  /**
   * Every screen that shows the call panel must reserve a header height.
   *
   * `handoff.tsx` did not: it is a CMA tablet screen, so it used `Shell` and a
   * bare `PageHeader` while its neighbours used `CallShell`, and the panel sat
   * 37px higher there than on the beats either side. The sweep caught it; this
   * keeps it caught without a browser.
   */
  it("reserves a header height on every screen carrying the call panel", () => {
    const offenders: string[] = [];
    for (const file of componentFiles()) {
      const src = sourceOf(file);
      if (!/<CallSplit|<AudiologistCallTile/.test(src)) continue;
      // Either route to a reservation is fine: CallShell does it for you, or
      // the screen applies the shared floor itself.
      if (/CallShell|CALL_HEADER_MIN/.test(src)) continue;
      offenders.push(file);
    }
    expect(
      offenders,
      "a call beat with no reserved header height makes the video jump between "
      + "beats — wrap it in CallShell or reserve CALL_HEADER_MIN:\n" + offenders.join("\n"),
    ).toEqual([]);
  });

  // The caption below the call tile is one, two or three lines depending on
  // the beat, and it lives inside the sticky panel — so without a floor the
  // panel grew and shrank as the story advanced.
  it("floors the call caption so a longer note cannot resize the panel", () => {
    const tile = sourceOf("components/screens/cma/call-tile.tsx");
    expect(tile, "the note must sit on the shared floor")
      .toMatch(/CALL_NOTE_MIN/);
    // minHeight, never height: a longer note or the largest text setting must
    // still be free to grow — it just may not shrink the panel.
    expect(tile, "the floor must be a minimum, not a fixed height")
      .toMatch(/minHeight/);
  });

  // The sweep is only a gate if it is actually runnable as one.
  it("exposes the browser sweep as an npm script", () => {
    const pkg = JSON.parse(sourceOf("package.json"));
    expect(pkg.scripts["stability-sweep"], "the sweep must be a named script")
      .toBeTruthy();
  });
});
