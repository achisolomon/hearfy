"use client";
import { Mic, Video } from "lucide-react";
import { cn } from "@/lib/cn";
import { clinician } from "@/lib/mock-data";
import { VideoSplit } from "../video-split";
import { ReedFeed } from "./reed-feed";

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
 * brightens rather than appearing, because she never left. It also selects
 * which of her two camera loops plays (see `ReedFeed`): talking when active,
 * listening otherwise. The LIVE/SPEAKING pills, call controls and caption
 * stay DOM overlays on top of the footage — never baked into the video.
 */
export function AudiologistCallTile({ note, active = false }:
  { note: string; active?: boolean }) {
  return <AudiologistStrip note={note} active={active} />;
}

/**
 * The split every on-call CMA screen shares — the video geometry itself
 * (size, place, stickiness) lives in ONE component, `VideoSplit`, so the
 * call looks identical on every screen of both roles. Below `md` the
 * compact strip stands in. Children carry their own action button.
 */
export function CallSplit({ note, active = false, children }:
  { note: string; active?: boolean; children: React.ReactNode }) {
  return (
    <>
      <AudiologistStrip note={note} active={active} className="md:hidden" />
      <VideoSplit hideVideoBelowMd video={<ZoomPanel note={note} active={active} />}>
        {children}
      </VideoSplit>
    </>
  );
}

/**
 * The phone-sized presence: Dr. Reed as a slim call strip. The CMA sees it
 * below `md`; the PATIENT sees it on every exam screen — she is right next
 * to them in their home hearing lab (refined 2026-08-31).
 */
export function AudiologistStrip({ note, active = false, className }:
  { note: string; active?: boolean; className?: string }) {
  return (
    <div className={cn(
      "mb-4 flex items-stretch gap-3 rounded-[24px] border bg-white p-3 shadow-card",
      active ? "border-brand-teal ring-1 ring-brand-teal" : "border-[#e4eef0]", className)}>
      {/* Her real camera feed, framed like a call. */}
      <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-[#16426c] to-[#0c2340]">
        <ReedFeed active={active} />
        <span className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full bg-[#dc2626] px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-white">
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
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-[#16426c] to-[#0c2340]">
        <ReedFeed active={active} />

        {/* Call chrome, anchored to the frame's own corners — never to the
            caption column, or it drifts down the feed as the note grows. */}
        <span className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-[#dc2626] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white">
          <span className="h-2 w-2 animate-pulse rounded-full bg-white motion-reduce:animate-none" /> Live
        </span>
        {active && (
          <span className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-teal-ink px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white">
            <span className="h-2 w-2 animate-pulse rounded-full bg-white motion-reduce:animate-none" /> Speaking
          </span>
        )}

        {/* Nameplate above caption in one bottom-anchored column, so a long
            note pushes the stack up instead of colliding with the name. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-gradient-to-t from-black/75 via-black/45 to-transparent px-4 pb-4 pt-12">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[15px] font-extrabold leading-tight text-white">{clinician.name}, {clinician.credential}</p>
              <p className="mt-0.5 truncate text-xs text-white/75">Licensed Audiologist · {clinician.licenseState}</p>
            </div>
            <span className="flex shrink-0 gap-2">
              {[Mic, Video].map((I, i) => (
                <span key={i} className="grid h-9 w-9 place-items-center rounded-full bg-white/15 text-white"><I size={15} /></span>
              ))}
            </span>
          </div>
          {/* Her words land as a live caption, the way a call renders speech. */}
          <p className={cn(
            "rounded-2xl px-3 py-2 text-xs leading-5 text-white",
            active ? "bg-black/65 font-semibold" : "bg-black/50")}>
            {note}
          </p>
        </div>
      </div>
    </div>
  );
}
