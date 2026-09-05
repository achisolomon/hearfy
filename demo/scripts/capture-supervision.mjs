/**
 * Capture the audiologist's supervision panel as a still, for compositing onto
 * a monitor in generated video footage.
 *
 * Generative video cannot render a user interface. Text comes back as garbled
 * letterforms, the tile count drifts between frames, and the flagged tile
 * wanders. None of that survives a pause, and this project's standing rule is
 * that the brand name is never re-typed by hand — least of all by a model.
 *
 * So the film's screen content is a real screenshot of the real panel,
 * corner-pinned onto a locked-off plate in an editor. That gets the six
 * patients, the prioritisation order and the DESIGN.md tokens right for free.
 *
 * Needs Chrome and a running dev server, like the other sweeps:
 *
 *     npm run dev                      # in one terminal
 *     npm run capture-supervision      # in another
 *
 * Writes to demo/out-capture/ (gitignored — these are build artefacts for the
 * edit, not repo assets).
 *
 * Options:
 *   CAPTURE_WIDTH=2560   viewport width (default 2560, for 1:1 pixels at 1080p)
 *   CAPTURE_SCALE=2      device pixel ratio (default 2 — retina, so the plate
 *                        survives a push-in without softening)
 *   CAPTURE_PEEK=1       also capture the peek card open on the flagged exam
 */
import { chromium } from "playwright-core";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const CHROME = process.env.CHROME_PATH
  || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
/** The demo moved to /demo when the one-pager took the root (b20a803). */
const URL = process.env.SWEEP_URL || "http://localhost:3000/demo/";
const WIDTH = Number(process.env.CAPTURE_WIDTH || 2560);
const SCALE = Number(process.env.CAPTURE_SCALE || 2);
const OUT = path.resolve("out-capture");

/**
 * The panel animates: the flagged tile pulses and the wait timers advance on a
 * 12s interval. Both are motion, and the demo honours prefers-reduced-motion
 * everywhere — so emulating it freezes the panel into the one deterministic
 * frame we actually want to composite.
 */
async function main() {
  await mkdir(OUT, { recursive: true });

  const browser = await chromium.launch({ executablePath: CHROME });
  const page = await browser.newPage({
    viewport: { width: WIDTH, height: Math.round(WIDTH * 9 / 16) },
    deviceScaleFactor: SCALE,
    reducedMotion: "reduce",
  });

  await page.goto(URL, { waitUntil: "networkidle" });

  // The cover offers a persona button per role. Entering as Dr. Reed lands
  // directly on her panel — `aud-panel` is her screen from the first beat, so
  // no timeline scrubbing is needed.
  await page.getByRole("button", { name: /Susan Reed/i }).first().click();
  await page.getByText(/six exams in progress/i).waitFor({ timeout: 10_000 });

  // Fonts settle after paint; a half-drawn Inter is a soft plate.
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);

  await page.screenshot({ path: path.join(OUT, "supervision-panel.png") });
  console.log("wrote out-capture/supervision-panel.png");

  // The grid alone, without the surrounding chrome — usually the better plate,
  // because a monitor in shot shows an app, not a phone-framed demo.
  const grid = page.locator("div.grid").first();
  if (await grid.count()) {
    await grid.screenshot({ path: path.join(OUT, "supervision-grid.png") });
    console.log("wrote out-capture/supervision-grid.png");
  }

  if (process.env.CAPTURE_PEEK) {
    // Eleanor M. is the flagged exam, and prioritisation floats her to first.
    await page.getByRole("button", { name: /needs attention/i }).first().click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(OUT, "supervision-peek.png") });
    console.log("wrote out-capture/supervision-peek.png");
  }

  await browser.close();
}

main().catch(err => { console.error(err); process.exit(1); });
