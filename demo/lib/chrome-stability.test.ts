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
 * The rule they encode, written up in full in HELD-FRAME-RULE.md at the repo
 * root (DESIGN.md carries the same rule for design work): furniture that stays on screen must
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

  /**
   * The root must reserve the scrollbar gutter.
   *
   * The story mixes beats that overflow the viewport with beats that do not
   * (the hero scrolls; "Welcome to Hearfy" does not). Without a reservation a
   * classic scrollbar appears on some beats and not others, and since every
   * beat centres its column, the layout's origin moves with it — the logo,
   * the persona pills and the Next button all slide ~7.5px sideways. Measured
   * 2026-09-02 in a headed Chrome at 1440px: logo x alternated 91.5 / 99
   * across the patient walk, and held at 91.5 with the reservation in place.
   *
   * This is asserted in the stylesheet rather than measured in the sweep
   * because headless Chrome draws zero-width overlay scrollbars: the sweep
   * ran green through the whole bug. A source assertion has no such blind spot.
   */
  it("reserves the scrollbar gutter so a scrolling beat cannot shift the layout", () => {
    const css = sourceOf("app/globals.css");
    // Keyed on the declaration, not on a selector spelling or comment text:
    // the invariant is that the root reserves the gutter, however it is written.
    const rule = /(?:^|[{;\s])scrollbar-gutter\s*:\s*stable/m;
    expect(
      rule.test(css),
      "app/globals.css must set `scrollbar-gutter: stable` on the root — "
      + "without it the top bar slides sideways whenever a beat starts or "
      + "stops overflowing the viewport",
    ).toBe(true);
  });

  // The sweep is only a gate if it is actually runnable as one.
  it("exposes the browser sweep as an npm script", () => {
    const pkg = JSON.parse(sourceOf("package.json"));
    expect(pkg.scripts["stability-sweep"], "the sweep must be a named script")
      .toBeTruthy();
  });
});

// Owner, 2026-10-05: "we get flickers in the demo, like the screen is
// flickering — this did not happen until now."
//
// Every screen change faded the new screen in with a framer-motion element
// keyed by the screen id (initial opacity 0 → 1 over 200ms). framer hands
// opacity to a browser (WAAPI) animation; when that animation finishes it is
// cancelled and the final value is committed on framer's NEXT frame-loop
// tick. With nothing else animating, the loop is idle, so for one frame the
// element falls back to its initial inline opacity: 0 — a full-screen blink
// right after each fade-in. Measured headed: 1.00 at 210ms, 0.00 at 227ms,
// 1.00 at 244ms.
//
// It had always happened on the first eleven beats. The route map's endless
// courier animation kept framer's loop ticking from "on the way" onward,
// which hid the blink there; removing the map (CMA-tracking change) exposed
// it across the rest of the walk, which is why it looked new.
//
// A CSS keyframe animation with `fill-mode: both` holds its end state with no
// hand-off, so the remounting screen wrapper must use that, not framer.
describe("screen transitions cannot blink", () => {
  // Every framer element in the demo that animates opacity must be
  // JS-driven (`{...jsDriven}`), or be a CSS animation instead. The handoff
  // overlay blinked twice per handoff (to 0 after fading in, back to 1 just
  // before unmounting) and the cover blinked once on load, by the same
  // mechanism. The one-pager is a separate page with its own reveals.
  it("no demo framer element animates opacity through WAAPI", () => {
    const offenders: string[] = [];
    for (const f of componentFiles().filter(f => !f.startsWith("components/one-pager/"))) {
      for (const m of sourceOf(f).matchAll(/<motion\.[a-z]+\b[^>]*>/g)) {
        const fadesOpacity = /(initial|animate|exit)=\{\{[^}]*\bopacity\b/.test(m[0]);
        // An endless loop never ends, so it never reaches the hand-off.
        const endless = /repeat:\s*Infinity/.test(m[0]);
        if (fadesOpacity && !endless && !/\{\.\.\.jsDriven\}/.test(m[0])) offenders.push(`${f}: ${m[0].replace(/\s+/g, " ").slice(0, 90)}`);
      }
    }
    expect(offenders, "a WAAPI opacity fade blinks for one frame when it ends").toEqual([]);
  });

  it("jsDriven really opts out of WAAPI (framer skips it when onUpdate is set)", () => {
    expect(sourceOf("components/motion-safe.ts")).toMatch(/jsDriven\s*=\s*\{\s*onUpdate:/);
  });

  it("the cover fades in with CSS", () => {
    const cover = sourceOf("components/shell/cover.tsx");
    expect(cover).not.toMatch(/<motion\./);
    expect(cover.match(/className="fade-in\b/g)?.length).toBe(2);
  });

  // Owner, 2026-10-05 (after the blink fix shipped): "in prod I still see
  // flickers — like a green background that pops when I go next next … on
  // the top left side of the screen." Each screen's Shell paints its opaque
  // bg-brand-bg INSIDE the fading wrapper, so every Next began with the Shell
  // background at opacity 0 and the body showed through — including its teal
  // radial glow anchored at the top left — until the fade covered it again.
  // The container around the fade must paint the same flat colour, so a fade
  // can only ever reveal that colour.
  it("the screen fades over a flat backdrop, not the body's teal glow", () => {
    const app = sourceOf("components/patient-app-2.tsx");
    const around = app.match(/<(\w+)\s+className="([^"]*)"\s*>\s*(?:\{\/\*[\s\S]*?\*\/\}\s*)?<div\s+key=\{current\}\s+className="[^"]*\bscreen-in\b/);
    expect(around, "the screen-in wrapper must sit directly in a container with a className").toBeTruthy();
    expect(around![2].split(/\s+/)).toContain("bg-brand-bg");
    expect(sourceOf("components/screens/shared.tsx"), "the backdrop must match the Shell's own background")
      .toMatch(/export function Shell[^]*?className="[^"]*\bbg-brand-bg\b/);
  });

  it("the patient screen wrapper replays a CSS fade on every screen", () => {
    const app = sourceOf("components/patient-app-2.tsx");
    expect(app).toMatch(/<div\s+key=\{current\}\s+className="[^"]*\bscreen-in\b/);
    const css = sourceOf("app/globals.css");
    expect(css).toMatch(/\.screen-in\s*\{[^}]*animation:\s*screen-in\b[^}]*\bboth\b/);
    expect(css).toMatch(/@keyframes\s+screen-in/);
  });
});
