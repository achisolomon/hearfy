import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { CONTRAST, CTA, HERO, HOW, OFFER, PROBLEM, SYSTEM, TRUST } from "./one-pager";

/**
 * The public one-pager must never carry business information.
 *
 * The owner's instruction on 2026-09-02: "do not use any numbers, like, no
 * business information that should not leak out." That is a property of the
 * page, not a one-time editing pass — someone will later be tempted to
 * "strengthen" the page with the market size or the growth curve, because
 * those are the most impressive numbers in the deck. This test is the thing
 * that stops it, so it asserts the invariant (no business figures reach the
 * public bundle) rather than the current wording.
 *
 * These tests read the SOURCE of both the content module and the page, so a
 * figure typed straight into the JSX is caught too — checking only the
 * exported strings would miss exactly the mistake most likely to happen.
 */

const HERE = join(__dirname, "..");
const CONTENT_SRC = readFileSync(join(HERE, "lib/one-pager.ts"), "utf8");
const PAGE_SRC = readFileSync(join(HERE, "app/one-pager/page.tsx"), "utf8");

/**
 * Only the parts a reader sees. The content module's own header documents the
 * forbidden figures in prose (that is the point of it), so scanning the whole
 * file would fail on its own warning label. Comments are stripped instead, and
 * `lib/one-pager.ts` is verified below to still carry that documentation.
 */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

const SHIPPED = stripComments(CONTENT_SRC) + "\n" + stripComments(PAGE_SRC);

describe("public one-pager carries no business information", () => {
  /**
   * Deck figures, by the section of the deck they come from. Each is a regex
   * so formatting variants ("$31B", "$31 B", "31 billion") are caught rather
   * than only the literal spelling used in the deck today.
   */
  const FORBIDDEN: Array<[string, RegExp]> = [
    // Slide 5 — market sizing.
    ["TAM $31B", /\$\s?31\s?B|31 billion/i],
    ["SAM $15B", /\$\s?15\s?B|15 billion/i],
    ["SOM $1.5B", /\$\s?1\.5\s?B|1\.5 billion/i],
    ["the sizing labels", /\bTAM\b|\bSAM\b|\bSOM\b/],
    ["the $1,100 patient journey", /\$\s?1,?100/],
    ["addressable-population counts", /28\.8\s?M|\b14M\b|14 million untreated/i],

    // Slide 16 — the financial curve and its outcome tiles.
    ["2031 revenue", /\$\s?100(\.4)?\s?M|100\.4/],
    ["the revenue curve", /\b1\.05\b|\b4\.7\b|\b14\.1\b|\b37\.7\b/],
    ["EBITDA", /EBITDA/i],
    ["the CMA headcount", /\b150\s+CMAs?\b/i],
    ["annual visit volume", /187,?200/],

    // Slide 17 — the raise.
    ["the $3M ask", /\$\s?3\s?M\b|\$3 million/i],
    ["the raise horizon", /18\s?[–-]\s?24 months/i],
    ["use-of-funds language", /use of funds|seed round|pre-money|valuation|runway/i],

    // Appendix — figures with no source anywhere. Never public, never quoted.
    ["per-device gross profit", /\$\s?915/],
    ["CMA revenue share", /\$\s?70\b/],
    ["the device conversion rate", /30\s?%\s*(device\s*)?conversion/i],
    ["the supervision ratio", /1\s?:\s?6\b|up to 6 (concurrent|exams)/i],

    // The investor framing itself has no place on a consumer page.
    ["investor framing", /\binvestors?\b|\bpitch deck\b|\bcap table\b|\bARR\b|\bMRR\b/i],
  ];

  it.each(FORBIDDEN)("never ships %s", (_label, pattern) => {
    expect(SHIPPED).not.toMatch(pattern);
  });

  /**
   * The deck's team slide carries the founders by name. A consumer page has no
   * reason to, and the deck's version of it is investor material.
   */
  it("names no founders", () => {
    for (const name of ["Michael Kertes", "Eyal Nussbaum", "Achi Solomon"]) {
      expect(SHIPPED).not.toContain(name);
    }
  });

  /**
   * The competitive matrix is a positioning argument made to investors. Naming
   * competitors on a consumer page is both off-register and a legal edge.
   */
  it("names no competitors", () => {
    for (const rival of ["Yes Hearing", "hear.com", "Costco"]) {
      expect(SHIPPED).not.toContain(rival);
    }
  });
});

