"use client";
import { Mic, Video } from "lucide-react";
import { Card } from "../../ui";
import { cma, patient } from "@/lib/mock-data";
import { RoomFeed } from "./room-feed";

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
export function HomeFeed({ cmaName = cma.name, beat }: { cmaName?: string; beat?: string }) {
  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-[#16426c] to-[#0c2340]">
        {/* The room itself, replacing the "ML" / "AR" initials circles
            (2026-09-01). The gradient stays behind it as the ground the
            poster frame sits on, so the tile still reads as the same call
            surface it always was. */}
        <RoomFeed beat={beat} />
        <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-red-500 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-white">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white motion-reduce:animate-none" /> Live
        </span>
        <span className="absolute right-3 top-3 flex gap-1.5 text-white drop-shadow">
          <Mic size={12} /> <Video size={12} />
        </span>
        {/* Who is in the room — the names the initials circles used to carry.
            Kept as a small nameplate so the feed still identifies the pair,
            and truncating rather than wrapping so it cannot grow over the
            faces at a large rem base (same reasoning as ZoomPanel's). */}
        <span className="pointer-events-none absolute left-3 top-11 max-w-[calc(100%-1.5rem)] truncate rounded-full bg-black/45 px-2 py-0.5 text-[9px] font-semibold text-white">
          CMA {cmaName} · {patient.name}
        </span>
        {/* The patient's words land as live captions, the way a call renders speech.

            These wrap rather than `truncate`. With the in-app text control at
            its largest step AND the phone's own font enlarged, the two
            multiply to a ~28.6px rem base and the longer line lost 28% of
            itself — "…I can't hear anyth…" is the exact quote a viewer needs
            whole, since it is the moment the threshold is found. A caption is
            speech, and clipped speech says nothing; the bubbles are anchored
            to the bottom of the frame, so a second line grows downward within
            the pane rather than over the two-shot. `rounded-2xl`, not
            `rounded-full`, because a pill shape only reads correctly on a
            single line. */}
        <div className="absolute inset-x-3 bottom-3 space-y-1 text-center">
          <p className="mx-auto w-fit max-w-full rounded-2xl bg-black/55 px-3 py-1 text-xs leading-snug text-white">
            <b>{patient.name}:</b> &ldquo;I can hear that one.&rdquo;
          </p>
          <p className="mx-auto w-fit max-w-full animate-pulse rounded-2xl bg-black/55 px-3 py-1 text-xs leading-snug text-white motion-reduce:animate-none">
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
