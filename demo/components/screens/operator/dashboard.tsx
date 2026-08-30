"use client";
import { Metrics } from "./metrics";
import { Pipeline } from "./pipeline";
import { Exceptions } from "./exceptions";
import { SecondaryPanels } from "./panels";
import { BRAND_NAME } from "@/lib/mock-data";

/** One ruthlessly composed screen, not a multi-tab app (spec §3). */
export function OperatorDashboard() {
  return (
    <div className="min-h-[100dvh] bg-brand-bg p-6 text-brand-navy">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6">
          <span className="text-[10px] font-extrabold uppercase tracking-[.2em] text-brand-teal">
            {BRAND_NAME} operations
          </span>
          <h1 className="mt-2 text-[28px] font-extrabold tracking-[-.02em]">Everything, right now</h1>
        </header>

        <Metrics />

        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_400px]">
          <Pipeline />
          <Exceptions />
        </div>

        <div className="mt-4"><SecondaryPanels /></div>
      </div>
    </div>
  );
}
