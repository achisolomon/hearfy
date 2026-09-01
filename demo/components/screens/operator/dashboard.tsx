"use client";
import { Metrics } from "./metrics";
import { Pipeline } from "./pipeline";
import { Exceptions } from "./exceptions";
import { SecondaryPanels } from "./panels";
import { BRAND_NAME } from "@/lib/mock-data";
import { operatorStateAt } from "@/lib/operator-state";
import { useStory } from "../../shell/story-context";

/**
 * One ruthlessly composed screen, not a multi-tab app (spec §3).
 *
 * Jordan has NO controls: an operations board reflects a day that is
 * happening, it does not have a button that makes the day happen. It reacts to
 * the stage instead, so walking his day with the chrome's Next shows Alex's
 * case moving across the pipeline and into — then out of — the exception queue.
 */
export function OperatorDashboard() {
  const { stage } = useStory();
  const state = operatorStateAt(stage);

  return (
    <div className="min-h-[100dvh] bg-brand-bg p-6 pb-32 text-brand-navy md:pb-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6">
          <span className="text-[10px] font-extrabold uppercase tracking-[.2em] text-brand-teal">
            {BRAND_NAME} operations
          </span>
          <h1 className="mt-2 text-[28px] font-extrabold tracking-[-.02em]">Everything, right now</h1>
        </header>

        <Metrics />

        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_400px]">
          <Pipeline state={state} />
          <Exceptions state={state} />
        </div>

        <div className="mt-4"><SecondaryPanels /></div>
      </div>
    </div>
  );
}
