/**
 * The deck's exam suite (spec §7a, deck slides 26–27):
 * otoscopy → pure tone → speech recognition → bone conduction → analysis.
 *
 * Bone conduction is CONDITIONAL: it runs only when pure tone comes back
 * abnormal. That branch is the visible clinical reasoning — it is what lets the
 * audiologist distinguish conductive from sensorineural loss.
 */

export type PureToneOutcome = "normal" | "abnormal";

export interface ExamStep {
  id: string;
  /** Patient-facing title. */
  title: string;
  /** What the CMA is doing — procedure, never interpretation. */
  procedure: string;
  /** True when the step runs only for an abnormal pure-tone result. */
  conditional: boolean;
}

export const EXAM_STEPS: ExamStep[] = [
  { id: "otoscopy", title: "Ear health check",
    procedure: "Capture a clear image of each ear canal", conditional: false },
  { id: "puretone", title: "Hearing test",
    procedure: "Run pure tone thresholds, both ears", conditional: false },
  { id: "speech", title: "Speech recognition",
    procedure: "Play word lists and record responses", conditional: false },
  { id: "bone", title: "Bone conduction",
    procedure: "Place the transducer and run bone thresholds", conditional: true },
  { id: "analysis", title: "Preparing your results",
    procedure: "Submit for automated analysis and clinical review", conditional: false },
];

/** The steps that actually run for a given pure-tone outcome. */
export function stepsFor(outcome: PureToneOutcome): ExamStep[] {
  if (outcome === "abnormal") return EXAM_STEPS;
  return EXAM_STEPS.filter(s => !s.conditional);
}

/** The step after `id`, or null when the exam is finished. */
export function nextStep(id: string, outcome: PureToneOutcome): string | null {
  const steps = stepsFor(outcome);
  const i = steps.findIndex(s => s.id === id);
  if (i === -1 || i === steps.length - 1) return null;
  return steps[i + 1].id;
}
