/**
 * Nothing on screen may blink.
 *
 * Owner, 2026-10-05: "we get flickers in the demo, like the screen is
 * flickering." Measured frame by frame, every framer-motion opacity fade
 * blinked for ONE frame as it ended: a fade-in reached 1, fell to 0 for a
 * frame, and came back; the persona-handoff overlay's fade-out reached 0 and
 * flashed back to fully opaque navy for a frame before unmounting. framer
 * hands opacity to a browser (WAAPI) animation and writes the end value on its
 * next frame-loop tick, which is a frame late whenever nothing else animates
 * (fix and full story: components/motion-safe.ts, lib/chrome-stability.test.ts).
 *
 * The unit guard in chrome-stability.test.ts checks the source SHAPE that
 * caused it. This sweep checks the thing the viewer sees, so it also catches a
 * blink with a cause nobody has met yet — a library upgrade, a new animation
 * API, a remount. Like stability-sweep, it names no elements: it records the
 * opacity of EVERY element on every animation frame and flags any element
 * that
 *   - was visible (>= 0.95), dropped below 0.2, and was visible again within
 *     3 frames (a fade-in blink), or
 *   - faded to 0 and then showed >= 0.95 in its last frame before leaving the
 *     DOM (an exit flash).
 * A real fade takes many frames, so neither pattern matches a fade.
 *
 * It walks the guided story end to end (every screen change and every
 * persona handoff), loads the cover, and on a phone-width run opens and closes
 * the role sheet.
 *
 *     npm run dev                         # in one terminal
 *     npm run flicker-sweep               # desktop, in another
 *     SWEEP_WIDTH=390 npm run flicker-sweep   # phone (also covers the sheet)
 *
 * The blink only appears when nothing else is animating, which is why a
 * looping animation elsewhere (the old route map) once hid it for most of the
 * walk. Exits non-zero on any blink.
 *
 * MANUAL ONLY, by owner decision (2026-10-05: "too long, I don't want it on
 * every push, save it for special cases"). It is deliberately not in the
 * pre-push gate, CI or the Cloudflare build — the fast source guard in
 * lib/chrome-stability.test.ts covers every push. Run it when a change touches
 * animation: framer-motion (or an upgrade of it), a transition or fade,
 * AnimatePresence, the screen wrapper, the handoff overlay, the role sheet,
 * or when someone reports a flicker. It walks the whole story, so it takes a
 * few minutes per width. SWEEP_HEADLESS=1 also detects the blink (verified).
 */
import { chromium } from "playwright-core";

const CHROME = process.env.CHROME_PATH
  || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const URL = process.env.SWEEP_URL || "http://localhost:3000/demo";
const WIDTH = Number(process.env.SWEEP_WIDTH || 1440);
const PHONE = WIDTH < 768;
const HEADLESS = process.env.SWEEP_HEADLESS === "1";

/**
 * Installed before any page script runs. Gives every element a stable id and
 * records its own opacity each frame while recording is on. Elements that
 * leave the DOM keep their series, which is what exposes an exit flash.
 */
