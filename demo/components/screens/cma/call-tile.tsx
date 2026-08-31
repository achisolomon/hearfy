"use client";
import { Mic, Video } from "lucide-react";
import { cn } from "@/lib/cn";
import { clinician } from "@/lib/mock-data";

/**
 * The audiologist's live video presence on the CMA's screen (corrections
 * sheet 2026-08-31, item 13). She is on the call from the first exam step
 * through the sale — only she can recommend and sell; the CMA facilitates.
 *
 * Two renderings of one presence:
 * - compact strip — phones, and screens that keep the single column;
 * - `zoom` — the CMA works a tablet (only the patient is on a phone), so
 *   from `md` (iPad portrait) up the call becomes a large Zoom-like panel
 *   beside the step content, with her note as a live caption. The patient
 *   should feel she is in the room.
 *
 * `active` marks the moments she is speaking or has taken over — the tile
 * brightens rather than appearing, because she never left.
 */
export function AudiologistCallTile({ note, active = false, zoom = false }:
  { note: string; active?: boolean; zoom?: boolean }) {
  if (!zoom) return <CompactTile note={note} active={active} />;
  return (
    <>
      <CompactTile note={note} active={active} className="md:hidden" />
      <div className="hidden md:block md:sticky md:top-6">
        <ZoomPanel note={note} active={active} />
      </div>
    </>
  );
}

/**
 * The tablet split every on-call CMA screen shares: Dr. Reed's Zoom panel on
 * the left, the work on the right; one column with the compact strip below
 * `md`. Children carry their own action button.
 */
export function CallSplit({ note, active = false, children }:
  { note: string; active?: boolean; children: React.ReactNode }) {
  return (
    <div className="md:grid md:grid-cols-2 md:items-start md:gap-6">
      <AudiologistCallTile zoom active={active} note={note} />
      <div>{children}</div>
    </div>
  );
}

function CompactTile({ note, active, className }: { note: string; active: boolean; className?: string }) {
  return (
    <div className={cn(
      "mb-4 flex items-stretch gap-3 rounded-[24px] border bg-white p-3 shadow-card",
      active ? "border-brand-teal ring-1 ring-brand-teal" : "border-[#e4eef0]", className)}>
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

function ZoomPanel({ note, active }: { note: string; active: boolean }) {
  return (
    <div className={cn(
      "overflow-hidden rounded-[28px] border bg-white shadow-card",
      active ? "border-brand-teal ring-1 ring-brand-teal" : "border-[#e4eef0]")}>
      <div className="relative grid aspect-[4/3] place-items-center bg-gradient-to-br from-[#16426c] to-[#0c2340]">
        <div className="text-center">
          <span className="mx-auto grid h-28 w-28 place-items-center rounded-full bg-white/90 text-3xl font-extrabold text-brand-navy">SR</span>
          <p className="mt-4 text-[15px] font-extrabold text-white">{clinician.name}, {clinician.credential}</p>
          <p className="mt-0.5 text-xs text-white/60">Licensed Audiologist · {clinician.licenseState}</p>
        </div>
        <span className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-red-500 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white">
          <span className="h-2 w-2 animate-pulse rounded-full bg-white" /> Live
        </span>
        {active && (
          <span className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-brand-teal px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white">
            <span className="h-2 w-2 animate-pulse rounded-full bg-white motion-reduce:animate-none" /> Speaking
          </span>
        )}
        <span className="absolute bottom-4 right-4 flex gap-2">
          {[Mic, Video].map((I, i) => (
            <span key={i} className="grid h-9 w-9 place-items-center rounded-full bg-white/15 text-white"><I size={15} /></span>
          ))}
        </span>
        {/* Her words land as a live caption, the way a call renders speech. */}
        <p className={cn(
          "absolute inset-x-6 bottom-4 mx-auto max-w-md rounded-2xl px-4 py-2.5 text-center text-xs leading-5 text-white",
          active ? "bg-black/60 font-semibold" : "bg-black/45")}>
          {note}
        </p>
      </div>
    </div>
  );
}
