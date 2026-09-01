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
      {/* Below `md` the same panel stacks above the work; from `md` it moves
         into VideoSplit's column. One tile, one shape, every role. */}
      <AudiologistStrip note={note} active={active} className="md:hidden" />
      <VideoSplit hideVideoBelowMd video={<ZoomPanel note={note} active={active} />}>
        {children}
      </VideoSplit>
    </>
  );
}

/**
 * Dr. Reed on the patient's own screen (refined 2026-08-31): the SAME 4:3
 * call panel every other role sees, laid full-width in the patient's phone
 * column instead of in `VideoSplit`'s 380px one.
 *
 * It renders `ZoomPanel` rather than a second layout of its own. Before, this
 * was a slim strip with a 96x80 thumbnail, so the patient's five screens
 * showed the call at a different size and shape from the CMA's and the
 * audiologist's — the one thing `VideoSplit` exists to prevent. The column
 * differs by device; the tile inside it must not.
 *
 * Capped at 380px — VideoSplit's column width — so the call is the same size
 * on a `wide` screen (Compare) as on a phone-width one. Without the cap it
 * stretched to the wide column and rendered 961px against the exam screens'
 * 457px, which is the same inconsistency in the other direction.
 */
export function AudiologistStrip({ note, active = false, className }:
  { note: string; active?: boolean; className?: string }) {
  return <div className={cn("mb-4 w-full max-w-[380px]", className)}><ZoomPanel note={note} active={active} /></div>;
}

export function ZoomPanel({ note, active }: { note: string; active: boolean }) {
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

        {/* Nameplate, anchored to the bottom of the frame. The name and title
            `truncate` rather than wrap, so this band's height is fixed no
            matter how the rem base moves — it can never grow to cover her
            face the way the caption did. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-black/75 via-black/45 to-transparent px-4 pb-3 pt-12">
          <div className="min-w-0">
            {/* The credential wraps to its own line rather than truncating.
                At 320px with an enlarged browser font this lost 36% of
                itself, cutting "Dr. Susan Reed, Au.D." mid-credential —
                and the Au.D. is the thing that makes her the person who may
                legally sign the audiogram. Wrapping is safe now that the
                caption has moved out of the frame: this band sits at the
                bottom, so a second line grows downward into the gradient,
                not up over her face. */}
            <p className="text-[15px] font-extrabold leading-tight text-white">{clinician.name}, {clinician.credential}</p>
            {/* "Licensed Audiologist · Florida" lost a quarter of itself to
                the ellipsis at a large rem base, cutting the line mid-word.
                Dropping `truncate` here lets it wrap to a second line
                instead: the credential and its licence state both survive,
                and because this sits in a bottom-anchored band OUTSIDE the
                caption (which now lives below the frame), one extra line
                cannot grow back over Dr. Reed's face. The name above keeps
                its `truncate` — one long name should not push the video
                around. */}
            <p className="mt-0.5 text-xs leading-tight text-white/75">
              Licensed Audiologist · {clinician.licenseState}
            </p>
          </div>
          <span className="flex shrink-0 gap-2">
            {[Mic, Video].map((I, i) => (
              <span key={i} className="grid h-9 w-9 place-items-center rounded-full bg-white/15 text-white"><I size={15} /></span>
            ))}
          </span>
        </div>
      </div>

      {/* Her words, BELOW the frame rather than over it (owner, 2026-09-01:
          "there is a text on the video on the phone. Maybe put the text below
          the video").

          This caption used to sit inside the 4:3 frame, stacked under the
          nameplate in the same bottom-anchored column. That column grows
          upward as the note gets longer, and on a phone — where the frame is
          only ~340px wide and the rem base is larger — a two-line note on the
          desktop became a six-line block that covered Dr. Reed's face
          entirely, which is the one thing the live call is there to show.

          Below the frame it cannot cover anything, no matter how long the
          note or how large the text: the tile simply gets taller. It also
          stops being white-on-video, so it no longer depends on whatever
          happens to be behind it for legibility — it now reads as ordinary
          dark-on-light caption text, matched to the card it sits in. The
          `active` state keeps its distinction through weight and the teal
          rule, mirroring the panel's own active border. */}
      <p className={cn(
        "border-t px-4 py-3 text-sm leading-relaxed",
        active
          ? "border-brand-teal/30 bg-[#f0fbfa] font-semibold text-brand-navy"
          : "border-[#e4eef0] bg-white text-[#3f5061]")}>
        {note}
      </p>
    </div>
  );
}