describe("the content the page is allowed to carry", () => {
  /**
   * The WHO prevalence figures are public-health statistics and are the public
   * case for the product. They must survive — a future tidy-up that strips
   * every number would gut the problem section, so the allowance is pinned as
   * deliberately as the prohibitions.
   */
  it("keeps the WHO prevalence figures, attributed", () => {
    const values = PROBLEM.stats.map((s) => s.value);
    expect(values).toEqual(["1.5B", "430M", "17%"]);
    for (const stat of PROBLEM.stats) expect(stat.source).toBe("WHO");
  });

  /**
   * $99 is the consumer-facing visit price and is already public in the
   * shipped demo (lib/mock-data.ts). The one-pager must agree with the product
   * rather than drift from it, so the price is asserted against that source.
   */
  it("quotes the same visit fee as the product", async () => {
    const { visitFee } = await import("./mock-data");
    expect(OFFER.price).toBe(`$${visitFee}`);
  });

  it("quotes the same membership tiers as the product", async () => {
    const { tiers } = await import("./mock-data");
    const shown = OFFER.tiers.map((t) => `${t.name} ${t.price}`);
    const real = tiers.map((p) => `${p.name} $${p.monthly}`);
    expect(shown).toEqual(real);
  });

  /**
   * The deposit rule (spec §9a) is the reason the visit can be described as
   * costing nothing if the patient goes ahead. Stating the price without it
   * would misrepresent the offer, so both halves must be present.
   */
  it("states the deposit rule alongside the price", () => {
    expect(OFFER.deposit).toMatch(/first month/i);
    expect(OFFER.deposit).toMatch(/\$99/);
  });
});

describe("the page is complete enough to stand alone", () => {
  /**
   * A one-pager's whole job is to answer, in one read: what is it, who is it
   * for, how does it work, what does it cost, what do I do next. Each of those
   * has a section, and an empty one silently breaks the page's purpose.
   */
  it("carries every section a one-pager needs", () => {
    expect(HERO.title.join(" ")).toMatch(/hearing care/i);
    expect(HERO.chips.length).toBeGreaterThanOrEqual(3);
    expect(PROBLEM.barriers.length).toBe(4);
    expect(CONTRAST.clinic.points.length).toBe(CONTRAST.home.points.length);
    expect(HOW.steps.length).toBe(5);
    expect(SYSTEM.parts.length).toBe(3);
    expect(OFFER.included.length).toBeGreaterThanOrEqual(4);
    expect(TRUST.length).toBeGreaterThanOrEqual(4);
    expect(CTA.action.length).toBeGreaterThan(0);
  });

  /** The visit steps are numbered in the UI; the numbering must be in order. */
  it("numbers the visit steps in order", () => {
    expect(HOW.steps.map((s) => s.n)).toEqual(["01", "02", "03", "04", "05"]);
  });

  /**
   * The brand name is expected to change again (it has twice). Every visible
   * instance must come from BRAND_NAME, so a rename stays a one-line edit.
   */
  it("hardcodes no brand name in the content", () => {
    for (const stale of ["HearMi", "RightHear"]) {
      expect(SHIPPED).not.toContain(stale);
    }
  });

  /**
   * The content module's header is what tells the next editor which figures
   * are forbidden and why. If it is deleted, this test's protection becomes
   * invisible folklore.
   */
  it("documents its own content boundary", () => {
    expect(CONTENT_SRC).toMatch(/no business information/i);
    expect(CONTENT_SRC).toMatch(/DELIBERATELY ABSENT/);
  });
});

