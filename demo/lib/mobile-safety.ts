/**
 * Static guards for "it looks fine on the desktop, so it shipped broken on a
 * phone" (owner, 2026-09-01, after walking the deployed demo on a real
 * device: "the changes we've made are looking very good on the computer, but
 * on the phone they don't look very good").
 *
 * The demo is presented on a laptop, so the phone is the surface nobody
 * routinely looks at — which is exactly why it needs a check that runs
 * without anyone choosing to run it. These are deliberately STATIC: they read
 * component source and CSS the way `lib/screens.ts` already does, so they
 * cost nothing, need no browser, and cannot be skipped in the way a manual
 * device check silently is. `npm run prebuild` runs the suite before every
 * build, so a regression here cannot reach a deploy.
 *
 * The browser-driven counterpart — walking all 37 screens at 390px and
 * measuring real geometry — lives in `scripts/mobile-sweep.mjs`, which found
 * the bugs these guards now hold. Use it when changing layout; this file is
 * what protects the result afterwards.
 */

/** A `rem`-based root font-size declaration found in CSS. */
export interface RootFontRule {
  /** The raw declaration value, e.g. `clamp(18px, 1.125rem, 22px)`. */
  value: string;
  /** True when the value is a bare percentage or em/rem with no upper bound. */
  unbounded: boolean;
}

/**
 * Find `html { font-size: ... }` rules and say whether each is bounded.
 *
 * The bug this exists for: `html { font-size: 112.5% }` is a percentage of
 * the BROWSER's default font size. That default is 16px on a desktop, so the
 * rule landed on the intended 18px and looked correct in every review. On a
 * phone it is not 16px — Android Chrome and iOS Safari scale it by the OS
 * "font size" accessibility setting — so the percentage multiplied a value
 * that was already enlarged. A phone set to a large font reached a 27px rem
 * base, inflating every rem-sized string in the app by ~50% and breaking 28
 * of 37 screens.
 *
 * A relative root font-size is not itself wrong — honouring the reader's
 * setting is the accessible behaviour, and this product's audience is
 * explicitly low-vision. What is wrong is an UNBOUNDED one. `clamp()` keeps
 * the user's preference visible while capping where the layout still holds.
 */
export function rootFontRules(css: string): RootFontRule[] {
  const rules: RootFontRule[] = [];
  // `html { ... }` blocks, including ones with other selectors alongside.
  for (const m of css.matchAll(/(^|[},;\s])html\s*(?:,[^{]*)?\{([^}]*)\}/g)) {
    const body = m[2];
    const decl = /font-size\s*:\s*([^;}]+)/.exec(body);
    if (!decl) continue;
    const value = decl[1].trim();
    rules.push({ value, unbounded: isUnboundedRootFontSize(value) });
  }
  return rules;
}

/**
 * True when a root font-size value can be scaled without limit by the
 * reader's own browser setting.
 *
 * Bounded: an absolute length (`18px`), or a `clamp()`/`min()` that caps the
 * result with one. Unbounded: a bare percentage, `em`, or `rem`, each of
 * which is a pure multiplier of whatever the browser default happens to be.
 */
export function isUnboundedRootFontSize(value: string): boolean {
  const v = value.trim().toLowerCase();
  // A clamp()/min() whose ceiling is an absolute length is bounded.
  if (/^(clamp|min)\s*\(/.test(v)) {
    const args = splitTopLevelArgs(v.slice(v.indexOf("(") + 1, v.lastIndexOf(")")));
    const ceiling = /^clamp/.test(v) ? args[2] : args.find(a => /px|pt$/.test(a.trim()));
    return !(ceiling && /^-?[\d.]+(px|pt)$/.test(ceiling.trim()));
  }
  if (/^-?[\d.]+(px|pt)$/.test(v)) return false;
  return /%|r?em$/.test(v);
}

/** Split `a, b, c` on top-level commas only (so nested calls survive). */
function splitTopLevelArgs(s: string): string[] {
  const out: string[] = [];
  let depth = 0, cur = "";
  for (const ch of s) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) { out.push(cur); cur = ""; continue; }
    cur += ch;
  }
  if (cur.trim()) out.push(cur);
  return out;
}

/**
 * Class strings on a fixed-position bar that pin it to an exact height.
 *
 * The bug: the phone docked bar was `h-14`. A fixed height cannot grow with
 * its contents, so as the rem base rose the persona name and role inside it
 * were clipped to "Al…" / "Pat…" — the owner photographed exactly this. A bar
 * whose contents are text must use `min-h-*`, which keeps the same resting
 * height while allowing the few extra pixels rather than cutting words.
 */
