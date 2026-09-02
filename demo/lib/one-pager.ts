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
 *   - the WHO prevalence figures (1.5B / 430M / 17%). These are published
 *     public-health statistics, not HearFy business information, and the deck
 *     itself cites them as WHO figures. They are the public case for the
 *     product existing.
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
  title: "A clinic, rearranged",
  subtitle:
    "The same people and the same equipment as a hearing clinic — just distributed, so the travelling is ours instead of yours.",
  parts: [
    {
      name: "In your home",
      role: "We bring the kit",
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
