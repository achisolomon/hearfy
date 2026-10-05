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
 *   - every price: the visit fee, the membership tiers, and any monthly figure
 * `lib/one-pager.test.ts` fails the build if any of them reappear.
 *
 * WHAT IS ALLOWED, and why:
 *   - the public-health prevalence figures (1.5B / 430M / 17%, all from WHO).
 *     These are published statistics, not Hearfy business information, and
 *     they are the public case for the product existing. The 17% briefly
 *     carried NIDCD's US-only figure (2026-09-02 to 2026-09-10) before being
 *     reverted to WHO's own global rate — see MARKET.stats.
 *   - third-party MARKET SIZE figures (see MARKET below). These are published
 *     analyst forecasts of an industry, not Hearfy's own numbers: they say how
 *     big hearing care is, never what Hearfy earns, charges, or projects. The
 *     forbidden list above is about OUR figures, and none of these are ours.
 *     Every one carries the firm that published it.
 *   - the founders' names, titles, and bios, and a link to each one's LinkedIn
 *     profile — added 2026-09-13 by the owner's explicit instruction,
 *     reversing the founders-are-investor-only stance above. A public page
 *     asking someone to trust a home visit from strangers benefits from
 *     naming who is behind it; that is a legitimate consumer-facing use even
 *     though the same three names also appear in the investor deck. The
 *     bios and photos are the deck's own ("The Team" slide) — see TEAM.
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
 * The problem, as the deck's "THE PROBLEM" slide now states it (taken from the
 * deck 2026-10-05, replacing the dot grid and the four barriers): the headline
 * names the problem, the booth-to-living-room photo pair is the evidence, and
 * the WHO figures underneath say why it matters. Public health figures, not
 * company figures.
 *
 * The WHO figures that sat under the photos (1.5B / 430M and the 17/83 bar)
 * moved to MARKET on 2026-10-05 (owner: "move this to the market"), where they
 * are the evidence for "underserved". The dot grid and its "17 in 100"
 * caption are gone, so the 17% is stated once.
 */
export const PROBLEM = {
  title: "A simple hearing test shouldn’t be this hard.",
  lede: "Clinics. Long waits. High costs. A fragmented journey.",
  clinicTags: ["Old workflow", "High cost", "Long waits", "Inefficient"],
  remoteTags: ["Convenient", "Available", "Accessible", "Remote"],
};

/**
 * The market, as a single held number — "One Number, Held".
 *
 * Chosen by the owner on 2026-09-02 from five rendered options (initially
 * "Where Hearfy Sits", changed the same day). The whole section is the
 * figure: no chart, no bars, no rings. It is the owner's own investor line —
 * "A $28B global hearing care market, growing at approximately 6%
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
 * Two rules that must survive any future edit:
 *
 *  1. HEARING AIDS ALONE are ALREADY INSIDE the devices segment. Never add
 *     that figure to a total — it is double-counting, and the owner flagged
 *     it explicitly.
 *  2. CONSUMER HEARABLES ARE EXCLUDED throughout. Including them would inflate
 *     the number and make it less credible, which is the opposite of the point.
 *
 * $28B drops hearing protection from the broad market as less relevant to
 * Hearfy, and is the figure the section leads with.
 */
