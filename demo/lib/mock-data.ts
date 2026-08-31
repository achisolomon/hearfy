// The product name is expected to change again (prior names: RightHear, HearMi).
// All UI must read it from this one constant so a rename is a one-line edit.
export const BRAND_NAME = "HearFy";

export const patient = { name: "Alex", city: "Miami, FL" };

/**
 * What the CMA verifies at the door (corrections sheet 2026-08-31, item 1):
 * the person, not the kit — photo ID scan plus the SSN tail on record.
 */
export const identity = {
  legalName: "Alex Rivera",
  dob: "Mar 14, 1959",
  idType: "FL driver license",
  idNumber: "R520-441-59-094-0",
  ssnLast4: "3921",
};
export const cma = { name: "Maya L.", role: "Certified Medical Assistant", rating: 4.9, reviews: 128 };
export const appointment = { date: "Wed, May 21", fullDate: "May 21, 2025", time: "9:00 – 10:00 AM", price: 99 };
export const devices = [
  { name: "Phonak Audéo L50", badge: "Best match", price: "$1,590 / pair", fit: 94, features: ["Rechargeable", "Bluetooth", "3-year warranty"] },
  { name: "Signia Pure Charge&Go", badge: "Best value", price: "$1,290 / pair", fit: 88, features: ["Rechargeable", "App control", "Remote support"] },
  { name: "Oticon Intent 2", badge: "Premium", price: "$2,190 / pair", fit: 84, features: ["Rechargeable", "AI sound processing", "3-year warranty"] }
];

/** The signing clinician (spec §5: license state is shown, not enforced). */
export const clinician = {
  name: "Dr. Susan Reed",
  credential: "Au.D.",
  licenseState: "Florida",
  licenseNo: "AU-FL-4471",
};

/** Audiogram thresholds in dB HL, by frequency (Hz). Hero = moderate loss. */
export const audiogram = {
  frequencies: [250, 500, 1000, 2000, 4000, 8000],
  right: [20, 30, 40, 50, 55, 60],
  left: [25, 35, 45, 50, 60, 65],
  /** Bone thresholds — bone conduction is standard on every exam (item 6). */
  boneRight: [15, 20, 25, 30, 30, 35],
  boneLeft: [15, 20, 25, 30, 35, 35],
};

/** Speech recognition scores, percent correct per ear (deck slide 10). */
export const speech = { right: 76, left: 82 };

export const otoscopy = {
  right: { finding: "Clear canal, intact tympanic membrane", tone: "green" as const },
  left: { finding: "Mild cerumen, view adequate", tone: "amber" as const },
};

/**
 * Tympanometry, one result per ear (corrections sheet 2026-08-31, item 5).
 * The stiff left trace is what the left-ear air–bone gap looks like from the
 * middle ear — the two findings corroborate each other.
 */
export const tympanometry = {
  right: { type: "Type A", pressure: "−15 daPa", compliance: "0.6 ml",
    finding: "Normal middle ear movement", tone: "green" as const },
  left: { type: "Type As", pressure: "−45 daPa", compliance: "0.3 ml",
    finding: "Reduced mobility — matches the left-ear gap", tone: "amber" as const },
};

/** The CMA's day (CMA persona spec §2). */
export const cmaDay = [
  { time: "9:00 – 10:00", name: "Alex R.", area: "Coral Gables", type: "Hearing exam", status: "next" as const },
  { time: "11:30 – 12:30", name: "Doris P.", area: "Coconut Grove", type: "Hearing exam", status: "upcoming" as const },
  { time: "14:00 – 15:00", name: "Marcus T.", area: "Brickell", type: "Follow-up fitting", status: "upcoming" as const },
];

/** The exam kit — leased, calibrated, gated (spec §5). */
export const kit = {
  id: "KIT-4471",
  calibrationDue: "2026-11-02",
  calibrationOk: true,
  checklist: [
    "Kit identity verified",
    "Calibration current",
    "Probe tips seated",
    "Ambient noise within range",
    "Patient seated and briefed",
  ],
};

export const visit = { id: "VIS-20847", address: "1240 Alhambra Cir, Coral Gables" };

/**
 * Six concurrent exams for the 1:many supervision panel (spec §9).
 * The hero plus five extras at staggered steps — one red-flagged, one waiting long.
 */
/**
 * `flagReason` says what the red flag actually is. The panel's peek card shows
 * it, because a flag the clinician cannot interpret is a flag she cannot act
 * on (critique 2026-08-31).
 */
