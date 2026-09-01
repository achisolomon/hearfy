/**
 * What the operator's board shows at a given stage.
 *
 * Jordan watches rather than acts: his dashboard has no controls, it reflects
 * the day the other three personas are living. Keeping the derivation here —
 * framework-free, like lib/story.ts — means it is testable without rendering
 * anything, and the dashboard components stay presentational.
 *
 * The membership/MRR board (`metrics`) is deliberately NOT derived here: it is
 * a business view over the whole book, not a per-visit one, and several of its
 * figures are unsourced placeholders flagged "Illustrative" in the UI.
 */
import { exceptions as baseExceptions, pipeline as basePipeline } from "./mock-data";
import type { StageNumber } from "./story";

/** One exception row, exactly as `Exceptions` already renders it. */
export type OperatorException = (typeof baseExceptions)[number];

export interface PipelineBar {
  stage: number;
  name: string;
  count: number;
  /** True on the one stage the story is currently on — Alex's own case. */
  hero: boolean;
}

export interface OperatorState {
  pipeline: PipelineBar[];
  exceptions: OperatorException[];
}

/**
 * The day fills up as it goes: earlier stages drain, later ones accumulate.
 * A small deterministic shift, not randomness — the same stage must always
 * render the same board, or stepping back would show a different day.
 */
function countFor(barStage: number, atStage: number, base: number): number {
  if (barStage < atStage) return Math.max(0, base - (atStage - barStage));
  if (barStage > atStage) return base + Math.min(3, barStage - atStage);
  return base;
}

/**
 * Alex's own exception, live only while the visit is actually happening.
 *
 * The queue is the operator's real work, so the demo's own patient appearing
 * in it — and clearing — is what makes the board read as this day rather than
 * a screenshot.
 */
const HERO_EXCEPTION: OperatorException = {
  kind: "Ambient noise above target",
  patient: "Alex R.",
  stage: 4,
  age: "1m",
  severity: "medium" as const,
  detail: "Room noise flagged mid-exam — CMA notified to re-site the kit",
};

export function operatorStateAt(stage: StageNumber): OperatorState {
  const pipeline: PipelineBar[] = basePipeline.map(p => ({
    stage: p.stage,
    name: p.name,
    count: countFor(p.stage, stage, p.count),
    hero: p.stage === stage,
  }));

  // Live from the home visit until the result is signed off.
  const heroLive = stage >= 4 && stage <= 6;
  const exceptions = heroLive ? [HERO_EXCEPTION, ...baseExceptions] : [...baseExceptions];

  return { pipeline, exceptions };
}