export const MARKET = {
  /**
   * The number, split so the unit can be coloured separately from the digits.
   * "$28B" is the clinical market — devices, implants, diagnostics, and the
   * services around them.
   */
  /**
   * The section needs a real H2. Every other section on the page has one; the
   * market shipped with an eyebrow and a bare slab, which is a large part of
   * why it read as an orphan rather than a section.
   */
  title: "A market that is growing, and underserved",
  /**
   * The need, in WHO's public-health figures — moved here from PROBLEM on
   * 2026-10-05. They come first in the section: how many people, then how
   * few are served, then the money.
   */
  stats: [
    {
      value: "1.5B",
      label: "live with hearing loss",
      source: "WHO",
      sourceUrl: "https://www.who.int/news-room/fact-sheets/detail/deafness-and-hearing-loss",
    },
    {
      value: "430M",
      label: "need rehabilitation",
      source: "WHO",
      sourceUrl: "https://www.who.int/news-room/fact-sheets/detail/deafness-and-hearing-loss",
    },
  ],
  /**
   * The treated/untreated split. WHO's World Report on Hearing (2021): "an
   * estimated gap of 83% between the need for and access to services for such
   * care – using hearing aid use as a tracer indicator." Not NIDCD's US 16%,
   * which is close by coincidence rather than derivation.
   */
  treated: 17,
  untreated: 83,
  gapSource: "WHO",
  gapSourceUrl:
    "https://cdn.who.int/media/docs/default-source/documents/health-topics/deafness-and-hearing-loss/world-report-on-hearing/wrh-executive-summary.en.pdf",

  figure: "$28",
  unit: "B",
  headline: "Global hearing care market",
  /**
   * The qualifiers, as a labelled list rather than pills.
   *
   * These were chips ("~6% a year", "Devices + services", "Clinical, not
   * consumer"). Chips read as filter controls — an interactive affordance on
   * a page with no interaction — and they could not carry the reason behind
   * each qualifier. As name + line they follow the page's established
   * pattern for exactly this: short label, one line of explanation.
   *
   * "Clinical, not consumer" earns its place most: it is why this figure is
   * smaller than the broader ecosystem number, and why hearables are absent.
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
      line: "Steady growth across both the device and service halves.",
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
   * leaves out. That has to stay stated, or "$28B hearing market" is read as
   * including consumer hearables.
   */
  /**
   * Kept deliberately alongside the breakdown: that list says what the figure
   * COVERS, and this says what it leaves out. Without it, "$28B hearing
   * market" is read as including the consumer earbud market.
   */
  /**
   * Kept deliberately alongside the breakdown: that list says what the figure
   * COVERS, and this says what it leaves out. Without it, "$28B hearing
   * market" is read as including the consumer earbud market.
   */
  footnote: "Excludes hearing protection and consumer hearables.",
  sources: [
    { name: "Grand View Research", url: "https://www.grandviewresearch.com/industry-analysis/hearing-aids-market" },
    { name: "Research and Markets", url: "https://www.researchandmarkets.com/reports/4990990/hearing-aid-market-2026-2030" },
  ],
};

/** Slide 3 — the clinic today versus the visit at home. */
export const CONTRAST = {
  title: "Turning every home into a point of care",
  clinic: {
    label: "A Traditional Clinic Visit",
    tone: "muted" as const,
    points: ["Wait weeks or months", "Travel to the clinic", "Test in a sound booth", "Return for the fitting", "Pay for the hearing aids up front"],
  },
  home: {
    label: `A ${BRAND_NAME} Home Visit`,
    tone: "brand" as const,
    /**
     * The last pair is affordability (owner, 2026-10-05: "add affordability
     * to the table"), from the deck's outright-purchase comparison: about the
     * price of the aids, with the whole care journey included. In words only;
     * the deck's figures are barred from this page.
     */
    points: ["Book within days", "We come to you", "Test in your own home", "Get fitted in the same visit", "Aids plus care, similar price"],
  },
};

/**
 * How it works — the deck's film, in place of the five step cards
 * (owner, 2026-10-05: "replace the how it works with the video from the
 * deck"). The film is the visit start to finish, so the cards and the exam
 * photo beside them would only re-tell it in words.
 *
 * `line` is the film's own caption on the deck, kept word for word.
 */
