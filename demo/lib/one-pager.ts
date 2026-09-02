/**
 * The public one-pager's content, in one place.
 *
 * This page lives on the PUBLIC website, so its content boundary is not a
 * matter of taste. The owner's instruction on 2026-09-02 was explicit: "do not
 * use any numbers, like, no business information that should not leak out."
 * An investor one-pager carrying the real figures may follow later; it is a
 * different document and belongs in the private repo.
 *
 * WHAT IS DELIBERATELY ABSENT, and must not be added here:
 *   - TAM / SAM / SOM ($31B / $15B / $1.5B) and the $1,100 journey breakdown
 *   - the revenue and EBITDA curve (2027–2031) and the 2031 outcome tiles
 *   - the $3M raise, its horizon, and the use-of-funds split
 *   - CMA headcount, annual visit volume, and the supervision ratio
 *   - per-unit economics (device gross profit, conversion, CMA share) — these
 *     have no source at all; see the economics memory note
 *   - founder names and the investor-deck team slide
 *   - every price: the visit fee, the membership tiers, and any monthly figure
 * `lib/one-pager.test.ts` fails the build if any of them reappear.
 *
 * WHAT IS ALLOWED, and why:
 *   - the public-health prevalence figures (1.5B / 430M from WHO, 17% from
 *     NIDCD). These are published statistics, not Hearfy business
 *     information, and they are the public case for the product existing.
 *     The deck cites all three as WHO; the 17% is NIDCD's, for US adults
 *     only, and was corrected here on 2026-09-02 — see PROBLEM.stats.
 *   - third-party MARKET SIZE figures (see MARKET below). These are published
 *     analyst forecasts of an industry, not Hearfy's own numbers: they say how
 *     big hearing care is, never what Hearfy earns, charges, or projects. The
 *     forbidden list above is about OUR figures, and none of these are ours.
 *     Every one carries the firm that published it.
 *
 * NO PRICES. The page carried a pricing section — $99 for the visit and the
 * three membership tiers — on the reasoning that those are consumer-facing in
 * the shipped demo. The owner removed it on 2026-09-02: "remove the business
 * numbers". Every price is now a forbidden figure like the rest, and the whole
 * section went with them rather than leaving an empty frame. If pricing is
 * ever wanted back, it is a deliberate decision to re-open, not a tidy-up.
 *
 * Product substance is drawn from the founders' deck (slides 3, 4, 6, 7, 9,
 * 11) — the product story only, with every business slide left behind.
 *
 * VOICE, in `HOW` specifically. The owner's instruction, 2026-09-02: that
 * section "would talk to an investor versus talking to a patient", so it
 * describes the visit in the third person — "results are shown", not "you see
 * your own audiogram". A reader evaluating the business is watching a process
 * run; being addressed as the patient puts them in the wrong seat. The rest of
 * the page still speaks to the reader directly, which is deliberate: the hero
 * and the offer are an invitation, and `HOW` is a description.
 *
 * THE NAME. The company is written `Hearfy` — capital H, the rest lower case.
 * Every user-visible mention here interpolates BRAND_NAME rather than spelling
 * it out, so the page can never drift out of step with the wordmark the shell
 * renders. `lib/regressions.test.ts` fails the build on a literal.
 */

import { BRAND_NAME } from "./mock-data";

/** The masthead: what Hearfy is, in the deck's own words. */
export const HERO = {
  eyebrow: "Hearing care at home",
  title: ["Bringing hearing care", "home."],
  /** Slide 6's line, which is the whole thesis in one sentence. */
  thesis: "The operating platform for at-home hearing care.",
  lede:
    "A full diagnostic hearing exam, turning every home into a point of care. A Certified Medical Assistant brings the clinic-grade equipment to the patient; a licensed audiologist runs the exam live from their office. No booth, no waiting list, no trip across town.",
  chips: ["Private", "On demand", "Clinical-guided"],
};

/**
 * The problem, as the deck states it on slide 4 — WHO prevalence and the
 * adoption gap it implies. Public health figures, not company figures.
 */
