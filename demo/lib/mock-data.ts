// The product name is expected to change again (prior names: RightHear, HearMi).
// All UI must read it from this one constant so a rename is a one-line edit.
export const BRAND_NAME = "HearFy";

export const patient = { name: "Alex", city: "Miami, FL" };
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
  /** Bone conduction runs only because these air thresholds are abnormal. */
  boneRight: [15, 20, 25, 30, 30, 35],
  boneLeft: [15, 20, 25, 30, 35, 35],
};

/** Speech recognition scores, percent correct per ear (deck slide 10). */
export const speech = { right: 76, left: 82 };

export const otoscopy = {
  right: { finding: "Clear canal, intact tympanic membrane", tone: "green" as const },
  left: { finding: "Mild cerumen, view adequate", tone: "amber" as const },
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
export const supervisionQueue = [
  { id: "hero", name: "Alex R.", step: "Pure tone", waitMins: 0, redFlag: false, connection: "good" as const, cma: "Maya L.", hero: true },
  { id: "s2", name: "Doris P.", step: "Otoscopy", waitMins: 2, redFlag: false, connection: "good" as const, cma: "Ravi S.", hero: false },
  { id: "s3", name: "Walter K.", step: "Awaiting review", waitMins: 14, redFlag: false, connection: "good" as const, cma: "Tara B.", hero: false },
  { id: "s4", name: "Eleanor M.", step: "Consent", waitMins: 1, redFlag: true, connection: "good" as const, cma: "Jon P.", hero: false },
  { id: "s5", name: "Hector D.", step: "Speech", waitMins: 5, redFlag: false, connection: "weak" as const, cma: "Ana R.", hero: false },
  { id: "s6", name: "Priya N.", step: "Calibration", waitMins: 3, redFlag: false, connection: "good" as const, cma: "Sam W.", hero: false },
];

/** Membership tiers (spec §9b) — the patient's device-and-care choice. */
export const tiers = [
  { id: "essential", name: "Essential", monthly: 99, care: "Remote-first care" },
  { id: "premium", name: "Premium", monthly: 149, care: "Hybrid care" },
  { id: "vip", name: "VIP", monthly: 299, care: "Audiologist at home" },
];

/** The visit fee, credited to month 1 on purchase (spec §9a). */
export const visitFee = 99;
