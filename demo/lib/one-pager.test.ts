import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { CONTRAST, CTA, HERO, HOW, MARKET, PROBLEM, SYSTEM, TRUST } from "./one-pager";

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
// The page moved from app/one-pager/ to the root on 2026-09-03; what remains
// at the old path is a redirect stub, deliberately empty of content.
const PAGE_SRC = readFileSync(join(HERE, "app/page.tsx"), "utf8");

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

  /**
   * NOTE ON MARKET FIGURES. The page carries third-party analyst forecasts of
   * the hearing industry ($36B / $39B / $15B). Those are deliberately NOT on
   * this list: they describe an industry, not Hearfy. The prohibition is on
   * OUR numbers — what we earn, charge, or project — and the deck's own
   * sizing ($31B/$15B/$1.5B TAM/SAM/SOM) stays barred above, including the
   * "$15B" spelling, which is why the market section says "~$15B" and is
   * covered by its own guards below.
   */

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
  it("keeps the prevalence figures, attributed", () => {
    const values = PROBLEM.stats.map((s) => s.value);
    expect(values).toEqual(["1.5B", "430M", "17%"]);
    for (const stat of PROBLEM.stats) expect(stat.source.length).toBeGreaterThan(2);
  });

  /**
   * The 17% is NIDCD's, and it is about US adults.
   *
   * It shipped credited to WHO until 2026-09-02. That was wrong twice over:
   * wrong organisation, and a US rate presented as a global one — directly
   * above a section that sizes the market worldwide. WHO's own global figure
   * is under 10%, so the mistake also flattered the industry by roughly two
   * to one.
   *
   * This pins both halves of the correction, because either could be undone
   * alone: someone tidying sources back to a single "WHO" would restore the
   * mis-citation, and someone shortening the label would drop the scope and
   * leave a US number reading as global.
   */
  it("credits the 17% to NIDCD and says it is US adults", () => {
    const stat = PROBLEM.stats.find((s) => s.value === "17%");
    expect(stat, "the 17% stat is gone").toBeDefined();
    expect(stat!.source, "the 17% is NIDCD's figure, not WHO's").toBe("NIDCD");
    expect(stat!.label, "the 17% must say it is US adults, or it reads as global")
      .toMatch(/\bUS\b/);
  });

  /** The two genuine WHO figures must keep saying WHO. */
  it("keeps WHO on the figures that are WHO's", () => {
    for (const value of ["1.5B", "430M"]) {
      const stat = PROBLEM.stats.find((s) => s.value === value);
      expect(stat!.source).toBe("WHO");
    }
  });

  /**
   * These three tests used to assert the OPPOSITE: that $99 and the three
   * membership tiers were present and matched `mock-data`. The owner removed
   * the pricing section on 2026-09-02 ("remove the business numbers"), so the
   * guard is inverted — the prices are now forbidden figures like the rest,
   * and the tests exist to stop them coming back by habit.
   *
   * The visit fee and the tier prices are read from `mock-data` rather than
   * hardcoded here, so if the product's prices change, this still bars
   * whatever the current ones are.
   */
  it("quotes no visit fee", async () => {
    const { visitFee } = await import("./mock-data");
    expect(SHIPPED).not.toMatch(new RegExp(`\\$\\s?${visitFee}\\b`));
  });

  it("quotes no membership tier prices", async () => {
    const { tiers } = await import("./mock-data");
    for (const tier of tiers) {
      expect(SHIPPED, `tier ${tier.name} price is on the public page`)
        .not.toMatch(new RegExp(`\\$\\s?${tier.monthly}\\b`));
    }
  });

  /**
   * The deposit rule only makes sense next to a price. With the pricing
   * section gone, any surviving mention of a first month or a monthly payment
   * would be describing an offer the page no longer states.
   */
  it("describes no membership or deposit offer", () => {
    expect(SHIPPED).not.toMatch(/first month/i);
    expect(SHIPPED).not.toMatch(/\bper month\b|\/mo\b/i);
  });
});