describe("the page's media", () => {
  /**
   * Every media file the page references must actually exist in `public/`.
   * A static export does not fail on a missing image — it ships a broken
   * <img> — so the build cannot catch this and a test must.
   */
  it("ships every file it references", async () => {
    const { existsSync } = await import("node:fs");
    const { MEDIA } = await import("./one-pager");
    for (const item of Object.values(MEDIA)) {
      const files = "poster" in item ? [item.src, item.poster] : [item.src];
      for (const f of files) {
        expect(existsSync(join(HERE, "public", f)), `missing: ${f}`).toBe(true);
      }
    }
  });

  /**
   * Raw <img>/<video> URLs are NOT rewritten by Next, so every one must go
   * through asset() or it 404s under the /hearfy/ basePath in production
   * while working perfectly on localhost — a failure that only appears once
   * deployed. Asserted by checking no src is a bare string literal.
   */
  it("routes every media src through asset()", () => {
    const bare = PAGE_SRC.match(/src=\{?"\/(?!\/)/g);
    expect(bare, "a media src bypasses asset()").toBeNull();
  });

  /** Alt text must describe what is happening, not be empty or a filename. */
  it("gives every image meaningful alt text", async () => {
    const { MEDIA } = await import("./one-pager");
    for (const item of Object.values(MEDIA)) {
      expect(item.alt.length).toBeGreaterThan(20);
      expect(item.alt).not.toMatch(/\.(jpg|png|webp|mp4)/i);
    }
  });

  /**
   * The deck's photography is HearFy-branded in the live copy, but a crop
   * taken from an older render could carry the old name in shot. The page
   * must never ship one — and the brand-spelling guard above only reads
   * source text, not what is baked into a picture, so provenance is pinned
   * in the manifest's own documentation instead.
   */
  it("documents where the imagery came from", () => {
    expect(CONTENT_SRC).toMatch(/branded HEARFY/);
  });
});

describe("motion is calm and accessible", () => {
  const MOTION_SRC = readFileSync(join(HERE, "components/one-pager/motion.tsx"), "utf8");

  /**
   * PRODUCT.md's accessibility floor: prefers-reduced-motion must be
   * respected. Every animated primitive has to consult it — a new one that
   * forgets would animate for a viewer who asked it not to.
   */
  it("respects prefers-reduced-motion in every primitive", () => {
    const CSS = readFileSync(join(HERE, "app/globals.css"), "utf8");

    // Every primitive that animates must be guarded, but a primitive may be
    // guarded EITHER in JS (useReducedMotion) or in CSS (a media query) —
    // LiveBrandLogo animates purely in a stylesheet, so counting JS hooks
    // alone would fail it for using the better mechanism. What must hold is
    // that no animation anywhere is left unguarded.
    const jsGuards = (MOTION_SRC.match(/useReducedMotion\(\)/g) ?? []).length;
    const cssGuards = (CSS.match(/prefers-reduced-motion/g) ?? []).length;
    expect(jsGuards + cssGuards).toBeGreaterThanOrEqual(5);

    // Framer entrances: every whileInView must sit in a component that has
    // consulted useReducedMotion, so none can animate for a viewer who
    // asked it not to.
    const animated = (MOTION_SRC.match(/whileInView=/g) ?? []).length;
    expect(jsGuards).toBeGreaterThanOrEqual(Math.min(animated, 3));

    // And every CSS keyframe animation is inside a reduced-motion guard.
    const loops = (CSS.match(/animation:\s*op-[\w-]+/g) ?? []).length;
    if (loops) expect(CSS).toMatch(/prefers-reduced-motion:\s*no-preference/);
  });

  /**
   * Entrances only, for CONTENT. A loop on the copy or the cards is the
   * "toy-like consumer app" anti-reference PRODUCT.md rules out — it keeps
   * moving while the reader is trying to read.
   *
   * The one exception is the brand mark's sound bars, which breathe
   * continuously (the owner asked for a logo that does not stop). That loop
   * lives in CSS, scoped to `.op-live-logo`, so this assertion still holds:
   * no framer animation on this page repeats.
   */
  it("uses no infinite animations on content", () => {
    expect(MOTION_SRC).not.toMatch(/repeat:\s*Infinity/);
    expect(MOTION_SRC).not.toMatch(/animate=\{\{[^}]*repeat/);
  });

  /**
   * The brand mark must keep moving — the owner's note was that it animates
   * "again, then they stopped". The loop is CSS on `.op-live-logo`, and it
   * must stay scoped: the same BrandLogo renders in the demo's chrome on
   * every screen, and an unscoped rule would set it pulsing there too.
   */
  it("keeps the brand mark alive, scoped to this page", () => {
    const CSS = readFileSync(join(HERE, "app/globals.css"), "utf8");
    expect(CSS).toMatch(/\.op-live-logo/);
    expect(CSS).toMatch(/animation:\s*op-bar[^;]*infinite/);
    // Every rule that drives the loop is scoped to the wrapper class.
    for (const rule of CSS.match(/^[^@\n{]*\{[^}]*op-bar[^}]*\}/gm) ?? []) {
      expect(rule).toMatch(/\.op-live-logo/);
    }
    // And it is behind a reduced-motion guard.
    expect(CSS).toMatch(/prefers-reduced-motion:\s*no-preference/);
  });

  /** Reveals must fire once, or content re-animates when scrolled back past. */
  it("reveals content once", () => {
    const views = MOTION_SRC.match(/viewport=\{\{[^}]*\}\}/g) ?? [];
    expect(views.length).toBeGreaterThan(0);
    for (const v of views) expect(v).toMatch(/once:\s*true/);
  });

  /**
   * Videos must be muted, looping, and inline — browsers refuse to autoplay
   * anything else, so a missing attribute means a dead black box on mobile.
   */
  it("keeps autoplay video muted, looping and inline", () => {
    for (const attr of ["muted", "loop", "playsInline"]) {
      expect(MOTION_SRC).toContain(attr);
    }
  });

  /**
   * The count-up must land on the exact source string. Animating toward a
   * rounded value would let "17%" finish as "16.99%" — a fabricated figure,
   * which matters more here than anywhere because these are WHO statistics.
   */
  it("lands the counter on the exact quoted value", () => {
    expect(MOTION_SRC).toMatch(/setShown\(value\)/);
  });
});

describe("the page identifies no individual", () => {
  /**
   * The demo's personas are fictional. Naming one on a public marketing page
   * presents an invented clinician or patient as a real person — the owner's
   * decision on 2026-09-02 was to show the footage and name nobody.
   *
   * `reed-idle.mp4` / `reed-speaking.mp4` / `reed-poster.jpg` are barred by
   * file: the clip has "Dr. Susan Reed" legibly embroidered on the coat, so
   * the name ships inside the pixels where no text search would ever find it.
   */
  it("uses no footage with a name visible in shot", async () => {
    const { MEDIA } = await import("./one-pager");
    const used = Object.values(MEDIA).flatMap((m) =>
      "poster" in m ? [m.src, m.poster] : [m.src],
    );
    for (const file of used) expect(file).not.toMatch(/reed/i);
  });

  it("names no persona in the copy", () => {
    for (const name of ["Susan Reed", "Dr. Reed", "Alex Rivera", "Maya"]) {
      expect(SHIPPED).not.toContain(name);
    }
  });
});
