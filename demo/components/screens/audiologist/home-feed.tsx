"use client";
import { useState } from "react";
import { Mic, Video, Volume2, VolumeX } from "lucide-react";
import { cma, patient } from "@/lib/mock-data";
import { cn } from "@/lib/cn";
import { RoomFeed, type RoomAudio } from "./room-feed";

/**
 * The audiologist SEES and HEARS the room, from the first test until the
 * patient is fitted and happy (refined 2026-08-31): a live feed of the
 * patient with his responses as Zoom-style captions, and a talk-back
 * control — "I can hear it / I can't hear that one" flows both ways, so her
 * feedback lands mid-test, not after it.
 *
 * The camera is on the PATIENT only (owner, 2026-09-01); it was a two-shot
 * with the CMA. The CMA is still in the room and the talk-back still
 * addresses them both — she is simply not the subject of the feed.
 *
 * ONE size on purpose: the feed renders inside `VideoSplit`'s fixed column
 * with the same 4:3 pane as the CMA's view of her, so the call looks
 * identical wherever it appears.
 *
 * And ONE styling, not just one size (owner, 2026-09-01: "Use the video
 * styling of Dr. Susan with all the videos of Alex and Maya. It needs to
 * look the same. No text on the picture itself."). This tile is the mirror
 * of `ZoomPanel` in `cma/call-tile.tsx` — same rounded shell, same corner
 * pills, same bottom-anchored nameplate band with the call controls in it,
 * and the speech BELOW the frame rather than over it. The two sides of one
 * call cannot be styled differently without looking like two products.
 *
 * Nothing is drawn over the picture except the two corner pills, which sit
 * in the corners by design; every word lives in the gradient band at the
 * bottom or in the caption below the frame. The footage itself carries no
 * baked-in text — see `internal/docs/assets/room-video-prompts.md`.
 */
export function HomeFeed({ cmaName = cma.name, beat, active = false }:
  { cmaName?: string; beat?: string; active?: boolean }) {
  // The feed owns the audio (it owns the <video>), but the button belongs in
  // this tile's control row, so the feed reports its audio state up and the
  // tile draws the control — rather than a second cluster floating over the
  // picture.
  const [audio, setAudio] = useState<RoomAudio | null>(null);
  return (
    <div className={cn(
      "overflow-hidden rounded-[28px] border bg-white shadow-card",
      active ? "border-brand-teal ring-1 ring-brand-teal" : "border-[#e4eef0]")}>
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-[#16426c] to-[#0c2340]">
        <RoomFeed beat={beat} onAudio={setAudio} />

        {/* Call chrome, anchored to the frame's own corners — never to the
            nameplate column, or it drifts down the feed as the names grow.
            Same geometry and type scale as ZoomPanel's. */}
        <span className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-[#dc2626] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white">
          <span className="h-2 w-2 animate-pulse rounded-full bg-white motion-reduce:animate-none" /> Live
        </span>
        {active && (
          <span className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-teal-ink px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white">
            <span className="h-2 w-2 animate-pulse rounded-full bg-white motion-reduce:animate-none" /> Speaking
          </span>
        )}

        {/* Nameplate, anchored to the bottom of the frame, exactly as on Dr.
            Reed's tile: who is in the room on the left, the call controls on
            the right, both sitting in a gradient that fades up into the
            picture. This replaces the small pill that used to float over
            the frame — the name now reads against the gradient instead of
            against a face, and the band's own height absorbs a larger rem
            base by growing downward. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-black/75 via-black/45 to-transparent px-4 pb-3 pt-12">
          <div className="min-w-0">
            {/* Mirrors ZoomPanel's two lines: who this is on top, their
                standing underneath. Hers reads "Dr. Susan Reed, Au.D." /
                "Licensed Audiologist · Florida".

                It names ONLY the patient, because only the patient is in
                frame (owner, 2026-09-01 — the feed became patient-only). A
                nameplate that still read "Alex · CMA Maya L." over a shot of
                one man would caption someone who is not there. Maya's
                presence is stated where it is true — the talk-back control
                below still addresses them both, since she is in the room,
                just not on this camera. */}
            <p className="text-[15px] font-extrabold leading-tight text-white">
              {patient.name}
            </p>
            <p className="mt-0.5 text-xs leading-tight text-white/75">
              Patient · {patient.city}
            </p>
          </div>
          {/* The sound toggle leads the row: it is the only one of these
              that does anything, and it sits nearest the frame's edge where
              a call's volume control is expected. */}
          <span className="pointer-events-auto flex shrink-0 gap-2">
            {audio?.hasAudio && (
              <button
                type="button"
                onClick={audio.toggle}
                aria-pressed={audio.sound}
                aria-label={audio.sound ? "Mute the room" : "Hear the room"}
                title={audio.sound ? "Mute the room" : "Hear the room"}
                className="grid h-9 w-9 place-items-center rounded-full bg-white/15 text-white transition hover:bg-white/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                {audio.sound
                  ? <Volume2 size={15} aria-hidden />
                  : <VolumeX size={15} aria-hidden />}
              </button>
            )}
            {[Mic, Video].map((I, i) => (
              <span key={i} className="grid h-9 w-9 place-items-center rounded-full bg-white/15 text-white"><I size={15} /></span>
            ))}
          </span>
        </div>
      </div>

      {/* The patient's words, BELOW the frame — the same move made on Dr.
          Reed's tile (owner, 2026-09-01: "there is a text on the video on the
          phone. Maybe put the text below the video"), for the same reason and
          now for the same reason again on this side: bubbles floating over
          the picture sat squarely on a face.

          Below the frame they cannot cover anyone, however long the line or
          large the text — the tile simply gets taller. They also stop being
          white-on-video, so legibility no longer depends on whatever happens
          to be behind them; this is ordinary dark-on-light caption text
          matched to the card, like hers. The live one keeps its pulse and the
          teal treatment that ZoomPanel gives an `active` note. */}
      <div className="border-t border-[#e4eef0] bg-white px-4 py-3">
        <p className="text-sm leading-relaxed text-[#3f5061]">
          <b className="font-semibold text-brand-navy">{patient.name}:</b>{" "}
          &ldquo;I can hear that one.&rdquo;
        </p>
        <p className="mt-1 animate-pulse text-sm font-semibold leading-relaxed text-brand-navy motion-reduce:animate-none">
          <b className="font-semibold">{patient.name}:</b>{" "}
          &ldquo;…I can&rsquo;t hear anything now.&rdquo;
        </p>
      </div>

      <button className="flex w-full items-center gap-2 border-t border-[#eef4f5] p-3 text-left">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-navy text-white"><Mic size={13} /></span>
        <span className="text-[11px] font-bold text-brand-navy">
          Talk to the room — {cmaName.split(" ")[0]} and {patient.name} hear you
        </span>
      </button>
    </div>
  );
}
