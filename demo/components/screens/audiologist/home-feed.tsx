"use client";
import { Mic, Video } from "lucide-react";
import { Card } from "../../ui";
import { cma, patient } from "@/lib/mock-data";

/**
 * The audiologist SEES and HEARS the room, from the first test until the
 * patient is fitted and happy (refined 2026-08-31): a live feed of the CMA
 * and patient with the patient's responses as Zoom-style captions, and a
 * talk-back control — "I can hear it / I can't hear that one" flows both
 * ways, so her feedback lands mid-test, not after it.
 *
 * ONE size on purpose: the feed renders inside `VideoSplit`'s fixed column
 * with the same 4:3 pane as the CMA's view of her, so the call looks
 * identical wherever it appears.
 */
export function HomeFeed({ cmaName = cma.name }: { cmaName?: string }) {
  return (
    <Card className="overflow-hidden">
      <div className="relative grid aspect-[4/3] place-items-center bg-gradient-to-br from-[#16426c] to-[#0c2340]">
        <div className="flex items-center gap-5 pb-10">
          {[["ML", `CMA ${cmaName}`], ["AR", patient.name]].map(([initials, label]) => (
            <div key={label} className="text-center">
              <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-white/90 text-xl font-extrabold text-brand-navy">
                {initials}
              </span>
              <span className="mt-1.5 block text-[10px] font-semibold text-white/75">{label}</span>
            </div>
          ))}
        </div>
        <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-red-500 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-white">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white motion-reduce:animate-none" /> Live
        </span>
        <span className="absolute right-3 top-3 flex gap-1.5 text-white/80">
          <Mic size={12} /> <Video size={12} />
        </span>
        {/* The patient's words land as live captions, the way a call renders speech. */}
        <div className="absolute inset-x-3 bottom-3 space-y-1 text-center">
          <p className="mx-auto w-fit max-w-full truncate rounded-full bg-black/55 px-3 py-1 text-xs text-white">
            <b>{patient.name}:</b> &ldquo;I can hear that one.&rdquo;
          </p>
          <p className="mx-auto w-fit max-w-full animate-pulse truncate rounded-full bg-black/55 px-3 py-1 text-xs text-white motion-reduce:animate-none">
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