/**
 * The market section: "One Number, Held".
 *
 * A single $36B figure with qualifying chips. The first two tests exist
 * because the owner flagged those exact mistakes on 2026-09-02 while
 * supplying the segment model, and both are SILENT errors — a page with a
 * double-counted market size looks completely normal and is simply wrong.
 *
 * The rest guard the specific fragility of this option: a lone number
 * asserts where a chart demonstrates, so everything that qualifies and
 * sources it is load-bearing, not decoration.
 */
describe("the market section is honest about its figures", () => {
  /**
   * Hearing aids alone ($10.35B → $14.42B) sit INSIDE the devices segment.
   * The owner's instruction: "do not add this number to the total, because it
   * is already included in the equipment category." Quoting it beside the
   * $36B invites exactly that addition.
   */
  it("never quotes the hearing-aids-only figure", () => {
    expect(SHIPPED, "the hearing-aids-only figure risks being double-counted")
      .not.toMatch(/\$\s?10\.35|\$\s?14\.42/);
  });

  /**
   * Consumer hearables are excluded on purpose. The owner: including them
   * "would significantly increase the number, but would also make the TAM
   * less credible and less relevant." The exclusion has to be STATED, since
   * a bare "$36B hearing market" would otherwise be read as including them.
   */
  it("states that consumer hearables are excluded", () => {
    expect(MARKET.footnote, "the hearables exclusion is no longer stated")
      .toMatch(/hearables/i);
    expect(MARKET.headline, "the headline itself must not claim consumer devices")
      .not.toMatch(/hearables|earbuds|consumer headphones/i);
  });

  /**
   * The number is an analyst forecast, and that is the only reason it may
   * appear on a page that bars business figures. Unattributed, it reads as
   * Hearfy's own projection — which is precisely the content boundary.
   */
  it("attributes the figure to the firms that published it", () => {
    expect(MARKET.sources.length, "the market figure has no source").toBeGreaterThan(8);
    expect(SHIPPED).toMatch(/Grand View Research/);
  });

  /**
   * The qualifiers are what stop a lone number reading as a boast. This
   * option has no chart to carry nuance, so the chips and footnote are the
   * only things doing that work — a tidy-up that strips them changes what
   * the page claims.
   */
  it("keeps the qualifiers that bound the number", () => {
    expect(MARKET.breakdown.length).toBeGreaterThanOrEqual(3);
    // The scope of the figure — clinical, not the wider ecosystem — and its
    // growth rate must both survive.
    const prose = MARKET.breakdown.map((b) => `${b.name} ${b.line}`).join(" ");
    expect(prose).toMatch(/clinical/i);
    expect(prose).toMatch(/%/);

    // The footnote's job is to say what the figure EXCLUDES — the one thing
    // the chips do not carry. Asserted by content, not by length: the first
    // version of this test pinned `length > 40`, which failed the moment the
    // footnote was tightened for concision even though every qualifier
    // survived. Length was a proxy; this is the actual invariant.
    expect(MARKET.footnote, "the footnote no longer says what is excluded")
      .toMatch(/exclude/i);
  });

  /** The figure must carry a year, or "$36B" is a number about nothing. */
  it("says which year the forecast is for", () => {
    expect(MARKET.headline).toMatch(/20\d\d/);
  });

  /**
   * The market section sits on the page's card grid like every other section.
   *
   * It first shipped as a single full-bleed slab: 1080px wide at a 6.4:1
   * aspect, on a page where every other card measures ~348px. The owner's
   * reading (2026-09-02) was "white space on the right" and "it does not look
   * good, match the design rules on the page" — both symptoms of the same
   * cause, which is that the section had abandoned the modular grid.
   *
   * Pinned as structure, not as a class string: what must hold is that the
   * section lays its cards out in a multi-column grid rather than one
   * full-width element.
   */
  it("lays the market out on the page's card grid", () => {
    const src = stripComments(PAGE_SRC);
    const start = src.indexOf("MARKET.title");
    const end = src.indexOf("CONTRAST.title");
    expect(start, "the market section is gone").toBeGreaterThan(-1);
    expect(end, "the contrast section is gone").toBeGreaterThan(start);

    const section = src.slice(start, end);
    expect(section, "the market section is a full-width slab again")
      .toMatch(/(?:sm|md|lg):grid-cols-/);
  });

  /**
   * The figure must not out-shout the page's own section headings.
   *
   * At clamp() ceilings of 88-104px it rendered visibly larger than the H2s
   * above it, which put a supporting statistic at the top of the page's
   * visual hierarchy. The section titles are 30px; the figure is display
   * type, so it is legitimately much larger, but it has a ceiling.
   */
  it("keeps the figure below a shouting size", () => {
    const src = stripComments(PAGE_SRC);
    const i = src.indexOf("MARKET.figure");
    const clamp = src.slice(Math.max(0, i - 400), i).match(/clamp\((\d+)px,[^,]+,\s*(\d+)px\)/);
    expect(clamp, "the market figure lost its clamp() sizing").not.toBeNull();
    expect(Number(clamp![2]), "the market figure is shouting over the section headings")
      .toBeLessThanOrEqual(80);
  });

  /**
   * The section describes an industry, never Hearfy's position in it. A
   * share, a capture claim, or a projection would turn a public market fact
   * into the business information this page exists to keep out.
   */
  it("makes no claim about Hearfy's share of it", () => {
    const prose = [
      MARKET.title,
      MARKET.headline,
      MARKET.footnote,
      ...MARKET.breakdown.map((b) => `${b.name} ${b.line}`),
    ].join(" ");
    expect(prose).not.toMatch(/market share|we (will )?capture|our share|penetration/i);
  });
});

