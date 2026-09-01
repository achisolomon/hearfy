/**
 * Walk the whole demo at phone width and fail on real layout breakage.
 *
 * The deep half of the phone guard (owner, 2026-09-01). `lib/mobile-safety.ts`
 * holds the cheap static invariants inside `npm test`; this drives a real
 * browser through all 37 screens at 390px and measures actual geometry, which
 * is the only way to catch a layout that breaks from the interaction of
 * several correct-looking rules.
 *
 * It is not in `npm test` because it needs Chrome and a running dev server.
 * Run it when you change layout, and before a deploy:
 *
 *     npm run dev                 # in one terminal
 *     npm run mobile-sweep        # in another
 *
 * `BASE_FONT` emulates the OS/browser "font size" accessibility setting — the
 * factor that made the deployed demo unusable on the owner's phone while
 * looking perfect on every desktop. Sweep BOTH, because they fail differently:
 *
 *     npm run mobile-sweep                 # default 16px browser font
 *     BASE_FONT=24 npm run mobile-sweep    # a phone set to large text
 *
 * Exits non-zero when it finds a defect, so CI can gate on it.
 */
import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";

const CHROME = process.env.CHROME_PATH
  || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const URL = process.env.SWEEP_URL || "http://localhost:3000/demo2";
const OUT = process.env.SWEEP_OUT || "";           // set to a dir to save shots
const BIG = Number(process.env.BASE_FONT || 0);
const WIDTH = Number(process.env.SWEEP_WIDTH || 390);

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const ctx = await browser.newContext({
  viewport: { width: WIDTH, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  userAgent: "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36",
});
const page = await ctx.newPage();

// Emulate the phone's accessibility font setting: it scales the browser's
// default font size, which any relative root font-size then multiplies.
if (BIG) {
  const cdp = await ctx.newCDPSession(page);
  await cdp.send("Page.setFontSizes", { fontSizes: { standard: BIG, fixed: BIG } });
}

await page.goto(URL, { waitUntil: "networkidle" });

const start = page.getByRole("button", { name: /start|begin|enter|walk/i }).first();
if (await start.count()) { await start.dispatchEvent("click"); await page.waitForTimeout(600); }

/** Measure the live layout for defects a viewer would actually hit. */
const probe = () => page.evaluate(() => {
  const de = document.documentElement;
  const vw = window.innerWidth;
  const out = {
    rootFontPx: parseFloat(getComputedStyle(de).fontSize),
    docScrollW: de.scrollWidth,
    viewportW: vw,
    hOverflow: de.scrollWidth > vw + 1,
    offenders: [], clipped: [], covered: [],
  };
  const inScroller = el => {
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      const ox = getComputedStyle(p).overflowX;
      if (ox === "auto" || ox === "scroll") return true;
    }
    return false;
  };
  for (const el of document.querySelectorAll("body *")) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.opacity === "0") continue;
    const tag = el.tagName.toLowerCase();
    const cls = String(el.className?.baseVal ?? el.className ?? "");
    const id = `${tag}.${cls.split(/\s+/).slice(0, 4).join(".")}`;
    const text = (el.textContent || "").trim().slice(0, 60);

    // Decoration is allowed to bleed off an edge or be cropped — a blurred
    // blob offset to `-right-6`, a rounded image crop, a background grid.
    // Only report boxes that carry words, which is what a viewer can lose.
    //
    // And only the element that DIRECTLY holds those words. A container's
    // scrollWidth includes any decoration it deliberately crops, so a hero
    // that is laying out perfectly still reports itself as clipped because
    // of an `aria-hidden` circle bleeding past its edge (measured on the
    // cover, 2026-09-01: the heading and body ended 39px inside the box).
    // Measuring the text node's own parent removes that whole false class.
    const ownText = [...el.childNodes]
      .filter(n => n.nodeType === 3 && n.textContent.trim())
      .length > 0;
    const carriesText = text.length > 0 && ownText;

    // Content pushed off-screen — but content inside a deliberate horizontal
    // scroller is reachable, so it is not a defect.
    if (carriesText && !inScroller(el) && (r.right > vw + 1 || r.left < -1)) {
      out.offenders.push({ id, left: Math.round(r.left), right: Math.round(r.right), text });
    }
    // Text cut off. An ellipsis is a choice; losing a quarter of the string
    // to it is not — that is where a label stops meaning anything.
    if (carriesText && el.scrollWidth > el.clientWidth + 2 && cs.overflowX === "hidden" && !cls.includes("sr-only")) {
      const lost = (el.scrollWidth - el.clientWidth) / el.scrollWidth;
      if (cs.textOverflow !== "ellipsis" || lost > 0.25) {
        out.clipped.push({ id, lost: +(lost * 100).toFixed(0), text });
      }
    }
    // A control the docked bar sits on top of cannot be tapped at all — the
    // bug that made Next unpressable at a large system font.
    //
    // Two things legitimately cover a button and must not be reported: a
    // modal overlay (the interstitial is `inset-0` and is SUPPOSED to swallow
    // the screen behind it), and Next's own dev-only error portal. So this
    // only fires when the covering element is a docked BAR — pinned to an
    // edge across the viewport, not covering the whole of it.
    if (tag === "button" && !el.disabled) {
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      if (cy > 0 && cy < window.innerHeight) {
        const hit = document.elementFromPoint(cx, cy);
        // `elementFromPoint` returns the innermost element, which for a
        // healthy button is its own label. Walking up from the hit and
        // asking whether we reach this button distinguishes "my own text is
        // in front of me" (fine) from "something else is" (the bug).
        let owned = false;
        for (let p = hit; p; p = p.parentElement) if (p === el) { owned = true; break; }
        if (hit && !owned && !hit.contains(el)) {
          // The blocker may be a small label centred inside a big overlay, so
          // look for a full-screen ANCESTOR of the hit rather than measuring
          // the hit itself. A modal (the ~1s role-handoff interstitial) is
          // meant to cover the screen; a docked bar is not.
          let modal = false, portal = false;
          for (let p = hit; p; p = p.parentElement) {
            if (/PORTAL/i.test(p.tagName)) { portal = true; break; }
            const pr = p.getBoundingClientRect();
            if (pr.height >= window.innerHeight * 0.9 && pr.width >= window.innerWidth * 0.9) { modal = true; break; }
          }
          if (!modal && !portal) {
            out.covered.push({ id, text, by: String(hit.className || hit.tagName).slice(0, 50) });
          }
        }
      }
    }
  }
  const uniq = a => { const s = new Set(); return a.filter(x => { const k = x.id + x.text; if (s.has(k)) return false; s.add(k); return true; }); };
  out.offenders = uniq(out.offenders).slice(0, 12);
  out.clipped = uniq(out.clipped).slice(0, 12);
  out.covered = uniq(out.covered).slice(0, 12);
  return out;
});

