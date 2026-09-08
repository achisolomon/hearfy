/**
 * The one-pager answers the pointer — and stays completely still without it.
 *
 * The pointer layer is the one effect on this page that a source-reading test
 * structurally cannot verify. `lib/one-pager.test.ts` can assert that the
 * attributes are present and that the reduced-motion block exists, but it
 * cannot tell whether a rule ever MATCHES: a selector typo, a stacking order
 * that buries the glow, an `overflow` that clips the sheen, or a parent whose
 * `transform` re-anchors the fixed layer all leave the source looking perfect
 * and the page looking dead. A guard that matches nothing passes.
 *
 * So this drives a real browser with a real mouse and measures the effects:
 *
 *   1. With the pointer parked off-page, every reactive element sits at its
 *      identity transform and the glow is fully transparent. This is the half
 *      that matters most — the page's register is calm, and an effect that
 *      idles "on" is the toy-like anti-reference DESIGN.md rules out.
 *   2. Move the mouse onto a card: it lifts, and its sheen is positioned at
 *      the pointer rather than at the element's centre default.
 *   3. Move the mouse onto a photo: the picture inside the frame transforms
 *      while the frame itself does not move at all.
 *   4. Move the mouse across the page: the glow lights, and its centre
 *      follows.
 *   5. Move the mouse away again: everything returns to exactly the resting
 *      values from (1). An effect that does not clean up is how a page ends
 *      up permanently lit in the corner the reader last visited.
 *
 * It then reloads the page under `prefers-reduced-motion: reduce` and asserts
 * that (2), (3) and (4) all do nothing, and under a coarse pointer that the
 * whole layer is absent.
 *
 * Run against a server that is already up:
 *     node scripts/pointer-sweep.mjs [origin]
 */
import { chromium, devices } from "playwright-core";

const ORIGIN = process.argv[2] ?? "http://localhost:3592";

const failures = [];
const notes = [];

function check(ok, label, detail = "") {
  if (ok) notes.push(`  ok    ${label}`);
  else failures.push(`  FAIL  ${label}${detail ? ` — ${detail}` : ""}`);
}

/** The resting transform, in every form a browser may report it. */
const IDENTITY = new Set(["none", "matrix(1, 0, 0, 1, 0, 0)"]);

async function transformOf(page, selector) {
  return page.$eval(selector, (el) => getComputedStyle(el).transform);
}

/**
 * Scroll a locator into view, then return a probe point inside it.
 *
 * The page is ~7000px tall, so almost every card starts below the fold. A box
 * read without scrolling first reports a y far outside the window, and
 * `mouse.move()` — which takes viewport coordinates — then lands on nothing at
 * all. Every hover assertion fails, for a reason that has nothing to do with
 * the page. Cost a debugging cycle on 2026-09-07, so the scroll lives here
 * rather than at each call site where it can be forgotten.
 *
 * `fx`/`fy` are fractions of the element's own box. Callers pass off-centre
 * values on purpose: a sheen stuck at its 50%/50% default still looks
 * "positioned" if the probe is taken at the middle.
 */
async function probePoint(page, locator, fx, fy) {
  await locator.scrollIntoViewIfNeeded();
  // Long enough for the Reveal entrance to finish, not merely for the scroll
  // to stop. Scrolling an element into view is what TRIGGERS its whileInView
  // animation, which travels y: 18 -> 0 over 500ms; a box read before that
  // settles is 18px high and every "did the frame move?" assertion fails by
  // exactly that amount, blaming the pointer for the entrance. Cost a second
  // debugging cycle on 2026-09-07 — the first was the missing scroll itself.
  await page.waitForTimeout(900);
  const box = await locator.boundingBox();
  return { box, x: box.x + box.width * fx, y: box.y + box.height * fy };
}

/**
 * The sheen's position, read back off the custom property rather than off the
 * painted gradient: a computed `background-image` normalises the var() away on
 * some engines, and the property is the thing the rule actually consumes.
 */
async function sheenPos(page, selector) {
  return page.$eval(selector, (el) => ({
    mx: el.style.getPropertyValue("--mx"),
    my: el.style.getPropertyValue("--my"),
  }));
}

