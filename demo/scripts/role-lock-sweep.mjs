/**
 * Fail if clicking anything INSIDE a persona's device changes who the viewer is.
 *
 * The acceptance criterion for the persona lock (owner, 2026-09-01): "if I click
 * inside a screen I stay with the same persona, do not jump between persona."
 * Only the chrome — the top Next/Back, the role tabs, the timeline numbers — may
 * switch persona.
 *
 * `lib/regressions.test.ts` holds the cheap static half of this guard (no
 * component outside components/shell/ can reach the context's role-switching
 * `next`). This is the deep half: it drives a real browser to every beat of
 * every persona's walk and clicks EVERY control drawn inside the screen,
 * checking the highlighted persona never changes. That catches a regression the
 * source scan cannot see, the same way mobile-sweep.mjs backs up
 * lib/mobile-safety.ts.
 *
 * Needs a running server, like mobile-sweep:
 *     npx serve out -l 3000  &&  node scripts/role-lock-sweep.mjs
 *
 * SWEEP_ROLES=Audiologist,Operator narrows it to one or two personas; the full
 * four-persona run takes about fifteen minutes.
 *
 * Exits non-zero on a violation, so CI can gate on it.
 */
import { chromium } from "playwright-core";

const CHROME = process.env.CHROME_PATH
  || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const URL = process.env.SWEEP_URL || "http://localhost:3000/";

const ROLES = (process.env.SWEEP_ROLES || "Patient,CMA,Audiologist,Operator").split(",");
/** The cover's per-persona entry buttons are labelled with the person. */
const PERSON = {
  Patient: "Alex Rivera",
  CMA: "Maya Lewis",
  Audiologist: "Dr. Susan Reed",
  Operator: "Jordan Pike",
};
/** Controls belonging to the chrome, which IS allowed to switch persona. */
const CHROME_LABEL = /^(Back|Next|Patient|CMA|Audiologist|Operator|[1-9]|End of this persona's day)$/;

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

async function activeRole() {
  const tabs = page.locator('[role="tab"]');
  for (let i = 0; i < await tabs.count(); i++) {
    if (await tabs.nth(i).getAttribute("aria-selected") === "true") {
      // Text is "AR\nPatient" — the avatar initials, then the label.
      return (await tabs.nth(i).innerText()).trim().split("\n").pop().trim();
    }
  }
  return "(none)";
}

/** Visible controls drawn inside the screen, excluding the top chrome bar. */
async function inScreenButtons() {
  const out = [];
  const all = page.locator("button");
  for (let i = 0; i < await all.count(); i++) {
    const b = all.nth(i);
    if (!(await b.isVisible().catch(() => false))) continue;
    if (await b.getAttribute("role") === "tab") continue;
    const box = await b.boundingBox().catch(() => null);
    if (!box || box.y < 60) continue;               // the top bar is the chrome
    const label = (await b.innerText().catch(() => "")).trim().replace(/\s+/g, " ");
    if (!label || CHROME_LABEL.test(label)) continue;
    out.push({ index: i, label });
  }
  return out;
}

/** Enter as one persona from the cover. */
async function enterAs(role) {
  await page.goto(URL, { waitUntil: "networkidle" });
  const entry = page.locator("button", { hasText: PERSON[role] }).first();
  if (!(await entry.count())) return false;
  await entry.click();
  await page.waitForTimeout(300);
  return await activeRole() === role;
}

const violations = [];
let clicks = 0, screens = 0;

for (const role of ROLES) {
  let roleClicks = 0, roleScreens = 0;

  for (let beat = 0; beat < 40; beat++) {
    if (!(await enterAs(role))) break;

    // Walk the chrome forward to this beat, so each beat is reached identically
    // and one screen's clicks cannot leak into the next.
    let ended = false;
    for (let k = 0; k < beat; k++) {
      const next = page.getByRole("button", { name: "Next", exact: true }).first();
      if (!(await next.count()) || await next.isDisabled().catch(() => true)) { ended = true; break; }
      await next.click();
      await page.waitForTimeout(140);
    }
    if (ended) break;

    // Chrome Next advances the STORY, and the story hands the scene between
    // personas — the audiologist leads six beats, but not six in a row. Landing
    // on someone else's beat is the script working, not a lock failure (the
    // chrome is explicitly allowed to switch persona; see the header). Skip to
    // the next beat instead of reporting it, or this sweep only ever tests the
    // opening run of whichever persona happens to lead first.
    //
    // This walk used to be checked as a violation, which passed unnoticed while
    // the sweep pointed at a route where `enterAs` never matched and it silently
    // walked zero screens (found 2026-09-02, when `/demo2` folded into `/`).
    if (await activeRole() !== role) continue;

    const heading = (await page.locator("h1,h2").first().innerText().catch(() => "")).replace(/\s+/g, " ");
    const btns = await inScreenButtons();
    if (!btns.length) continue;
    roleScreens++;

    for (const { index, label } of btns) {
      const before = await activeRole();
      const all = page.locator("button");
      if (index >= await all.count()) continue;
      await all.nth(index).click({ timeout: 2000 }).catch(() => {});
      await page.waitForTimeout(140);
      clicks++; roleClicks++;
      const after = await activeRole();
      if (after !== before) {
        violations.push(`${role}: in-screen "${label}" on "${heading}" switched persona ${before} -> ${after}`);
      }
      // Re-select the persona so the next control starts from the same state.
      // The role tab is chrome, so using it here is legitimate.
      const tab = page.locator('[role="tab"]', { hasText: new RegExp(role) }).first();
      if (await tab.count()) { await tab.click().catch(() => {}); await page.waitForTimeout(120); }
    }
  }

  screens += roleScreens;
  console.log(`  ${role}: ${roleClicks} in-screen clicks across ${roleScreens} screens`);
}

await browser.close();
console.log(`\n${clicks} in-screen clicks across ${screens} screens, ${ROLES.length} personas`);
if (violations.length) {
  console.log("\nVIOLATIONS:");
  violations.forEach(v => console.log("  " + v));
  process.exit(1);
}
// A sweep that reached nothing has proved nothing. This printed a cheerful
// pass for weeks while aimed at a route where `enterAs` never matched, so the
// absence of violations was meaningless (found 2026-09-02).
if (screens === 0) {
  console.log(`\nNOTHING SWEPT: reached 0 screens at ${URL}.`);
  console.log("The entry buttons never matched — check SWEEP_URL and that the server is up.");
  process.exit(1);
}
console.log("No in-screen click changed the persona.");