const label = () => page.evaluate(() => {
  const h = document.querySelector("h1,h2");
  return (h ? h.textContent.trim() : document.title).slice(0, 50);
});

if (OUT) fs.mkdirSync(OUT, { recursive: true });
const report = [];
let failures = 0;

/** The role-handoff interstitial covers the screen for ~1.1s; measuring
 *  through it reports every control as blocked. Let it clear first. */
const settle = async () => {
  await page.waitForFunction(
    () => !document.querySelector(".fixed.inset-0.z-50"),
    null, { timeout: 4000 },
  ).catch(() => {});
};

for (let step = 0; step < 60; step++) {
  await settle();
  const name = await label();
  const p = await probe();
  const bad = p.hOverflow || p.offenders.length || p.clipped.length || p.covered.length;
  report.push({ step, name, ...p });
  if (bad) {
    failures++;
    const bits = [];
    if (p.hOverflow) bits.push(`PAGE-OVERFLOW ${p.docScrollW}>${p.viewportW}`);
    for (const o of p.offenders) bits.push(`offscreen ${o.id} R${o.right}>${p.viewportW} ${JSON.stringify(o.text)}`);
    for (const c of p.clipped) bits.push(`clipped -${c.lost}% ${c.id} ${JSON.stringify(c.text)}`);
    for (const c of p.covered) bits.push(`UNTAPPABLE ${c.id} ${JSON.stringify(c.text)} under ${c.by}`);
    console.log(`\n[${step}] ${name}  (root ${p.rootFontPx}px)`);
    for (const b of bits) console.log(`   - ${b}`);
    if (OUT) await page.screenshot({ path: path.join(OUT, `s${String(step).padStart(2, "0")}.png`) });
  }
  const next = page.getByRole("button", { name: /^Next/i }).first();
  if (!(await next.count()) || await next.isDisabled()) break;
  await next.dispatchEvent("click");
  await page.waitForTimeout(450);
}

await browser.close();

const root = report[0]?.rootFontPx;
console.log(`\n${report.length} screens at ${WIDTH}px, root font ${root}px` + (BIG ? ` (browser default ${BIG}px)` : ""));
if (failures) {
  console.log(`${failures} screen(s) with layout defects.`);
  process.exit(1);
}
console.log("No layout defects.");