async function run() {
  const browser = await chromium.launch();

  /* ---------------------------------------------------------------- *
   * 1. A desktop mouse.
   * ---------------------------------------------------------------- */
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    // Playwright's default is already a fine pointer, but state it: the whole
    // layer is gated on it, and a default that changes would turn every
    // assertion below into a silent pass.
    hasTouch: false,
    isMobile: false,
  });
  const page = await ctx.newPage();
  await page.goto(ORIGIN, { waitUntil: "networkidle" });

  const CARD = "[data-sheen]:not([data-sheen='dark'])";
  const PHOTO = "[data-parallax]";
  const GLOW = "[data-pointer-glow]";

  // The resting state is measured BEFORE the mouse has ever moved. There is no
  // "off-page" position available to `mouse.move` — every coordinate in the
  // viewport is over the document, so moving anywhere lights the glow. The
  // only true rest is the state the reader meets on arrival, which is also the
  // state that matters: a page that is already lit before it is touched is the
  // toy-like anti-reference.
  await page.waitForTimeout(400);

  const restCard = await transformOf(page, CARD);
  const restPhoto = await transformOf(page, `${PHOTO} > img`);
  const restGlow = await page.$eval(GLOW, (el) => getComputedStyle(el).opacity);

  check(IDENTITY.has(restCard), "a card rests at its identity transform", restCard);
  check(IDENTITY.has(restPhoto), "a photo rests at its identity transform", restPhoto);
  check(Number(restGlow) === 0, "the glow is fully transparent at rest", restGlow);

  /* ---------------------------------------------------------------- *
   * 2. Hovering a card lifts it and places its sheen under the pointer.
   * ---------------------------------------------------------------- */
  const cardProbe = await probePoint(page, page.locator(CARD).first(), 0.25, 0.7);
  await page.mouse.move(cardProbe.x, cardProbe.y);
  await page.waitForTimeout(500);

  const liftedCard = await transformOf(page, CARD);
  check(!IDENTITY.has(liftedCard), "a hovered card lifts", liftedCard);

  const pos = await sheenPos(page, CARD);
  check(pos.mx !== "" && pos.my !== "", "the hovered card receives pointer coordinates",
    JSON.stringify(pos));
  // ~25% / ~70%, with a couple of points of slack for borders and rounding.
  const mxNum = parseFloat(pos.mx);
  const myNum = parseFloat(pos.my);
  check(Math.abs(mxNum - 25) < 6, "the sheen tracks the pointer horizontally", pos.mx);
  check(Math.abs(myNum - 70) < 6, "the sheen tracks the pointer vertically", pos.my);

  /* ---------------------------------------------------------------- *
   * 3. Hovering a photo moves the picture, never the frame.
   *
   * This is the pairing that makes it read as depth. If the frame moves too,
   * the whole element wobbles and the effect looks like a bug.
   * ---------------------------------------------------------------- */
  // A photo that is NOT nested inside a lifted frame. The hero picture sits in
  // a `data-lift` card, so hovering it legitimately raises its parent by 3px
  // and "the frame did not move" is false for a reason that is not a bug —
  // the two effects are simply composing as designed. `:not()` on the ancestor
  // keeps this probe measuring the one thing it is about.
  const STANDALONE = "[data-parallax]:not([data-lift] [data-parallax]):not([data-lift])";
  const photo = page.locator(STANDALONE).first();
  const photoProbe = await probePoint(page, photo, 0.2, 0.3);
  const frameBefore = photoProbe.box;
  await page.mouse.move(photoProbe.x, photoProbe.y);
  await page.waitForTimeout(600);

  const movedPhoto = await transformOf(page, `${STANDALONE} > img`);
  check(!IDENTITY.has(movedPhoto), "the picture moves inside its frame", movedPhoto);

  const frameAfter = await photo.boundingBox();
  const framePut =
    Math.abs(frameAfter.x - frameBefore.x) < 0.5 &&
    Math.abs(frameAfter.y - frameBefore.y) < 0.5 &&
    Math.abs(frameAfter.width - frameBefore.width) < 0.5 &&
    Math.abs(frameAfter.height - frameBefore.height) < 0.5;
  check(framePut, "the frame itself does not move",
    `${JSON.stringify(frameBefore)} -> ${JSON.stringify(frameAfter)}`);

  /* ---------------------------------------------------------------- *
   * 4. The glow lights and follows.
   * ---------------------------------------------------------------- */
  await page.mouse.move(700, 400);
  await page.waitForTimeout(600);
  const litGlow = await page.$eval(GLOW, (el) => getComputedStyle(el).opacity);
  check(Number(litGlow) > 0.5, "the glow lights while the pointer is on the page", litGlow);

  const at700 = await page.$eval("[data-pointer-field]", (el) => el.style.getPropertyValue("--px"));
  await page.mouse.move(300, 400);
  await page.waitForTimeout(300);
  const at300 = await page.$eval("[data-pointer-field]", (el) => el.style.getPropertyValue("--px"));
  check(at700 !== at300 && at700 !== "" && at300 !== "",
    "the glow follows the pointer", `${at700} -> ${at300}`);

  /* ---------------------------------------------------------------- *
   * 5. Everything returns to rest.
   * ---------------------------------------------------------------- */
  // 4px from the left edge: inside the viewport, but in the page's margin and
  // so off every card and photo. The glow stays lit — correctly, the pointer
  // is still on the page — but every element-local effect must release.
  await page.mouse.move(4, 400);
  await page.waitForTimeout(700);
  const backCard = await transformOf(page, CARD);
  const backPhoto = await transformOf(page, `${STANDALONE} > img`);
  check(IDENTITY.has(backCard), "the card returns to rest", backCard);
  check(IDENTITY.has(backPhoto), "the photo returns to rest", backPhoto);

  await ctx.close();

  /* ---------------------------------------------------------------- *
   * 6. Reduced motion: the layer is inert.
   * ---------------------------------------------------------------- */
  const calm = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    reducedMotion: "reduce",
  });
  const calmPage = await calm.newPage();
  await calmPage.goto(ORIGIN, { waitUntil: "networkidle" });

  const calmProbe = await probePoint(calmPage, calmPage.locator(CARD).first(), 0.5, 0.5);
  await calmPage.mouse.move(calmProbe.x, calmProbe.y);
  await calmPage.waitForTimeout(600);

  const calmCard = await transformOf(calmPage, CARD);
  check(IDENTITY.has(calmCard), "reduced motion: a hovered card does not lift", calmCard);

  const calmGlow = await calmPage.$eval(GLOW, (el) => getComputedStyle(el).display);
  check(calmGlow === "none", "reduced motion: the glow is not rendered", calmGlow);

  // Hover a photo too, not just read the one the card probe happened to leave
  // alone: the parallax is a separate rule and needs its own pointer.
  const calmPhotoProbe = await probePoint(calmPage, calmPage.locator(STANDALONE).first(), 0.2, 0.3);
  await calmPage.mouse.move(calmPhotoProbe.x, calmPhotoProbe.y);
  await calmPage.waitForTimeout(600);
  const calmPhoto = await transformOf(calmPage, `${STANDALONE} > img`);
  check(IDENTITY.has(calmPhoto), "reduced motion: the picture does not move", calmPhoto);

  await calm.close();

  /* ---------------------------------------------------------------- *
   * 7. Touch: the layer does not exist.
   *
   * Not merely "does not fire" — the glow must not paint a full-viewport
   * layer on a device that can never light it.
   * ---------------------------------------------------------------- */
  const phone = await browser.newContext(devices["iPhone 13"]);
  const phonePage = await phone.newPage();
  await phonePage.goto(ORIGIN, { waitUntil: "networkidle" });

  const phoneGlow = await phonePage.$eval(GLOW, (el) => getComputedStyle(el).display);
  check(phoneGlow === "none", "touch: the glow is not rendered", phoneGlow);

  // The page must still be the document it was: tapping a card must not leave
  // it stuck in a lifted state, which is what a hover rule does on touch.
  await phonePage.locator(CARD).first().tap();
  await phonePage.waitForTimeout(500);
  const tapped = await transformOf(phonePage, CARD);
  check(IDENTITY.has(tapped), "touch: a tapped card does not stick lifted", tapped);

  await phone.close();
  await browser.close();

  /* ---------------------------------------------------------------- */
  for (const n of notes) console.log(n);
  if (failures.length) {
    console.error(`\n${failures.length} failure(s):`);
    for (const f of failures) console.error(f);
    process.exit(1);
  }
  console.log(`\npointer-sweep: ${notes.length} checks passed.`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