export function fixedBarsWithRigidHeight(source: string): string[] {
  const out: string[] = [];
  for (const m of source.matchAll(/className="([^"]*\bfixed\b[^"]*)"/g)) {
    const cls = m[1];
    // Only bars that are pinned across the viewport and carry text.
    if (!/\binset-x-0\b/.test(cls)) continue;
    // `min-h-14` is the fix, not the fault, so the height match must not be
    // satisfied by the `h-14` sitting inside it — hence the explicit
    // start-of-token guard rather than a bare `\b`.
    if (!/(?:^|\s)h-\d+(?:\s|$)/.test(cls)) continue;
    out.push(cls);
  }
  return out;
}

/**
 * Screens whose scroll container has too little bottom padding to clear the
 * phone's docked control bar.
 *
 * The bug: the non-patient screens ended in `pb-20`. The docked bar is 3.5rem
 * plus its own padding, and both grow with the rem base, so at a large system
 * font the bar sat ON TOP of the last control — the browser reported the bar
 * itself intercepting the click, meaning the viewer physically could not tap
 * Next. `pb-32` clears it at every text size this app offers.
 *
 * Returns the offending padding utilities, e.g. `["pb-20"]`.
 */
export function shortBottomPadding(source: string, minRem = 8): string[] {
  const out: string[] = [];
  for (const m of source.matchAll(/className="([^"]*\bmin-h-\[100dvh\][^"]*)"/g)) {
    const cls = m[1];
    // A centred full-screen panel (the cover, an interstitial, a stub) has
    // no scrolling content to run under the bar — it holds one block in the
    // middle of the viewport. Only screens that stack content top-down can
    // push their last control beneath the docked bar.
    if (/\bplace-items-center\b|\bitems-center\b/.test(cls)) continue;
    // The `md:` variant is the desktop one, where no docked bar exists.
    const pb = /(?:^|\s)pb-(\d+)/.exec(cls);
    if (!pb) { out.push("(no pb-*)"); continue; }
    // Tailwind spacing: 1 unit = 0.25rem.
    if (Number(pb[1]) * 0.25 < minRem) out.push(`pb-${pb[1]}`);
  }
  return out;
}

/**
 * Absolutely-positioned overlays inside a fixed-aspect media frame that hold
 * free-form text.
 *
 * The bug: the call tile's caption was an `absolute` block anchored to the
 * bottom of a 4:3 video frame. Its height is driven by the note's length and
 * the rem base, neither of which the frame knows about, so on a phone a
 * two-line desktop caption became a six-line block that covered Dr. Reed's
 * face — the one thing a live call exists to show. The owner asked for the
 * obvious fix: "put the text below the video."
 *
 * A short, fixed-height overlay (a nameplate that truncates, a LIVE pill) is
 * fine and stays. What this flags is an overlay bound to variable content.
 */
export function textOverlaysInMediaFrame(source: string): string[] {
  const out: string[] = [];
  // Find aspect-ratio framed blocks and look at what is absolutely placed in
  // them with a text-bearing interpolation.
  for (const m of source.matchAll(/aspect-\[[\d/]+\]/g)) {
    const after = source.slice(m.index ?? 0);
    const frame = after.slice(0, after.indexOf("\n      </div>") + 1 || 4000);
    for (const o of frame.matchAll(/className="([^"]*\babsolute\b[^"]*)"[^>]*>\s*\{(\w+)\}/g)) {
      out.push(`${o[1].slice(0, 40)} -> {${o[2]}}`);
    }
  }
  return out;
}

/**
 * `flex-nowrap` rows that cannot scroll when their content outgrows the
 * viewport.
 *
 * The bug: the one-pager's hero chips (Private / On demand / Clinical-guided)
 * wrapped onto two lines on a 360px phone, so the row was pinned to one line
 * with `flex-nowrap`. That fixes the wrap and introduces a worse failure — a
 * row that may not wrap has only one way to handle content it cannot fit,
 * which is to push the page wider than the screen. A phone's large-text
 * accessibility setting raises the MINIMUM font size, overriding even a fixed
 * `text-[12px]`, so the row grew past a 320px viewport and the whole document
 * scrolled sideways.
 *
 * The fix is two parts, and BOTH are required — this guard exists because the
 * first alone looked correct and still overflowed:
 *
 *  1. `overflow-x-auto` on the row, so it scrolls internally; and
 *  2. `min-w-0` on the ancestor that is a grid/flex ITEM, because such an item
 *     defaults to `min-width: auto` and refuses to shrink below its content —
 *     which means the row is never narrower than its contents and its own
 *     `overflow-x-auto` never engages.
 *
 * Returns the offending `flex-nowrap` class strings. A row that also carries
 * a wrap at a breakpoint (`sm:flex-wrap`) still needs the scroller, because
 * the un-wrapped range is exactly the narrow one.
 */
export function unscrollableNoWrapRows(source: string): string[] {
  const out: string[] = [];
  for (const m of source.matchAll(/className="([^"]*\bflex-nowrap\b[^"]*)"/g)) {
    const cls = m[1];
    // A row that can scroll, or one whose children may shrink and wrap, is fine.
    if (/\boverflow-x-(auto|scroll)\b/.test(cls)) continue;
    out.push(cls);
  }
  return out;
}
