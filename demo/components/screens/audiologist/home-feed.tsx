"use client";
import { Mic, Video } from "lucide-react";
import { Card } from "../../ui";
import { cn } from "@/lib/cn";
import { cma, patient } from "@/lib/mock-data";

/**
 * The audiologist SEES and HEARS the room, from the first test until the
 * patient is fitted and happy (refined 2026-08-31): a live feed of the CMA
 * and patient with the patient's responses as Zoom-style captions, and a
 * talk-back control — "I can hear it / I can't hear that one" flows both
 * ways, so her feedback lands mid-test, not after it.
 *
 * `hero` renders it as the dominant pane (the monitoring screen); the
 * default sidebar size keeps the room in view on every other screen of hers
 * until the session ends.
 */
export function HomeFeed({ cmaName = cma.name, hero = false }:
  { cmaName?: string; hero?: boolean }) {
  return (
    <Card className="overflow-hidden">
      <div className={cn(
        "relative grid place-items-center bg-gradient-to-br from-[#16426c] to-[#0c2340]",
        hero ? "h-64 lg:h-[420px]" : "h-40")}>
        <div className={cn("flex items-center", hero ? "gap-6 pb-10" : "gap-3 pb-8")}>
          {[["ML", `CMA ${cmaName}`], ["AR", patient.name]].map(([initials, label]) => (
            <div key={label} className="text-center">
              <span className={cn(
                "mx-auto grid place-items-center rounded-full bg-white/90 font-extrabold text-brand-navy",
                hero ? "h-16 w-16 text-xl lg:h-24 lg:w-24 lg:text-3xl" : "h-12 w-12 text-sm")}>
                {initials}
              </span>
              <span className="mt-1.5 block text-[10px] font-semibold text-white/75">{label}</span>
            </div>
          ))}
        </div>
        <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-red-500 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-white">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> Live
        </span>
        <span className="absolute right-3 top-3 flex gap-1.5 text-white/80">
          <Mic size={12} /> <Video size={12} />
        </span>
        {/* The patient's words land as live captions, the way a call renders speech. */}
        <div className="absolute inset-x-3 bottom-3 space-y-1 text-center">
          <p className={cn("mx-auto w-fit max-w-full truncate rounded-full bg-black/55 px-3 py-1 text-white",
            hero ? "text-xs" : "text-[10px]")}>
            <b>{patient.name}:</b> &ldquo;I can hear that one.&rdquo;
          </p>
          <p className={cn("mx-auto w-fit max-w-full animate-pulse truncate rounded-full bg-black/55 px-3 py-1 text-white motion-reduce:animate-none",
            hero ? "text-xs" : "text-[10px]")}>
            <b>{patient.name}:</b> &ldquo;…I can&rsquo;t hear anything now.&rdquo;
          </p>
        </div>
      </div>
      <button className="flex w-full items-center gap-2 border-t border-[#eef4f5] p-3 text-left">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-navy text-white"><Mic size={13} /></span>
        <span className="text-[11px] font-bold text-brand-navy">
          Talk to the room — {cmaName.split(" ")[0]} and {patient.name} hear you
        </span>
      </button>
    </Card>
  );
}