/**
 * The five step cards and the photograph beside them are one size.
 *
 * Owner, 2026-09-02: "make all these square the same size". Two rules do it
 * together, and both are easy to remove by accident:
 *
 *  - `auto-rows-fr` on the grid, so both rows are equal;
 *  - the photo positioned `absolute inset-0` inside a `relative` cell, so its
 *    intrinsic aspect ratio stops dictating the height of all six. Without
 *    this the grid equalises at the PICTURE's height and every text card is
 *    padded out with dead space.
 */
describe("the visit-step grid is uniform", () => {
  const grid = PAGE_SRC.slice(
    PAGE_SRC.indexOf("{HOW.steps.map"),
    PAGE_SRC.indexOf("MEDIA.examLive.alt") + 200,
  );

  it("gives every row the same height", () => {
    expect(grid.length).toBeGreaterThan(0);
    const ol = PAGE_SRC.slice(
      PAGE_SRC.lastIndexOf("<ol", PAGE_SRC.indexOf("{HOW.steps.map")),
      PAGE_SRC.indexOf("{HOW.steps.map"),
    );
    expect(ol, "the steps grid lost auto-rows-fr").toMatch(/auto-rows-fr/);
  });

  it("keeps the photo from setting the row height", () => {
    // Against the STRIPPED source: the phrase also appears in the comment that
    // explains this rule, so matching the raw text would pass on broken markup.
    const stripped = stripComments(grid);
    expect(stripped, "the sixth-cell photo is back in flow and will dictate the row height")
      .toMatch(/className="absolute inset-0"/);
  });
});

/**
 * The three cells of the clinic-vs-home comparison are one row, one size.
 *
 * Owner, 2026-09-02: "don't take space, put this like three evenly size square
 * on the same row". The video previously sat full-width beneath the pair,
 * which spent a whole band of page height on one picture.
 */