export const HOW = {
  title: "How a visit works",
  line: "Hearing loss starts at home. So should care.",
  /**
   * The five steps, as captions on the film (owner, 2026-10-05: "these should
   * be captions on the mov"). `from` is the second each one comes up, read
   * off the film frame by frame: the daughter booking on her phone, the CMA
   * at the door, the test at the table with the audiologist on the tablet,
   * the audiologist reviewing results, then choosing and unboxing the aids.
   * The film's last stretch (the audiologist's patient grid) carries `line`.
   * Timed against Eyal's 45s re-edit (deck commit 7185336, 2026-09-29), the
   * film origin/main ships. Re-time these if the film is re-cut.
   */
  steps: [
    { n: "01", from: 0,  name: "Booking time", line: "A slot is booked online. A short intake beforehand sets the visit up for the patient's needs before anyone arrives." },
    { n: "02", from: 8,  name: "We arrive at the home", line: "A Certified Medical Assistant arrives with the full exam kit and sets it up on the table." },
    { n: "03", from: 11, name: "The exam, guided live", line: "A licensed audiologist joins by video and runs the exam: an ear inspection, a full hearing test, and a speech test in the room where the patient actually listens." },
    { n: "04", from: 24, name: "Results, explained", line: "Results are shown on screen and the audiologist talks through what they mean — while still in the room." },
    { n: "05", from: 30, name: "Fitted the same day", line: "If hearing aids are the right answer, they are matched to the results, fitted, and tuned before the visit ends." },
  ],
  /** When the step captions hand back to `line` for the film's close. */
  lineFrom: 40,
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

/**
 * The deck's "The Team" slide, ported here 2026-09-13.
 *
 * Names, titles and bio lines are the slide's own verbatim, including its
 * quirks ("Bsc.", the trailing comma) — Achi's bio is the one exception,
 * rewritten by the owner (2026-09-03) to lead with being a second-time
 * founder rather than a tool list; mirror any future edit back into the
 * deck rather than letting the two drift apart again.
 *
 * `linkedin` is new on this page — the deck slide itself carries no profile
 * links; these come from the deck's separate contact-card data, which lists
 * the same three people.
 */
export const TEAM = [
  {
    name: "Dr. Michael Mastai",
    title: "CMO",
    lines: ["MD, BSc in Biology.", "4+ Years Medical Entrepreneurship,", "Expert in AI Healthcare Products."],
    photo: "/one-pager/team-michael.jpg",
    logos: "/one-pager/logos-michael.png",
    linkedin: "https://www.linkedin.com/in/michael-mastai-md-723a96183/",
  },
  {
    name: "Eyal Harel",
    title: "CEO",
    lines: [
      "Bsc. Technology Management",
      "Serial entrepreneur with 20+ years building and scaling tech ventures.",
      "Product-driven leader from ideas to market.",
    ],
    photo: "/one-pager/team-eyal.jpg",
    logos: "/one-pager/logos-eyal.png",
    linkedin: "https://www.linkedin.com/in/eyalharel1/",
  },
  {
    name: "Achi Solomon",
    title: "CTO",
    lines: ["2nd time founder | B.A. CS", "20+ yrs leading R&D teams", "Scalable cloud-native platforms and GenAI"],
    photo: "/one-pager/team-achi.jpg",
    logos: "/one-pager/logos-achi.png",
    linkedin: "https://www.linkedin.com/in/achisolomon/",
  },
];

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
   * its place, so the close is a way to contact us rather than a product tour.
   * It was a phone number until 2026-09-04, when the owner replaced it with an
   * email address — `mailto:` works on every device, so unlike `tel:` it needs
   * no separate desktop branch.
   */
  contact: { label: "Contact us", email: "contact@hearfy.org" },
};

/**
 * The page's media, and where each file came from.
 *
 * The photographs are cropped from the founders' live deck (the Google Slides
 * copy, exported 2026-09-02). Crops were taken from a 200–300dpi render and
 * trimmed so no slide text, callout, or connector line is baked into the
 * image.
 *
 * BRANDING INSIDE THE PICTURES, corrected 2026-09-04. This block used to say
 * the live deck was already branded correctly and that nothing here needed the
 * old name painted out. That was wrong: the generator set the name in caps on
 * the props it drew, and the hero carried the all-caps spelling twice — on the CMA's polo
 * and on the hearing-aid case — on the site's most-looked-at image. Because
 * the name was in PIXELS, every naming guard in this suite was blind to it.
 *
 * `scripts/relockup-photos.py` now inpaints those away and composites the
 * approved lockup over the hole (the mark is never redrawn), and the test
 * below asserts that script still covers the hero, since no source read can
 * see whether it does.
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
  /**
   * The problem section's pair, copied from the deck's own slide
   * (internal/deck/public/deck/today-*.jpg, 2026-10-05). No name in the
   * pixels: the mug in the call photo carries the mark alone.
   */
  todayBooth: {
    src: "/one-pager/today-booth.jpg",
    alt: "An older patient sits in a sound booth while an audiologist runs the hearing test from a console outside it.",
  },
  todayCall: {
    src: "/one-pager/today-call.jpg",
    alt: "An audiologist at a home desk runs the same hearing test over a video call, the patient and her audiogram on screen.",
  },
  /**
   * The How-it-works film, copied from the deck's origin/main
   * (internal/deck/public/deck/room.mp4: Eyal's 45s re-edit, 2026-09-29).
   * Byte-identical to the deck's file; `lib/one-pager.test.ts` pins its
   * length so a stale copy fails the build. The poster is its own first frame, so the frame is
   * never blank while the file loads.
   */
  film: {
    src: "/video/room.mp4",
    poster: "/video/room-poster.jpg",
    alt: "A home hearing visit from start to finish: an older man struggling to hear, a hearing test at his table, an audiologist joining by video, and hearing aids fitted at home.",
  },
} as const;