export const supervisionQueue = [
  { id: "hero", name: "Alex R.", step: "Pure tone", waitMins: 0, redFlag: false, connection: "good" as const, cma: "Maya L.", hero: true },
  { id: "s2", name: "Doris P.", step: "Otoscopy", waitMins: 2, redFlag: false, connection: "good" as const, cma: "Ravi S.", hero: false },
  { id: "s3", name: "Walter K.", step: "Awaiting review", waitMins: 14, redFlag: false, connection: "good" as const, cma: "Tara B.", hero: false },
  { id: "s4", name: "Eleanor M.", step: "Consent", waitMins: 1, redFlag: true, connection: "good" as const, cma: "Jon P.", hero: false,
    flagReason: "Consent not yet captured. The exam cannot proceed past this step until it is." },
  { id: "s5", name: "Hector D.", step: "Speech", waitMins: 5, redFlag: false, connection: "weak" as const, cma: "Ana R.", hero: false },
  { id: "s6", name: "Priya N.", step: "Calibration", waitMins: 3, redFlag: false, connection: "good" as const, cma: "Sam W.", hero: false },
];

export type SupervisionExam = (typeof supervisionQueue)[number] & { flagReason?: string };

/** Membership tiers (spec §9b) — the patient's device-and-care choice. */
export const tiers = [
  { id: "essential", name: "Essential", monthly: 99, care: "Remote-first care" },
  { id: "premium", name: "Premium", monthly: 149, care: "Hybrid care" },
  { id: "vip", name: "VIP", monthly: 299, care: "Audiologist at home" },
];

/** The visit fee, credited to month 1 on purchase (spec §9a). */
export const visitFee = 99;

/** Which tier each device belongs to, and why it fits (spec §2 gap: explainable fit). */
export const deviceDetail: Record<string, {
  tier: string;
  inCase: boolean;
  /** Shell colour for the stylised product drawing (components/device-thumb.tsx). */
  finish: string;
  fitFactors: string[];
  compare: Record<string, string>;
}> = {
  "Phonak Audéo L50": {
    tier: "premium", inCase: true, finish: "#b3a18c",
    fitFactors: [
      "Matches your moderate loss across speech frequencies",
      "Rechargeable — no small batteries to handle",
      "Works with your iPhone for calls",
    ],
    compare: {
      "Clinical fit": "Receiver-in-canal, suits your air–bone gap",
      "Use & lifestyle": "All-day battery, good in restaurants",
      "Usability": "Rechargeable, magnetic charger",
      "Commercial": "$149/month Premium tier",
      "Terms": "3-year warranty, 45-day return",
      "Fulfilment": "In the case — fitted today",
    },
  },
  "Signia Pure Charge&Go": {
    tier: "essential", inCase: true, finish: "#7f8a9b",
    fitFactors: [
      "Covers your loss at conversational levels",
      "Rechargeable with a simple two-button control",
      "Remote adjustments without another visit",
    ],
    compare: {
      "Clinical fit": "Receiver-in-canal, standard fitting",
      "Use & lifestyle": "Best in quieter settings",
      "Usability": "Two buttons, no app required",
      "Commercial": "$99/month Essential tier",
      "Terms": "2-year warranty, 45-day return",
      "Fulfilment": "In the case — fitted today",
    },
  },
  "Oticon Intent 2": {
    tier: "vip", inCase: false, finish: "#33465f",
    fitFactors: [
      "Premium processing for noisy environments",
      "Rechargeable with the longest battery life",
      "Includes audiologist-at-home care visits",
    ],
    compare: {
      "Clinical fit": "Open fitting — excluded for your left-ear gap",
      "Use & lifestyle": "Strongest in noise",
      "Usability": "App-led, more settings to learn",
      "Commercial": "$299/month VIP tier",
      "Terms": "3-year warranty, 45-day return",
      "Fulfilment": "Ships to you — fitted at a follow-up",
    },
  },
};

/** Order states through fitting and activation (spec §2 gap). */
export const orderStates = [
  "Submitted", "Supplier accepted", "Configured", "Shipped",
  "Delivered", "Fitting due", "Activated",
];

/** Serial numbers of the dispensed pair, one per side. */
export const serials = { left: "HF-2284-L", right: "HF-2284-R" };

/**
 * The after-delivery care record (corrections sheet 2026-08-31, item 14):
 * everything the patient signed or went through, summarised in one place.
 */
export const signedDocuments = [
  { name: "Visit & care consent", signed: "May 21, 2025" },
  { name: "Telehealth consent", signed: "May 21, 2025" },
  { name: "Membership contract", signed: "May 21, 2025" },
  { name: "Terms & agreement", signed: "May 21, 2025" },
];

