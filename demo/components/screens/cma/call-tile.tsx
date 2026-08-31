"use client";
import { Mic, Video } from "lucide-react";
import { cn } from "@/lib/cn";
import { clinician } from "@/lib/mock-data";

/**
 * The audiologist's live video presence on the CMA's screen (corrections
 * sheet 2026-08-31, item 13). She is on the call for the whole visit — exam
 * through purchase — because only she can recommend and sell; the CMA
 * facilitates. Every CMA screen from arrival to activation renders this tile,
 * so the demo never shows the CMA acting alone.
 *
 * `active` marks the moments she is speaking or has taken over — the tile
 * brightens rather than appearing, because she never left.
 */
export function AudiologistCallTile({ note, active = false }: { note: string; active?: boolean }) {
  return (
    <div className={cn(
      "mb-4 flex items-stretch gap-3 rounded-[24px] border bg-white p-3 shadow-card",
      active ? "border-brand-teal ring-1 ring-brand-teal" : "border-[#e4eef0]")}>
      {/* The "video feed" — framed like a call, not an avatar chip. */}
      <div className="relative grid h-20 w-24 shrink-0 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#16426c] to-[#0c2340]">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-white/90 text-sm font-extrabold text-brand-navy">SR</span>
        <span className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-white">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> Live
        </span>
        <span className="absolute bottom-1.5 right-1.5 flex gap-1 text-white/80">
          <Mic size={11} /> <Video size={11} />
        </span>
      </div>
      <div className="min-w-0 flex-1 py-1">
        <b className="block text-xs">{clinician.name}, {clinician.credential}</b>
        <p className="text-[11px] text-slate-500">Licensed · {clinician.licenseState} · on the call</p>
        <p className={cn("mt-1.5 text-[11px] leading-4", active ? "font-semibold text-brand-navy" : "text-slate-500")}>
          {note}
        </p>
      </div>
    </div>
  );
}