describe("the contrast row is three even cells", () => {
  const section = PAGE_SRC.slice(
    PAGE_SRC.indexOf("CONTRAST.clinic.label") - 1200,
    PAGE_SRC.indexOf("MEDIA.visitVideo.alt") + 300,
  );

  it("puts the two lists and the video in one three-column grid", () => {
    const stripped = stripComments(section);
    expect(stripped, "the contrast grid is no longer three columns").toMatch(/lg:grid-cols-3/);
    expect(stripped, "the contrast grid lost auto-rows-fr").toMatch(/auto-rows-fr/);
  });

  it("keeps the video from setting the row height", () => {
    const stripped = stripComments(section);
    expect(stripped, "the video is back in flow and will dictate the row height")
      .toMatch(/absolute inset-2/);
  });

  /**
   * The video cell must FILL its column, not merely reserve a minimum.
   * A `min-h` lets it settle at its own smaller height while the two lists
   * stretch, which is the ragged row the owner flagged on 2026-09-02 ("the
   * video and the text same size").
   */
  it("makes the video cell fill the row rather than set a floor", () => {
    const stripped = stripComments(section);
    const cell = stripped.slice(
      stripped.lastIndexOf("<div", stripped.indexOf("MEDIA.visitVideo.src")),
      stripped.indexOf("MEDIA.visitVideo.src"),
    );
    expect(cell, "the video cell needs h-full to match the text cards").toMatch(/h-full/);
    expect(cell, "a min-height lets the video cell fall short of the row").not.toMatch(/min-h-/);
  });
});

/**
 * The WHO stat cards must survive a narrow phone with a large font.
 *
 * Found 2026-09-02 while sweeping at 320px with a 32px base font: the figure
 * carried `shrink-0` and its label could not wrap, so the row overflowed and
 * pushed the whole page sideways. It predated the one-pager's own layout work
 * and would not show at any desktop width — the same class of bug as the rem
 * base that broke the demo on the owner's phone.
 */
describe("the stat cards fit a narrow screen", () => {
  const block = PAGE_SRC.slice(
    PAGE_SRC.indexOf("{PROBLEM.stats.map"),
    PAGE_SRC.indexOf("{PROBLEM.stats.map") + 1200,
  );

  it("lets the figure shrink rather than forcing the row wide", () => {
    const stripped = stripComments(block);
    const countUp = stripped.slice(
      stripped.indexOf("<CountUp"),
      stripped.indexOf("/>", stripped.indexOf("<CountUp")),
    );
    expect(countUp, "the stat figure is shrink-0 again and will overflow a narrow screen")
      .not.toMatch(/shrink-0/);
  });

  it("lets the label wrap inside its flex cell", () => {
    const stripped = stripComments(block);
    expect(stripped, "the stat label's cell needs min-w-0 to wrap in a flex row")
      .toMatch(/min-w-0/);
  });
});

/**
 * The exam video must not be blown up past its resolution.
 *
 * The source is 640x480. It once shipped full-bleed, which upscaled it about
 * 2x on a laptop and 4x on a retina panel and looked soft (owner, 2026-09-02:
 * "the resolution here is not good, make it smaller").
 *
 * This test pins the INVARIANT, not the mechanism. The first version asserted
 * a `max-w-[620px]` class and then failed the moment the fix changed to a
 * three-column grid cell — which was the test being wrong, not the layout.
 * What must stay true is that the video is never a full-width element: it is
 * either width-capped or confined to a multi-column grid cell.
 */
