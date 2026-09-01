"use client";
import { Card } from "../../ui";
import { cn } from "@/lib/cn";
import type { OperatorState } from "@/lib/operator-state";

export function Pipeline({ state }: { state: OperatorState }) {
  const max = Math.max(...state.pipeline.map(p => p.count));
  return (
    <Card className="p-5">
      <b className="text-sm">Pipeline — every patient, every stage</b>
      <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-9">
        {state.pipeline.map(p => (
          <div key={p.stage} className="text-center">
            <div className="flex h-24 items-end justify-center">
              <div
                className={cn(
                  "w-7 rounded-t-lg transition-all",
                  p.hero ? "bg-brand-navy" : "bg-brand-teal"
                )}
                style={{ height: `${Math.max(8, (p.count / max) * 100)}%` }}
              />
            </div>
            <b className="mt-2 block text-sm">{p.count}</b>
            <span className="block text-[10px] leading-tight text-slate-400">{p.stage}. {p.name}</span>
            {/* The one case the demo is following, so the board is legibly
                about Alex rather than an abstract funnel. Text, not colour
                alone — the navy bar above is a second cue, not the only one. */}
            {p.hero && (
              <span className="mt-1 block text-[10px] font-bold leading-tight text-brand-navy">
                A. Rivera here
              </span>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
