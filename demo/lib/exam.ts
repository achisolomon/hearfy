/**
 * The deck's exam suite (spec §7a, deck slides 26–27; corrections sheet
 * 2026-08-31, items 5–6):
 * otoscopy → tympanometry → pure tone → speech → bone conduction → analysis.
 *
 * Every step runs for every exam. Bone conduction was conditional on an
 * abnormal pure tone until the corrections sheet made it a fixed part of the
 * protocol (item 6); tympanometry joined the suite between the ear health
 * check and the hearing test the same day (item 5).
 */

export type PureToneOutcome = "normal" | "abnormal";

export interface ExamStep {
  id: string;
  /** Patient-facing title. */
  title: string;
  /** What the CMA is doing — procedure, never interpretation. */
  procedure: string;
  /** Historical flag; no step is conditional since the 2026-08-31 corrections. */
  conditional: boolean;
}

export const EXAM_STEPS: ExamStep[] = [
  { id: "otoscopy", title: "Ear health check",
    procedure: "Capture a clear image of each ear canal", conditional: false },
  { id: "tympanometry", title: "Middle ear check",
    procedure: "Seal the probe and run tympanometry, both ears", conditional: false },
  { id: "puretone", title: "Hearing test",
    procedure: "Run pure tone thresholds, both ears", conditional: false },
  { id: "speech", title: "Speech recognition",
    procedure: "Play word lists and record responses", conditional: false },
  { id: "bone", title: "Bone conduction",
    procedure: "Place the transducer and run bone thresholds", conditional: false },
  { id: "analysis", title: "Preparing your results",
    procedure: "Submit for automated analysis and clinical review", conditional: false },
];

/** Every step runs regardless of outcome; the parameter stays for the record. */
export function stepsFor(_outcome: PureToneOutcome): ExamStep[] {
  return EXAM_STEPS;
}

/**
 * Pure tone average over the speech frequencies (500–4000 Hz), rounded —
 * the single number each ear's result card leads with (corrections sheet
 * 2026-08-31, item 4: one result per ear).
 */
export function pta(frequencies: number[], thresholds: number[]): number {
  const speech = frequencies
    .map((f, i) => ({ f, db: thresholds[i] }))
    .filter(({ f }) => f >= 500 && f <= 4000);
  const sum = speech.reduce((a, { db }) => a + db, 0);
  return Math.round(sum / speech.length);
}

/** The clinical band a PTA falls in, patient-facing wording. */
export function lossBand(db: number): string {
  if (db <= 25) return "Normal hearing";
  if (db <= 40) return "Mild loss";
  if (db <= 55) return "Moderate loss";
  if (db <= 70) return "Moderately severe loss";
  if (db <= 90) return "Severe loss";
  return "Profound loss";
}

/** The step after `id`, or null when the exam is finished. */
export function nextStep(id: string, outcome: PureToneOutcome): string | null {
  const steps = stepsFor(outcome);
  const i = steps.findIndex(s => s.id === id);
  if (i === -1 || i === steps.length - 1) return null;
  return steps[i + 1].id;
}
