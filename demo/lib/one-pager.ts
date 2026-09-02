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
 * `lib/one-pager.test.ts` fails the build if any of them reappear.
 *
 * WHAT IS ALLOWED, and why:
 *   - the WHO prevalence figures (1.5B / 430M / 17%). These are published
 *     public-health statistics, not HearFy business information, and the deck
 *     itself cites them as WHO figures. They are the public case for the
 *     product existing.
 *   - $99 for the visit and the membership tier prices. These are already
 *     consumer-facing in the shipped demo (lib/mock-data.ts, lib/commerce.ts)
 *     and are what a patient is quoted. The public/private split note names
 *     $99 as the intentional public exception.
 *
 * Product substance is drawn from the founders' deck (slides 3, 4, 6, 7, 9,
 * 11) — the product story only, with every business slide left behind.
 */

/** The masthead: what HearFy is, in the deck's own words. */
export const HERO = {
  eyebrow: "Hearing care at home",
  title: ["Bringing hearing care", "home."],
  /** Slide 6's line, which is the whole thesis in one sentence. */
  thesis: "Hearing loss starts at home. So should care.",
  lede:
    "A full diagnostic hearing exam at your kitchen table. A Certified Medical Assistant brings the clinic to you; a licensed audiologist runs the exam live from their office. No booth, no waiting list, no trip across town.",
  chips: ["Private", "On demand", "Expert-guided"],
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
    { value: "17%", label: "of those who need aids use them", source: "WHO" },
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

/** Slide 3 — the clinic today versus the visit at home. */
export const CONTRAST = {
  title: "The clinic, or your kitchen table",
  clinic: {
    label: "A clinic visit today",
    tone: "muted" as const,
    points: ["Book months ahead", "Arrange the trip", "Sit in a sound booth", "Come back for the fitting"],
  },
  home: {
    label: "A HearFy visit",
    tone: "brand" as const,
    points: ["Booked for this week", "We come to you", "Tested in your own room", "Fitted the same day"],
  },
};

/**
 * Slide 9 — how a visit actually runs, start to finish. The spine of the page:
 * a reader who only skims this section still understands the product.
 */
export const HOW = {
  title: "How a visit works",
  subtitle: "One appointment, about an hour, in your own home.",
  steps: [
    {
      n: "01",
      name: "Book a time",
      line: "Pick a slot that suits you. We answer a few questions first so the visit is set up for your needs before anyone arrives.",
    },
    {
      n: "02",
      /**
       * "Your CMA arrives", with the abbreviation expanded in the body copy.
       * The owner's wording, 2026-09-02: the role has a name and the page
       * should use it. CMA is the industry term the deck uses throughout
       * (slide 7, "A CMA at home"), so introducing it here — rather than
       * calling them a generic "assistant" — is what makes the rest of the
       * page's language consistent with the product.
       */
      name: "Your CMA arrives",
      line: "A Certified Medical Assistant comes to your door with the full exam kit and sets it up on your table.",
    },
    {
      n: "03",
      name: "The exam, guided live",
      line: "A licensed audiologist joins by video and runs the exam: an ear inspection, a full hearing test, and a speech test in the room where you actually listen.",
    },
    {
      n: "04",
      name: "Results, explained",
      line: "You see your own audiogram and the audiologist talks you through what it means — while they are still with you.",
    },
    {
      n: "05",
      name: "Fitted the same day",
      line: "If hearing aids are the right answer, they are matched to your results, fitted, and tuned before the visit ends.",
    },
  ],
};

/**
 * Slide 7's three-sided system, told as reassurance rather than architecture:
 * the public reader cares who is in the room and who is responsible.
 */
export const SYSTEM = {
  title: "A clinic, rearranged",
  subtitle:
    "The same people and the same equipment as a hearing clinic — just distributed, so the travelling is ours instead of yours.",
  parts: [
    {
      name: "In your home",
      role: "Your CMA and the kit",
      line: "A Certified Medical Assistant handles the equipment, so nothing is asked of you that you would not be asked in a clinic chair.",
    },
    {
      name: "On the call",
      role: "Your audiologist",
      line: "A licensed audiologist supervises the whole exam in real time, sees every result as it is captured, and signs off on it.",
    },
    {
      name: "On the record",
      role: "One continuous chart",
      line: "Your exam, results, fitting, and follow-up care live in one record — so the next visit starts where this one ended.",
    },
  ],
};

/**
 * The commercial promise, kept to what a patient is actually quoted.
 * $99 and the tier prices are already public in the shipped demo.
 */
export const OFFER = {
  title: "What it costs",
  price: "$99",
  priceLabel: "for the visit",
  /** The deposit rule, spec §9a — the consumer-facing half of it. */
  deposit:
    "If you go ahead with hearing aids, that $99 becomes your first month of membership — so the visit costs you nothing.",
  includedTitle: "The visit includes",
  included: [
    "A full diagnostic exam in your home",
    "A licensed audiologist supervising live",
    "Your audiogram, explained in plain language",
    "A clear recommendation, with no obligation",
  ],
  membershipTitle: "If you go ahead",
  membershipLine:
    "Membership bundles the devices, the ongoing care, and the app into one monthly payment — instead of a large bill on the day.",
  tiers: [
    { name: "Essential", price: "$99", per: "/mo", line: "Remote-first care" },
    { name: "Premium", price: "$149", per: "/mo", line: "Hybrid care" },
    { name: "VIP", price: "$299", per: "/mo", line: "Audiologist at home" },
  ],
};

/** Closing reassurance — the trust checklist, then the call to action. */
export const TRUST = [
  "Licensed audiologists on every exam",
  "Clinical-grade equipment, brought to you",
  "Your results are yours, and portable",
  "No obligation to buy anything",
];

export const CTA = {
  title: "Book a hearing exam at home",
  line: "Tell us when suits you. We will bring the clinic.",
  action: "See how it works",
  secondary: "Walk through the product",
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
   * The exam actually running, looping. Moved down to the HearFy-visit card,
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