const RECORDER = () => {
  const ids = new WeakMap(); let nextId = 0;
  const series = new Map();          // id -> { label, values: number[], gone }
  let on = false, frame = 0;
  const label = el => {
    const cls = String(el.className?.baseVal ?? el.className ?? "").split(/\s+/).slice(0, 4).join(".");
    const text = (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 40);
    return `${el.tagName.toLowerCase()}${cls ? "." + cls : ""}${text ? `  "${text}"` : ""}`;
  };
  const tick = () => {
    if (on) {
      frame++;
      const live = new Set();
      for (const el of document.body.getElementsByTagName("*")) {
        let id = ids.get(el);
        if (id === undefined) { id = nextId++; ids.set(el, id); }
        live.add(id);
        let s = series.get(id);
        if (!s) { s = { label: label(el), values: [], start: frame, gone: false }; series.set(id, s); }
        if (s.gone) { s.gone = false; s.values.push(-1); }
        s.values.push(+(+getComputedStyle(el).opacity).toFixed(2));
      }
      for (const [id, s] of series) if (!live.has(id) && !s.gone) s.gone = true;
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  window.__flicker = {
    start() { on = true; },
    collect(where) {
      const found = [];
      for (const s of series.values()) {
        const v = s.values;
        for (let i = 1; i < v.length - 1; i++) {
          // fade-in blink: visible, (near) invisible for 1–2 frames, visible
          if (v[i - 1] >= 0.95 && v[i] >= 0 && v[i] < 0.2) {
            const back = v.slice(i + 1, i + 3).findIndex(x => x >= 0.95);
            if (back !== -1) { found.push({ where, el: s.label, kind: "blinked out", at: v.slice(Math.max(0, i - 3), i + 4) }); break; }
          }
        }
        // exit flash: faded to 0, then fully visible in its last frame
        if (s.gone && v.length >= 3 && v[v.length - 2] === 0 && v[v.length - 1] >= 0.95)
          found.push({ where, el: s.label, kind: "flashed before leaving", at: v.slice(-5) });
      }
      series.clear();
      return found;
    },
  };
};

const browser = await chromium.launch({ executablePath: CHROME, headless: HEADLESS });
const ctx = await browser.newContext({
  viewport: { width: WIDTH, height: PHONE ? 844 : 900 },
  ...(PHONE ? { isMobile: true, hasTouch: true } : {}),
});
await ctx.addInitScript(RECORDER);
const page = await ctx.newPage();
const findings = [];
const collect = async where => findings.push(...await page.evaluate(w => window.__flicker.collect(w), where));

// 1. The cover's own fade-in, from the first frame.
await ctx.addInitScript(() => document.addEventListener("DOMContentLoaded", () => window.__flicker?.start()));
await page.goto(URL, { waitUntil: "networkidle" });
await page.waitForTimeout(900);
await collect("cover");

// 2. The guided story, end to end: every screen change and every handoff.
const start = page.getByRole("button", { name: /start the guided/i }).first();
if (!(await start.count())) { console.log("Could not find the guided-journey button."); process.exit(1); }
await start.dispatchEvent("click");
await page.waitForTimeout(1200);
let steps = 0, last = "";
for (let i = 0; i < 80; i++) {
  const next = page.getByRole("button", { name: /^Next/i }).first();
  if (!(await next.count()) || await next.isDisabled()) break;
  last = await page.evaluate(() => (document.querySelector("h1,h2")?.textContent || "").trim().slice(0, 36));
  await next.dispatchEvent("click");
  steps++;
  // Long enough for a screen fade (200ms) and a handoff (~1.1s + exit).
  await page.waitForTimeout(1600);
  await collect(`after Next from "${last}"`);
}

// 3. Phone only: the role sheet (backdrop fade in and out).
let sheets = 0;
if (PHONE) {
  await page.goto(URL, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /start the guided/i }).first().dispatchEvent("click");
  await page.waitForTimeout(2500);
  // Discard the reload and handoff; only the sheet is measured here.
  await page.evaluate(() => window.__flicker.collect("discard"));
  for (let k = 0; k < 3; k++) {
    await page.getByRole("button", { name: /change role/ }).click();
    await page.waitForTimeout(900);
    await page.getByRole("button", { name: "Close" }).click();
    await page.waitForTimeout(900);
    sheets++;
  }
  await collect("role sheet open/close");
}

await browser.close();

// A walk that went nowhere would report "no blinks" for screens it never
// showed — the failure mode role-lock-sweep shipped with.
if (steps < 10) {
  console.log(`Walked only ${steps} steps — the sweep did not reach the story.`);
  process.exit(1);
}
console.log(`${steps} story steps${PHONE ? `, ${sheets} role-sheet opens` : ""}, and the cover, at ${WIDTH}px${HEADLESS ? " (headless)" : ""}.`);
if (findings.length) {
  console.log(`\n${findings.length} blink(s):\n`);
  for (const f of findings) {
    console.log(`  ${f.where}`);
    console.log(`     ${f.el}`);
    console.log(`     ${f.kind}; opacity by frame: ${f.at.map(x => x < 0 ? "–" : x).join(" ")}`);
  }
  console.log(`\nAn element showed for a frame at the wrong opacity — a flicker.`);
  console.log(`If it is a framer-motion fade, spread {...jsDriven} from`);
  console.log(`components/motion-safe.ts on it, or make a one-way fade a CSS animation.`);
  process.exit(1);
}
console.log("No blinks.");