export const visitHistory = [
  { date: "May 21, 2025", what: "Home hearing exam, fitting & activation", by: "Maya L. · Dr. Susan Reed", done: true },
  { date: "Jun 4, 2025", what: "Follow-up hearing check", by: "Scheduled", done: false },
];

/** Exception queue — the operator's real work (spec §9). */
export const exceptions = [
  { kind: "Red flag", patient: "Eleanor M.", stage: 2, age: "4m", severity: "high" as const,
    detail: "Intake safety trigger — awaiting licensed review" },
  { kind: "Unsigned report", patient: "Walter K.", stage: 6, age: "14m", severity: "high" as const,
    detail: "Exam complete, results held from patient" },
  { kind: "Failed connection", patient: "Hector D.", stage: 5, age: "3m", severity: "medium" as const,
    detail: "Supervision link degraded mid-exam" },
  { kind: "Expired kit calibration", patient: "Priya N.", stage: 4, age: "9m", severity: "medium" as const,
    detail: "Checklist gate blocked the visit" },
  { kind: "Late arrival", patient: "Marcus T.", stage: 3, age: "6m", severity: "low" as const,
    detail: "CMA running behind schedule" },
  { kind: "Missing consent", patient: "Doris P.", stage: 4, age: "2m", severity: "low" as const,
    detail: "Telehealth consent not captured" },
];

/** Patients per lifecycle stage — the pipeline panel. */
export const pipeline = [
  { stage: 1, name: "Awareness", count: 42 },
  { stage: 2, name: "Booking & intake", count: 18 },
  { stage: 3, name: "Dispatch", count: 11 },
  { stage: 4, name: "Home visit", count: 6 },
  { stage: 5, name: "Live supervision", count: 6 },
  { stage: 6, name: "Result", count: 4 },
  { stage: 7, name: "Consult", count: 3 },
  { stage: 8, name: "Sale", count: 5 },
  { stage: 9, name: "Fulfilment", count: 27 },
];

/**
 * Operator metrics. ⚠ conversion, deviceGrossProfit, cmaShare and the 1:6 ratio
 * appear in NEITHER the deck NOR the MRD — demo placeholders only (spec §14).
 * Never present them to investors as deck figures.
 */
export const metrics = {
  activeMemberships: 1284,
  /** Derived from `mix`: 702×99 + 431×149 + 151×299. Keep in step if the mix changes. */
  mrr: 178_866,
  newThisMonth: 96,
  mix: [
    { tier: "Essential", count: 702, monthly: 99 },
    { tier: "Premium", count: 431, monthly: 149 },
    { tier: "VIP", count: 151, monthly: 299 },
  ],
  conversion: 0.30,
  deviceGrossProfit: 915,
  cmaShare: 70,
  supervisionRatio: 6,
};

/** Compressed secondary cards on the operator dashboard. */
export const opPanels = {
  dispatch: { visitsToday: 34, cmasActive: 12, unassigned: 2 },
  kits: { inField: 12, calibrationDue: 2, expired: 1 },
  orders: { inFlight: 27, fittingDue: 4, activatedToday: 9 },
  supplier: { open: 6, accepted: 21 },
  support: { open: 8, breaching: 1 },
};

/** The six MRD comparison categories, in display order. */
/**
 * What Dr. Reed says while the three packages are on screen (2026-08-31).
 *
 * Only she recommends — the CMA facilitates and the patient decides — so the
 * comparison is never presented without her clinical reason for the pick.
 * Each line is derived from `deviceDetail[...].compare["Clinical fit"]`, so
 * the caption and the table can never tell the patient different things.
 */
export const compareRecommendation = {
  device: "Phonak Aud\u00e9o L50",
  /** Her spoken line, as the call's live caption. */
  note:
    "The Phonak is my recommendation \u2014 it is the closest fit to your air\u2013bone gap. " +
    "The Signia covers you well in quieter rooms; the Oticon I would rule out for your left ear.",
  /**
   * The rule the screen must state, not merely show (corrections sheet item
   * 13): the CMA facilitates the conversation and can close nothing.
   */
  cmaNote:
    "Presenting the shortlist over video \u2014 only Dr. Reed recommends and sells. You open the case.",
  /** Why, per device, in her voice. Keyed by device name. */
  reasons: {
    "Phonak Aud\u00e9o L50": "Recommended \u2014 closest fit to your air\u2013bone gap",
    "Signia Pure Charge&Go": "Also suitable \u2014 best in quieter rooms",
    "Oticon Intent 2": "Not advised \u2014 open fitting leaves your left-ear gap uncovered",
  } as Record<string, string>,
};

export const compareCategories = [
  "Clinical fit", "Use & lifestyle", "Usability", "Commercial", "Terms", "Fulfilment",
];
