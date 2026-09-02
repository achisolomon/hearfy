/**
 * Persistent chrome must not move as the story advances.
 *
 * The general form of a bug this project has now shipped three times:
 *
 *   1. the call video changed size between screens (CallShell now owns both
 *      axes, and reserves the tallest header's height);
 *   2. the top bar slid sideways when the Next button swapped its label for
 *      "End of this persona's day" (owner, 2026-09-02: "the bar at the top is
 *      moving — it should not");
 *   3. the same class of thing, next time, in an element nobody has thought of.
 *
 * Each was fixed with a test naming that one element, which is why the third
 * still happened. This sweep does not name elements. It walks the whole story
 * and measures EVERY element that persists across screens, keyed by a stable
 * identity, and fails when one changes position or size between beats.
 *
 * That is the invariant DESIGN.md's chrome-consistency rule states in prose:
 * furniture that stays on screen must stay put, so the eye can ignore it. A
 * control that shifts under the cursor is the same defect whether it is the
 * logo, a button, a video, or a card that has not been written yet.
 *
 * Deliberate change is not drift. Two things legitimately differ:
 *   - The persona chrome differs BY ROLE (patient gets a bottom nav, the
 *     operator does not) — that is a rule, enforced elsewhere. So each role's
 *     walk is measured on its own and never compared against another's.
 *   - An element that appears, disappears or animates is not "moving": only
 *     elements present and settled in BOTH beats are compared.
 *
 * Needs Chrome and a running dev server, like the other sweeps:
 *
 *     npm run dev                  # in one terminal
 *     npm run stability-sweep      # in another
 *
 * Exits non-zero on drift so the build gate can fail on it.
 */
import { chromium } from "playwright-core";

const CHROME = process.env.CHROME_PATH
  || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const URL = process.env.SWEEP_URL || "http://localhost:3000/";
const WIDTH = Number(process.env.SWEEP_WIDTH || 1440);
/** Sub-pixel reflow from font loading is not what we are hunting. */
const TOLERANCE = Number(process.env.SWEEP_TOLERANCE || 1.5);

/**
 * Which elements count as persistent chrome.
 *
 * Not "everything on screen": a card in the page body SHOULD move as content
 * changes — that is the content changing, not furniture drifting. The rule is
 * position-based, which is what makes it general: anything the layout pins in
 * place (sticky/fixed) is furniture by definition, whatever it contains, and
 * whatever someone adds next.
 */