export const PROBLEM = {
  title: "Most hearing loss goes untreated",
  stats: [
    { value: "1.5B", label: "people live with hearing loss", source: "WHO" },
    { value: "430M", label: "need rehabilitation today", source: "WHO" },
    /**
     * NIDCD, not WHO, and US adults, not the world.
     *
     * This shipped as a WHO figure until 2026-09-02. It is not one: 17% is
     * NIDCD's number for US adults aged 20-69 who could benefit from hearing
     * aids and have ever used them. WHO's global equivalent is far starker —
     * production meets under 10% of need worldwide, and about 3% in low- and
     * middle-income countries.
     *
     * The error mattered more than a stray label: the stat sits directly
     * above a section that sizes the market WORLDWIDE, so a US rate was
     * being read as a global one. The owner's call was to keep 17% and fix
     * the citation, so the label now says "US adults" in words — the source
     * pill alone would not stop the same misreading.
     */
    { value: "17%", label: "of US adults who need aids use them", source: "NIDCD" },
  ],
  /** Slide 4's four barriers — why the other 83% stay untreated. */
  barriersTitle: "What stops people",
  barriers: [
    { name: "Stigma", line: "Care that happens in public feels like an admission." },
    { name: "Availability", line: "Clinics are far, and the next opening is months out." },
    { name: "Cost", line: "The full journey runs well past what people expect." },
    { name: "Bureaucracy", line: "Referrals, paperwork, and repeat visits before anyone is helped." },
  ],
};

/**
 * The market, as a single held number — "One Number, Held".
 *
 * Chosen by the owner on 2026-09-02 from five rendered options (initially
 * "Where Hearfy Sits", changed the same day). The whole section is the
 * figure: no chart, no bars, no rings. It is the owner's own investor line —
 * "A $36B global hearing care market by 2030, growing at approximately 6%
 * annually" — rendered literally, and it is the fastest read on the page.
 *
 * THE FIGURES ARE THIRD-PARTY ANALYST FORECASTS, not Hearfy's. That is what
 * makes them publishable here at all; see the header's WHAT IS ALLOWED note.
 *
 * Because a lone number asserts rather than demonstrates, the qualifiers are
 * not optional decoration — the breakdown and the footnote are what keep it
 * from reading as a bare boast, and `sources` is what keeps it from reading
 * as Hearfy's own projection. A future edit that strips them for tidiness
 * turns a cited market fact into an unsourced claim on a public page.
 *
 * The owner's segment model, from which the $36B is cut:
 *
 *   Devices & equipment      $16.6B → $21.1B   6.2%
 *   Audiology services       $11.4B → $14.7B   6.6%
 *   Accessories & protection  ~$2.6B →  ~$3.6B  ~8.2%
 *   ------------------------------------------------
 *   Total broad market       ~$30.6B → ~$39.4B ~6.5%
 *
 * Two rules that must survive any future edit:
 *
 *  1. HEARING AIDS ALONE ($10.35B → $14.42B, MarketsandMarkets) are ALREADY
 *     INSIDE the devices segment. Never add that figure to a total — it is
 *     double-counting, and the owner flagged it explicitly.
 *  2. CONSUMER HEARABLES ARE EXCLUDED throughout. Including them would inflate
 *     the number and make it less credible, which is the opposite of the point.
 *
 * $36B drops hearing protection from the broad market as less relevant to
 * Hearfy, and is the figure the section leads with.
 */
