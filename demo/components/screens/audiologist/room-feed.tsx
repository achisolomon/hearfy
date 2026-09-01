"use client";
import { useEffect, useState } from "react";
import { asset } from "@/lib/asset";
import { cn } from "@/lib/cn";
import { useVideoSound, type VideoSound } from "@/lib/use-video-sound";

/**
 * The room's camera feed — the patient, alone, in his own home.
 *
 * The mirror of `ReedFeed`: same contract, other side of the same call. She
 * sees the room here; he sees her there. Both are silent, both loop, and
 * both keep the call chrome in the DOM rather than baked into the frame.
 *
 * PATIENT ONLY (owner, 2026-09-01). This was a two-shot of the CMA and the
 * patient at a table; it is now the patient by himself at his laptop. The
 * decision is the product's, not the frame's — what the audiologist watches
 * is the person being examined, and a clip is the wrong place to assert who
 * else is standing in the room.
 *
 * One clip covers every beat. The source take is continuous — the patient
 * listens and answers throughout, never returning to a rest pose — so unlike
 * the previous footage there is no stretch whose first and last frames match.
 * A hard cut jumped badly (best seam 10.6 against Dr. Reed's 0.36/2.62), so
 * the loop is built by dissolving the take's tail back onto its own head:
 * the clip's last frame IS its first, blended, and the seam measures 1.38.
 * See `internal/docs/assets/room-video-prompts.md` for the exact command.
 *
 * `beat` is kept because the call sites name their beat and the prompts doc
 * still plans per-beat footage; every beat resolves to this clip until more
 * exists, so no screen can render a missing file.
 *
 * SOUND: muted by default, clickable to hear (owner, 2026-09-01). Muted is
 * not a style choice — a browser only grants autoplay to a muted video, so
 * the feed must start silent or it does not start at all. The control
 * unmutes on a real click, which is the gesture that earns audio playback.
 * It renders only when the clip actually carries an audio track, so the
 * button can never be a dead control (Dr. Reed's footage is silent, which is
 * why `ReedFeed` has no such button).
 */
/**
 * Two moods, because one clip cannot be honest on every screen (owner,
 * 2026-09-01: on the shortlist screen "Alex is speaking, but here he should be
 * nodding because he is listening to the audiologist").
 *
 * - `testing` — mid exam: headphones on, answering, his own voice on the
 *   track. Right where the app says he is being tested.
 * - `listening` — Dr. Reed is presenting or asking, and he is attending to
 *   her: mouth closed, warm and attentive, and SILENT, because talking over
 *   her is exactly the mismatch this split fixes.
 */
const CLIPS = {
  testing: { src: "/video/room-patient.mp4", poster: "/video/room-patient-poster.jpg" },
  listening: { src: "/video/room-listening.mp4", poster: "/video/room-listening-poster.jpg" },
} as const;

export type RoomBeat = keyof typeof CLIPS;

/** Beats that are the patient being examined; everything else is listening. */
const TESTING_BEATS = new Set(["puretone", "otoscopy", "tympanometry", "speech", "bone", "testing"]);

export function RoomFeed({ beat = "listening", className, onAudio }:
  { beat?: string; className?: string;
    /** Lets the surrounding tile render the sound control in its own
        control row instead of the feed floating a second cluster over the
        picture. The feed owns the <video>; the tile owns the chrome. */
    onAudio?: (a: VideoSound) => void }) {
  const reduced = usePrefersReducedMotion();
  // Default to listening: most screens carrying this feed are consult and
  // review screens where Dr. Reed is doing the talking.
  const clip = CLIPS[TESTING_BEATS.has(beat) ? "testing" : "listening"];
  const src = asset(clip.src);
  const audio = useVideoSound(src);
  const ref = audio.ref;

  // Same reason as ReedFeed: swapping `src` on a live element keeps the old
  // frame until the new one decodes, so reload and replay on change.
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.load();
    void v.play().catch(() => {});
  }, [src]);

  const label = "The patient on the live call";
  const poster = asset(clip.poster);

  // Report audio state upward whenever it changes, so the tile's control row
  // can show (or hide) the toggle. Effect, not render-time, so the parent is
  // never asked to set state while this component is rendering.
  useEffect(() => {
    onAudio?.(audio);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audio.hasAudio, audio.sound]);

  if (reduced) {
    return (
      <img
        src={poster}
        alt={label}
        className={cn("h-full w-full object-cover", className)}
      />
    );
  }

  return (
    <>
      <video
        ref={ref}
        src={src}
        poster={poster}
        autoPlay
        loop
        muted
        playsInline
        onLoadedData={audio.onLoadedData}
        aria-label={label}
        className={cn("h-full w-full object-cover", className)}
      />
    </>
  );
}

/** Matches the demo's reduced-motion contract, and follows later changes. */
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const q = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(q.matches);
    const on = (e: MediaQueryListEvent) => setReduced(e.matches);
    q.addEventListener("change", on);
    return () => q.removeEventListener("change", on);
  }, []);
  return reduced;
}