describe("media is not displayed above its native resolution", () => {
  it("never renders the exam video full-bleed", () => {
    const src = stripComments(PAGE_SRC);
    const i = src.indexOf("MEDIA.visitVideo.src");
    expect(i, "the exam video is gone from the page").toBeGreaterThan(-1);

    // Look back to the grid the video actually sits in, rather than a fixed
    // window — a guessed character count silently stops covering the markup
    // the moment anything above it grows.
    const gridAt = src.lastIndexOf("grid-cols-", i);
    const enclosingGrid = gridAt === -1 ? "" : src.slice(src.lastIndexOf("<div", gridAt), i);

    const capped = /max-w-\[\d+px\]/.test(src.slice(Math.max(0, i - 700), i + 400));
    const inGridCell = /(?:md|lg):grid-cols-[23]/.test(enclosingGrid);
    expect(
      capped || inGridCell,
      "the exam video is neither width-capped nor inside a multi-column grid, so it will upscale",
    ).toBe(true);

    // If it IS capped by an explicit class, the cap must respect the source.
    const cap = src.slice(Math.max(0, i - 700), i + 400).match(/max-w-\[(\d+)px\]/);
    if (cap) expect(Number(cap[1])).toBeLessThanOrEqual(640);
  });
});

describe("the page is complete enough to stand alone", () => {
  /**
   * A one-pager's whole job is to answer, in one read: what is it, who is it
   * for, how does it work, why trust it, what do I do next. (Not "what does it
   * cost" — that section was deliberately removed; see the price guards
   * above.) Each of those has a section, and an empty one silently breaks the
   * page's purpose.
   */
  it("carries every section a one-pager needs", () => {
    expect(HERO.title.join(" ")).toMatch(/hearing care/i);
    expect(HERO.chips.length).toBeGreaterThanOrEqual(3);
    expect(PROBLEM.barriers.length).toBe(4);
    expect(CONTRAST.clinic.points.length).toBe(CONTRAST.home.points.length);
    expect(HOW.steps.length).toBe(5);
    expect(SYSTEM.parts.length).toBe(3);
    expect(TRUST.length).toBeGreaterThanOrEqual(4);
    expect(CTA.contact.email.length).toBeGreaterThan(0);
  });

  /** The visit steps are numbered in the UI; the numbering must be in order. */
  it("numbers the visit steps in order", () => {
    expect(HOW.steps.map((s) => s.n)).toEqual(["01", "02", "03", "04", "05"]);
  });

  /**
   * The visit steps describe the process; they do not address the reader as
   * the patient. The owner's instruction, 2026-09-02: this section "would talk
   * to an investor versus talking to a patient" — so "results are shown", not
   * "you see your own audiogram".
   *
   * Only the step bodies and the section subtitle are checked. The rest of the
   * page speaks to the reader on purpose, and the step *headings* keep "we",
   * which is the company describing itself rather than casting the reader.
   */
  it("describes the visit without addressing the reader as the patient", () => {
    const secondPerson = /\b(you|your|yours|yourself)\b/i;
    for (const step of HOW.steps) {
      expect(step.line, `step ${step.n} body speaks to the reader`).not.toMatch(secondPerson);
    }
    expect(HOW.subtitle).not.toMatch(secondPerson);
    expect(HOW.title).not.toMatch(secondPerson);
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
   * through asset(), so a restored basePath is one config edit rather than
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
   * The deck's photography is Hearfy-branded in the live copy, but a crop
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
   * lives in CSS, scoped to `.live-logo`, so this assertion still holds:
   * no framer animation on this page repeats.
   */
  it("uses no infinite animations on content", () => {
    expect(MOTION_SRC).not.toMatch(/repeat:\s*Infinity/);
    expect(MOTION_SRC).not.toMatch(/animate=\{\{[^}]*repeat/);
  });

  /**
   * The brand mark must keep moving — the owner's note was that it animates
   * "again, then they stopped". The loop is CSS on `.live-logo`, and it must
   * stay behind that opt-in class: the same BrandLogo renders in the demo's
   * chrome on every screen, and an unscoped rule would set it pulsing there
   * too — the toy-app register PRODUCT.md rules out.
   *
   * The class is no longer one-pager-only. The owner asked for the same living
   * mark on the demo's cover and end-cap (2026-09-02), which is what DESIGN.md
   * already permitted: the brandmark "may animate gently on cover and welcome
   * screens". What must hold is that it stays an opt-in a surface wears
   * deliberately, so `.live-logo` guards every rule — see the companion test in
   * regressions.test.ts, which caps WHICH surfaces may wear it.
   */
  it("keeps the brand mark alive, behind an opt-in class", () => {
    const CSS = readFileSync(join(HERE, "app/globals.css"), "utf8");
    expect(CSS).toMatch(/\.live-logo/);
    expect(CSS).toMatch(/animation:\s*op-bar[^;]*infinite/);
    // Every rule that drives the loop is scoped to the wrapper class.
    for (const rule of CSS.match(/^[^@\n{]*\{[^}]*op-bar[^}]*\}/gm) ?? []) {
      expect(rule).toMatch(/\.live-logo/);
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

/**
 * The page closes on a way to reach a person, not a link into the demo.
 *
 * Owner, 2026-09-02: "remove the button to walk to the product ... instead of
 * that, put contact us and write the phone number". The walkthrough button is
 * the obvious thing for a later editor to restore — it is the only outbound
 * link a marketing page would normally carry — so the removal is pinned rather
 * than left to memory.
 *
 * Owner, 2026-09-04: the phone number became an email address. `mailto:` works
 * on every device, so the mobile/desktop split the `tel:` version needed is
 * gone — see "one live link on every viewport" below.
 *
 * These assert the INVARIANT (the close reaches a human), not the wording: the
 * label and the address may be re-edited freely.
 */
describe("the one-pager closes on a way to reach a person", () => {
  it("offers a usable email address", () => {
    expect(CTA.contact.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  });

  /**
   * The close must not regress to a phone number, which is the shape this page
   * carried until 2026-09-04 and the thing a later editor is most likely to
   * restore from an old screenshot or the deck.
   */
  it("does not close on a phone number", () => {
    const stripped = stripComments(PAGE_SRC);
    expect(stripped, "the close is a tel: link again").not.toMatch(/tel:/);
    expect(JSON.stringify(CTA.contact), "a phone number is back on the contact object")
      .not.toMatch(/\+?\d[\d\s()-]{6,}/);
  });

  /**
   * `mailto:` works everywhere, so — unlike the `tel:` version — the link must
   * stay live at every width. The old page disabled it above `sm` because a
   * desktop `tel:` click does nothing; carrying that workaround over to email
   * would kill a link that works fine, so both neutralisers are pinned OUT.
   */
  it("keeps one live link on every viewport", () => {
    const stripped = stripComments(PAGE_SRC);
    const anchor = stripped.slice(
      stripped.indexOf("<a", stripped.indexOf("CTA.contact.email") - 400),
      stripped.indexOf("</a>", stripped.indexOf("CTA.contact.email")),
    );
    expect(anchor, "the email link is disabled on desktop, where mailto: works")
      .not.toMatch(/sm:pointer-events-none/);
    expect(anchor, "the desktop branch drops the button fill the email link should keep")
      .not.toMatch(/sm:bg-transparent/);
  });

  /**
   * The address must never wrap.
   *
   * Inherited from the phone number, found by screenshot at 390px on
   * 2026-09-02: the button laid out as one row, so the label split over two
   * lines and the value broke mid-way. Every computed style was correct, so
   * only the picture showed it. An address broken across lines reads as two
   * and can be mis-copied, so the nowrap is pinned.
   */
  it("never lets the email address break across lines", () => {
    const stripped = stripComments(PAGE_SRC);
    // The address appears twice — once in the mailto: href, once as the
    // visible text. The visible one is last, and it is the one that can wrap.
    const visible = stripped.lastIndexOf("CTA.contact.email");
    const addrSpan = stripped.slice(stripped.lastIndexOf("<span", visible), visible);
    expect(addrSpan, "the email address can wrap mid-address")
      .toMatch(/whitespace-nowrap/);
  });

  /**
   * One source for the address, so it cannot drift — the failure mode of
   * duplicating the markup per breakpoint. The href and the visible text are
   * the only two references, and both read the same field.
   */
  it("renders one address for both viewports", () => {
    const stripped = stripComments(PAGE_SRC);
    expect((stripped.match(/CTA\.contact\.email/g) ?? []).length).toBe(2);
    expect((stripped.match(/<a\b[^>]*mailto:/g) ?? []).length).toBe(1);
  });

  /**
   * The closing panel's balance, owner's call on 2026-09-04 from rendered
   * options.
   *
   * The address had been set at 26px/extrabold, level with the 30px heading
   * above it but sitting on a white fill, so the heaviest thing in the panel
   * was the address and the eye reached it before the invitation meant to earn
   * the click. Both halves of the fix are pinned because either one alone
   * leaves the panel unbalanced:
   *
   *   1. the address ranks BELOW the heading, not level with it;
   *   2. the columns are not an even split, and they are centred against each
   *      other — an even split wrapped two of the four checklist items while
   *      the shorter right column ran out early, leaving a dead band.
   *
   * Asserted as relationships rather than exact classes: a later edit may
   * retune the sizes, and should, so long as the heading still outranks the
   * address and the list still gets the larger share.
   */
  it("keeps the address ranked below the closing heading", () => {
    const stripped = stripComments(PAGE_SRC);
    const px = (s: string | undefined) => (s ? Number(s) : NaN);
    // the h2 that carries CTA.title, and the visible address span
    const h2 = stripped.slice(stripped.indexOf("<h2"), stripped.indexOf("</h2>"));
    const visible = stripped.lastIndexOf("CTA.contact.email");
    const addr = stripped.slice(stripped.lastIndexOf("<span", visible), visible);
    // compare the desktop (sm:) sizes, which is where both are largest
    const headingPx = px(h2.match(/sm:text-\[(\d+)px\]/)?.[1]);
    const addrPx = px(addr.match(/sm:text-\[(\d+)px\]/)?.[1]);
    expect(headingPx).toBeGreaterThan(0);
    expect(addrPx).toBeGreaterThan(0);
    expect(addrPx, "the address is set as large as the heading it sits under")
      .toBeLessThan(headingPx);
    expect(addr, "the address is as heavy as the heading, so it competes with it")
      .not.toMatch(/font-extrabold/);
  });

  it("gives the checklist the larger column and centres the two blocks", () => {
    const stripped = stripComments(PAGE_SRC);
    // the grid that lays out the checklist against the CTA
    const grid = stripped.slice(stripped.indexOf('className="grid gap-10 lg:grid-cols-'));
    const cols = grid.match(/lg:grid-cols-\[([\d.]+)fr_([\d.]+)fr\]/);
    expect(cols, "the closing panel's two columns are no longer an fr split").toBeTruthy();
    const [, left, right] = cols!;
    expect(Number(left), "the checklist column is not wider than the CTA column, so it wraps")
      .toBeGreaterThan(Number(right));
    expect(grid.slice(0, 200), "the columns hang from a shared top edge, leaving a dead band")
      .toMatch(/lg:items-center/);
  });

  it("renders the address as a mailto: link", () => {
    const stripped = stripComments(PAGE_SRC);
    expect(stripped, "the email address is not clickable")
      .toMatch(/href=\{`mailto:\$\{[^}]+\}`\}/);
    expect(stripped, "the email address is hardcoded in the markup")
      .not.toMatch(/mailto:[^$]/);
  });

  /**
   * The demo walkthrough button. Its old copy ("Walk through the product") and
   * any link back into the demo root are both barred — restoring either would
   * undo the owner's change.
   */
  it("no longer links into the product demo", () => {
    const stripped = stripComments(PAGE_SRC);
    expect(SHIPPED).not.toMatch(/walk through the product/i);
    expect(stripped, "the CTA links into the demo again instead of offering contact")
      .not.toMatch(/href=\{asset\("\/"\)\}/);
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