export const MARKET = {
  /**
   * The number, split so the unit can be coloured separately from the digits.
   * "$36B" is the clinical market — devices, implants, diagnostics, and the
   * services around them — in 2030.
   */
  /**
   * The section needs a real H2. Every other section on the page has one; the
   * market shipped with an eyebrow and a bare slab, which is a large part of
   * why it read as an orphan rather than a section.
   */
  title: "A market that is growing, and underserved",
  figure: "$36",
  unit: "B",
  headline: "Global hearing care market by 2030",
  /**
   * The qualifiers, as a labelled list rather than pills.
   *
   * These were chips ("~6% a year", "Devices + services", "Clinical, not
   * consumer"). Chips read as filter controls — an interactive affordance on
   * a page with no interaction — and they could not carry the reason behind
   * each qualifier. As name + line they match the barriers list directly
   * above them, which is the page's established pattern for exactly this:
   * short label, one line of explanation.
   *
   * "Clinical, not consumer" earns its place most: it is why this figure is
   * smaller than the ~$39B ecosystem number, and why hearables are absent.
   */
  breakdownTitle: "What the number covers",
  breakdown: [
    {
      name: "Devices and services",
      line: "Hearing aids, implants, and diagnostics, plus the testing and fitting around them.",
    },
    {
      name: "Clinical, not consumer",
      line: "Prescribed and professionally fitted care. Consumer hearables are a separate market.",
    },
    {
      name: "Growing about 6% a year",
      line: "Steady growth to 2030 across both the device and service halves.",
    },
  ],
  /**
   * Tightened 2026-09-02 ("the one pager should be very concentrated"). The
   * long form opened with "Clinical products and audiology services
   * worldwide" — which the chips already say twice over ("Devices +
   * services", "Clinical, not consumer") — so it spent two lines restating
   * the row above it.
   *
   * What survives is the only thing the chips do NOT carry: what the figure
   * leaves out. That has to stay stated, or "$36B hearing market" is read as
   * including consumer hearables.
   */
  /**
   * Kept deliberately alongside the breakdown: that list says what the figure
   * COVERS, and this says what it leaves out. Without it, "$36B hearing
   * market" is read as including the consumer earbud market.
   */
  /**
   * Kept deliberately alongside the breakdown: that list says what the figure
   * COVERS, and this says what it leaves out. Without it, "$36B hearing
   * market" is read as including the consumer earbud market.
   */
  footnote: "Excludes hearing protection and consumer hearables.",
  sources: "Grand View Research · Research and Markets",
};

/** Slide 3 — the clinic today versus the visit at home. */
export const CONTRAST = {
  title: "Turning every home into a point of care",
  clinic: {
    label: "A Traditional Clinic Visit",
    tone: "muted" as const,
    points: ["Wait weeks or months", "Travel to the clinic", "Test in a sound booth", "Return for the fitting"],
  },
  home: {
    label: `A ${BRAND_NAME} Home Visit`,
    tone: "brand" as const,
    points: ["Book within days", "We come to you", "Test in your own home", "Get fitted in the same visit"],
  },
};

/**
 * Slide 9 — how a visit actually runs, start to finish. The spine of the page:
 * a reader who only skims this section still understands the product.
 */
export const HOW = {
  title: "How a visit works",
  subtitle: "One appointment, about an hour, in the patient's own home.",
  steps: [
    {
      n: "01",
      name: "Booking time",
      line: "A slot is booked online. A short intake beforehand sets the visit up for the patient's needs before anyone arrives.",
    },
    {
      n: "02",
      /**
       * "We arrive at your home", not "Your CMA arrives". The owner's wording,
       * 2026-09-02: an abbreviation in a heading makes the reader stop and
       * decode before they learn anything. "We" is who is coming, and it is
       * the promise the whole page rests on — the travelling is ours. The full
       * role title still appears in the body copy, where there is room to say
       * it properly.
       */
      name: "We arrive at the home",
      line: "A Certified Medical Assistant arrives with the full exam kit and sets it up on the table.",
    },
    {
      n: "03",
      name: "The exam, guided live",
      line: "A licensed audiologist joins by video and runs the exam: an ear inspection, a full hearing test, and a speech test in the room where the patient actually listens.",
    },
    {
      n: "04",
      name: "Results, explained",
      line: "Results are shown on screen and the audiologist talks through what they mean — while still in the room.",
    },
    {
      n: "05",
      name: "Fitted the same day",
      line: "If hearing aids are the right answer, they are matched to the results, fitted, and tuned before the visit ends.",
    },
  ],
};

/**
 * Slide 7's three-sided system, told as reassurance rather than architecture:
 * the public reader cares who is in the room and who is responsible.
 */
