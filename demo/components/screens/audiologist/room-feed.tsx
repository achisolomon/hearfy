"use client";
import { useEffect, useRef, useState } from "react";
import { asset } from "@/lib/asset";
import { cn } from "@/lib/cn";

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
const PATIENT_CLIP = "/video/room-patient.mp4";

const CLIPS: Record<string, string> = {
  puretone: PATIENT_CLIP,
};

const POSTER = "/video/room-patient-poster.jpg";

export interface RoomAudio {
  /** True once the loaded clip is known to carry an audio track. */
  hasAudio: boolean;
  /** True when the viewer has turned sound on. */
  sound: boolean;
  toggle: () => void;
}

export function RoomFeed({ beat = "puretone", className, onAudio }:
  { beat?: string; className?: string;
    /** Lets the surrounding tile render the sound control in its own
        control row instead of the feed floating a second cluster over the
        picture. The feed owns the <video>; the tile owns the chrome. */
    onAudio?: (a: RoomAudio) => void }) {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLVideoElement>(null);
  const src = asset(CLIPS[beat] ?? PATIENT_CLIP);

  // Same reason as ReedFeed: swapping `src` on a live element keeps the old
  // frame until the new one decodes, so reload and replay on change.
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.load();
    void v.play().catch(() => {});
  }, [src]);

  const label = "The patient on the live call";

  // Muted until asked. `muted` is what lets the clip autoplay at all, so the
  // toggle flips the element's own property on a user gesture rather than
  // re-rendering with a different `muted` attribute, which browsers treat as
  // a fresh autoplay attempt and can refuse.
  const [sound, setSound] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);

  const toggleSound = () => {
    const v = ref.current;
    if (!v) return;
    const next = !sound;
    v.muted = !next;
    setSound(next);
    // A muted autoplaying element may have been paused by the browser; the
    // click is the gesture that lets it resume with sound.
    if (next) void v.play().catch(() => {});
  };

  // Only offer the control when there is something to hear. Some clips in
  // this set are silent, and a button that unmutes silence reads as broken.
  const onLoaded = () => {
    const v = ref.current as (HTMLVideoElement & {
      mozHasAudio?: boolean;
      webkitAudioDecodedByteCount?: number;
      audioTracks?: { length: number };
    }) | null;
    if (!v) return;
    setHasAudio(Boolean(
      v.mozHasAudio
      ?? (v.audioTracks ? v.audioTracks.length > 0 : undefined)
      ?? (v.webkitAudioDecodedByteCount !== undefined
        ? v.webkitAudioDecodedByteCount > 0
        : false),
    ));
  };

  // Report audio state upward whenever it changes, so the tile's control row
  // can show (or hide) the toggle. Effect, not render-time, so the parent is
  // never asked to set state while this component is rendering.
  useEffect(() => {
    onAudio?.({ hasAudio, sound, toggle: toggleSound });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAudio, sound]);

  if (reduced) {
    return (
      <img
        src={asset(POSTER)}
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
        poster={asset(POSTER)}
        autoPlay
        loop
        muted
        playsInline
        onLoadedData={onLoaded}
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
