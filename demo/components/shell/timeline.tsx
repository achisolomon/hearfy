"use client";
import { STAGES, type StageNumber } from "@/lib/story";
import { cn } from "@/lib/cn";
import { useStory } from "./story-context";

export function Timeline({ full = false }: { full?: boolean }) {
  const { stage, goToStage } = useStory();
  return (
    <div className={cn("flex items-center gap-1", full && "flex-wrap gap-2")}>
      {STAGES.map(s => (
        <button
          key={s.n}
          onClick={() => goToStage(s.n as StageNumber)}
          title={`Stage ${s.n} — ${s.name}`}
          aria-current={stage === s.n ? "step" : undefined}
          className={cn(
            "grid h-7 w-7 place-items-center rounded-full text-[11px] font-bold transition",
            full && "h-auto w-auto rounded-full px-3 py-2 text-xs",
            stage === s.n
              ? "bg-brand-teal text-white"
              : stage > s.n
                ? "bg-[#d6efee] text-[#087d7a]"
                : "bg-white text-slate-400 hover:text-brand-navy"
          )}
        >
          {full ? `${s.n}. ${s.name}` : s.n}
        </button>
      ))}
    </div>
  );
}