export const SYSTEM = {
  title: "The clinic, distributed",
  subtitle:
    `${BRAND_NAME} coordinates qualified professionals, clinic-grade equipment and remote clinical expertise into one seamless home visit — bringing the care to the patient, instead of the patient to the clinic.`,
  parts: [
    {
      name: "In your home",
      role: "We bring and operate the clinical equipment",
      line: "A Certified Medical Assistant sets up and operates everything, while the patient simply follows the same steps as in a traditional hearing clinic.",
    },
    {
      name: "Connected in real time",
      role: "Led by a licensed audiologist",
      line: "A licensed audiologist remotely supervises the entire exam, reviews each result as it is captured, and provides the final clinical sign-off.",
    },
    {
      name: "On the record",
      role: "One continuous chart",
      line: "Your exam, results, fitting, and follow-up care live in one record — so the next visit starts where this one ended.",
    },
  ],
};

/** Closing reassurance — the trust checklist, then the call to action. */
export const TRUST = [
  "Licensed audiologist oversight throughout every exam",
  "Clinic-grade diagnostic equipment, delivered and operated at home",
  "Clear, clinically reviewed results that remain accessible and portable",
  "Complete freedom to choose what happens next",
];

export const CTA = {
  title: `Experience ${BRAND_NAME}`,
  line: `See how ${BRAND_NAME} turns booking, home diagnostics and clinical review into one coordinated patient journey.`,
  /**
   * The page used to close on a "Walk through the product" button into the
   * demo. The owner removed it on 2026-09-02 and put a way to reach a human in
   * its place, so the close is now a phone number rather than a product tour.
   * `tel:` uses the E.164 form; `label` is the human spelling.
   */
  contact: { label: "Contact us", phone: "+972-54-3003630", tel: "+972543003630" },
};

/**
 * The page's media, and where each file came from.
 *
 * The photographs are cropped from the founders' live deck (the Google Slides
 * copy, exported 2026-09-02). That deck is already branded HEARFY — the
 * rebrand landed in the live copy — so unlike the older PDF in the private
 * repo, nothing here needed the old name painted out. Crops were taken from a
 * 200–300dpi render and trimmed so no slide text, callout, or connector line
 * is baked into the image.
 *
 * The videos already ship in the public demo (`public/video/`) and are reused
 * rather than duplicated: they are the same people, in the same rooms, that
 * the product's own screens show.
 *
 * `alt` is written for someone who cannot see the image and is deciding
 * whether to book — it describes what is happening, not what is in frame.
 */
export const MEDIA = {
  /**
   * Hero: the CMA and the patient together, which is the product in one
   * frame — a clinician in someone's living room, the kit open on the table.
   * The owner's call on 2026-09-02: lead with this, not the headphones clip.
   * A photograph also gives the hero a dependable first paint, where a video
   * shows a poster until it buffers.
   */
  hero: {
    src: "/one-pager/visit-home.jpg",
    alt: "A Certified Medical Assistant sits beside a patient at home, showing her a hearing aid, with the exam kit and a tablet on the table.",
  },
  /**
   * The exam actually running, looping. Moved down to the Hearfy-visit card,
   * where "tested in your own room" is the claim it evidences, and where its
   * motion pulls the eye to the side of the comparison that matters.
   */
  visitVideo: {
    src: "/video/room-listening.mp4",
    poster: "/video/room-listening-poster.jpg",
    alt: "A patient sits at home wearing headphones during a hearing exam.",
  },
  /** Slide 7's left photo: the CMA fitting a device with the patient. */
  visitHome: {
    src: "/one-pager/visit-home.jpg",
    alt: "A Certified Medical Assistant sits beside a patient at home, showing her a hearing aid, with the exam kit and a tablet on the table.",
  },
  /** Slide 7's call panel: the supervising audiologist, mid-session. */
  audiologist: {
    src: "/one-pager/audiologist.jpg",
    alt: "An audiologist in a white coat and headset supervises the exam over video.",
  },
  /** Slide 6's exam panel: the patient at the laptop, clinician on screen. */
  examLive: {
    src: "/one-pager/exam-live.jpg",
    alt: "A patient wearing headphones takes a hearing test at a laptop while the audiologist appears on screen.",
  },
} as const;