const COLLECT = () => {
  const stuck = el => {
    for (let p = el; p && p !== document.body; p = p.parentElement) {
      const pos = getComputedStyle(p).position;
      if (pos === "sticky" || pos === "fixed") return true;
    }
    return false;
  };
  /**
   * A key that survives re-renders and says nothing about geometry.
   *
   * Text is deliberately NOT part of it: a button whose label changes is the
   * same button, and it is exactly the case that caused bug #2 — keying on
   * text would treat "Next" and "End of this persona's day" as two different
   * elements and compare neither against the other.
   */
  const keyOf = el => {
    const parts = [];
    for (let p = el; p && p !== document.body; p = p.parentElement) {
      const sibs = [...(p.parentElement?.children ?? [])];
      parts.unshift(`${p.tagName.toLowerCase()}:${sibs.indexOf(p)}`);
    }
    return parts.join(">");
  };
  const out = {};
  for (const el of document.querySelectorAll("body *")) {
    if (!stuck(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.opacity === "0") continue;
    // Skip anything mid-animation: a transform in flight is not a resting
    // position, and comparing against it produces noise, not findings.
    if (cs.transform !== "none" && cs.transform !== "matrix(1, 0, 0, 1, 0, 0)") continue;
    const label = (el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 40);
    out[keyOf(el)] = {
      x: +r.x.toFixed(1), y: +r.y.toFixed(1),
      w: +r.width.toFixed(1), h: +r.height.toFixed(1),
      tag: el.tagName.toLowerCase(),
      cls: String(el.className?.baseVal ?? el.className ?? "").split(/\s+/).slice(0, 3).join("."),
      label,
    };
  }
  return out;
};

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await (await browser.newContext({
  viewport: { width: WIDTH, height: 900 }, deviceScaleFactor: 1,
})).newPage();

/** The role-handoff interstitial covers the screen; measuring through it is noise. */
const settle = async () => {
  await page.waitForFunction(() => !document.querySelector(".fixed.inset-0.z-50"),
    null, { timeout: 4000 }).catch(() => {});
  // Let the entry animations finish so a mid-flight opacity is not read as a
  // position. The mark's own stagger settles in ~0.75s.
  await page.waitForTimeout(850);
};

const personas = [
  ["Patient", /Alex Rivera/],
  ["CMA", /Maya Lewis/],
  ["Audiologist", /Susan Reed/],
  ["Operator", /Jordan Pike/],
];

const findings = [];
let beatsWalked = 0;
/** Did the story contain both a scrolling and a non-scrolling beat? */
const overflowSeen = new Set();
let gutter = "";

for (const [role, entry] of personas) {
  await page.goto(URL, { waitUntil: "networkidle" });
  const link = page.getByText(entry).first();
  if (!(await link.count())) continue;
  await link.dispatchEvent("click");
  await settle();

  let prev = null, prevName = "(entry)";
  for (let step = 0; step < 40; step++) {
    await settle();
    const name = await page.evaluate(
      () => (document.querySelector("h1,h2")?.textContent || "").trim().slice(0, 40));
    const now = await page.evaluate(COLLECT);
    /**
     * The width the layout actually centres against.
     *
     * This is measured SEPARATELY from the element map because headless Chrome
     * draws overlay scrollbars that take no space, so `clientWidth` never
     * changes here and no element ever appears to move — which is how the
     * owner's 2026-09-02 report ("the top line is moving with screen slides")
     * survived a green sweep. On a real Chrome a classic scrollbar is taken
     * out of this width, so a beat that scrolls centres 7.5px left of one that
     * does not, dragging the logo, the persona pills and the Next button with it.
     *
     * We cannot reproduce the scrollbar headlessly, so we assert the thing that
     * makes it harmless instead: whether each beat overflows, and whether the
     * gutter is reserved regardless. If the reservation is in place, a flip
     * costs nothing; if it is not, a flip is drift the eye will see.
     */
    const view = await page.evaluate(() => ({
      overflows: document.documentElement.scrollHeight > document.documentElement.clientHeight,
      gutter: getComputedStyle(document.documentElement).scrollbarGutter,
    }));
    if (view.overflows !== undefined) overflowSeen.add(view.overflows);
    gutter = view.gutter;
    beatsWalked++;

    if (prev) {
      for (const [key, b] of Object.entries(now)) {
        const a = prev[key];
        if (!a) continue;                       // appeared: not drift
        const dx = Math.abs(a.x - b.x), dy = Math.abs(a.y - b.y);
        const dw = Math.abs(a.w - b.w), dh = Math.abs(a.h - b.h);
        if (dx <= TOLERANCE && dy <= TOLERANCE && dw <= TOLERANCE && dh <= TOLERANCE) continue;
        findings.push({
          role, from: prevName, to: name,
          el: `${b.tag}.${b.cls}`, label: b.label,
          moved: `x${a.x}→${b.x} y${a.y}→${b.y}`,
          resized: `${a.w}×${a.h} → ${b.w}×${b.h}`,
          drifted: { dx, dy, dw, dh },
        });
      }
    }
    prev = now; prevName = name;

    const next = page.getByRole("button", { name: /^Next|End of this persona/i }).first();
    if (!(await next.count()) || await next.isDisabled()) break;
    await next.dispatchEvent("click");
    await page.waitForTimeout(400);
  }
}

await browser.close();

// A sweep that walked nothing must not report success — the exact failure
// `role-lock-sweep.mjs` shipped with, where a bad selector made it walk 0
// screens and print a green tick.
if (beatsWalked < 8) {
  console.log(`Walked only ${beatsWalked} beats — the sweep did not run. Is the dev server up at ${URL}?`);
  process.exit(1);
}

console.log(`${beatsWalked} beats across ${personas.length} personas at ${WIDTH}px.`);

/**
 * The scrollbar-gutter check.
 *
 * Only meaningful when the walk actually mixed scrolling and non-scrolling
 * beats — if every beat scrolls, the scrollbar is always there and nothing
 * flips. This story mixes them (the hero scrolls, "Welcome to Hearfy" does
 * not), so the reservation is required.
 */
if (overflowSeen.size > 1 && !/stable/.test(gutter)) {
  console.log(`\nThe story has both scrolling and non-scrolling beats, but the`);
  console.log(`root element does not reserve the scrollbar gutter`);
  console.log(`(scrollbar-gutter: ${gutter || "auto"}).`);
  console.log(`\nOn a real Chrome the scrollbar appears and disappears as the story`);
  console.log(`advances, changing the width the layout centres against, so the whole`);
  console.log(`top bar slides ~7px sideways between beats. Headless Chrome draws`);
  console.log(`overlay scrollbars and cannot see this, which is why it needs asserting`);
  console.log(`rather than measuring. Set \`html { scrollbar-gutter: stable }\`.`);
  process.exit(1);
}
if (findings.length) {
  console.log(`\n${findings.length} chrome element(s) moved between beats:\n`);
  for (const f of findings) {
    console.log(`  [${f.role}] ${f.el}${f.label ? `  ${JSON.stringify(f.label)}` : ""}`);
    console.log(`     ${f.from} → ${f.to}`);
    if (f.drifted.dx > TOLERANCE || f.drifted.dy > TOLERANCE) console.log(`     moved   ${f.moved}`);
    if (f.drifted.dw > TOLERANCE || f.drifted.dh > TOLERANCE) console.log(`     resized ${f.resized}`);
  }
  console.log(`\nPersistent chrome must hold still. If a change is deliberate, it is`);
  console.log(`still chrome that moves under the viewer's cursor — reserve the space`);
  console.log(`instead (see CallShell's reserved header height, or the Next button's`);
  console.log(`stacked labels) rather than letting the layout resize.`);
  process.exit(1);
}
console.log("No chrome drift.");
