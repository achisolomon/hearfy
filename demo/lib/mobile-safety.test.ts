import { describe, expect, it } from "vitest";
import { componentFiles, sourceOf } from "./screens";
import {
  fixedBarsWithRigidHeight,
  isUnboundedRootFontSize,
  rootFontRules,
  shortBottomPadding,
  textOverlaysInMediaFrame,
} from "./mobile-safety";

/**
 * The phone guard (owner, 2026-09-01).
 *
 * The demo is shown from a laptop, so every review happens at desktop width
 * and the phone is the surface that silently rots. These tests are the
 * mechanism the owner asked for — "if we make changes and look good on the
 * desktop, they still need to look good on the phone in an automatic manner"
 * — and they run inside `npm test`, which `npm run prebuild` runs before
 * every build. Nobody has to remember to check a phone.
 *
 * Each asserts the INVARIANT, not the instance, so a new screen or a new
 * fixed bar is covered without anyone adding a case for it.
 */

describe("root font size cannot run away on a phone", () => {
  // The root cause of the 2026-09-01 report. `html{font-size:112.5%}` is a
  // multiplier of the browser default, which a phone's accessibility setting
  // has already enlarged — 28 of 37 screens broke at a 24px default.
  it("declares no unbounded relative root font size", () => {
    const css = sourceOf("app", "globals.css");
    const bad = rootFontRules(css).filter(r => r.unbounded);
    expect(bad.map(b => b.value)).toEqual([]);
  });

  it("still sets a root font size at all, so the low-vision baseline holds", () => {
    const rules = rootFontRules(sourceOf("app", "globals.css"));
    expect(rules.length).toBeGreaterThan(0);
  });

  // The control that scales text for the patient must not reintroduce the
  // same unbounded percentage by the back door.
  it("keeps the text-size control's own values bounded", () => {
    const src = sourceOf("components", "a11y", "text-size.tsx");
    const tpl = /rootFontSize\s*=\s*\([^)]*\)\s*=>\s*\n?\s*`([^`]+)`/.exec(src);
    expect(tpl, "rootFontSize template not found").toBeTruthy();
    // Substitute the interpolations with a number to get a checkable value.
    const value = tpl![1].replace(/\$\{[^}]+\}/g, "18");
    expect(isUnboundedRootFontSize(value)).toBe(false);
  });

  it("classifies bounded and unbounded values correctly", () => {
    expect(isUnboundedRootFontSize("112.5%")).toBe(true);
    expect(isUnboundedRootFontSize("1.125rem")).toBe(true);
    expect(isUnboundedRootFontSize("1.2em")).toBe(true);
    expect(isUnboundedRootFontSize("18px")).toBe(false);
    expect(isUnboundedRootFontSize("clamp(18px, 1.125rem, 22px)")).toBe(false);
    // A clamp with no absolute ceiling is still unbounded.
    expect(isUnboundedRootFontSize("clamp(18px, 1.125rem, 200%)")).toBe(true);
  });
});

describe("phone chrome grows with its text", () => {
  // The docked bar was `h-14`, so the persona name clipped to "Al…"/"Pat…".
  it("gives every full-width fixed bar a growable height", () => {
    const offenders: string[] = [];
    for (const f of componentFiles()) {
      for (const cls of fixedBarsWithRigidHeight(sourceOf(f))) {
        offenders.push(`${f}: ${cls.slice(0, 60)}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  // A guard that cannot fail protects nothing: prove it still catches the
  // exact class string that shipped the bug, and accepts the fix.
  it("catches the shipped h-14 bar and accepts min-h-14", () => {
    const broken = `<div className="fixed inset-x-0 bottom-0 z-40 flex h-14 items-center">`;
    const fixed = `<div className="fixed inset-x-0 bottom-0 z-40 flex min-h-14 items-center py-2">`;
    expect(fixedBarsWithRigidHeight(broken)).toHaveLength(1);
    expect(fixedBarsWithRigidHeight(fixed)).toEqual([]);
  });
});

describe("content clears the docked control bar", () => {
  // At a large system font the bar sat on top of the last control and
  // intercepted the tap, so Next could not be pressed at all.
  it("leaves enough bottom padding on every full-height screen", () => {
    const offenders: string[] = [];
    for (const f of componentFiles()) {
      for (const pb of shortBottomPadding(sourceOf(f))) {
        offenders.push(`${f}: ${pb}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("catches the shipped pb-20 and accepts pb-32", () => {
    const broken = `<div className="min-h-[100dvh] bg-brand-bg p-6 pb-20 text-brand-navy md:pb-6">`;
    const fixed = `<div className="min-h-[100dvh] bg-brand-bg p-6 pb-32 text-brand-navy md:pb-6">`;
    expect(shortBottomPadding(broken)).toEqual(["pb-20"]);
    expect(shortBottomPadding(fixed)).toEqual([]);
  });

  // A centred cover panel holds one block mid-viewport and has nothing to
  // scroll under the bar, so it must not be reported.
  it("does not demand bottom padding from a centred full-screen panel", () => {
    const cover = `<div className="grid min-h-[100dvh] place-items-center bg-brand-bg px-6">`;
    expect(shortBottomPadding(cover)).toEqual([]);
  });
});

describe("the live call stays visible behind its own captions", () => {
  // The caption was an absolute overlay in the 4:3 frame; a long note at a
  // phone's rem base covered the clinician's face entirely.
  it("puts no variable-length text overlay inside the video frame", () => {
    const src = sourceOf("components", "screens", "cma", "call-tile.tsx");
    expect(textOverlaysInMediaFrame(src)).toEqual([]);
  });
});
