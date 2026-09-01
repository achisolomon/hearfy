"use client";
import { useEffect, useState } from "react";
import { asset } from "@/lib/asset";
import { cn } from "@/lib/cn";
import { useVideoSound, type VideoSound } from "@/lib/use-video-sound";

/**
 * Dr. Reed's actual camera feed — the footage that replaced the "SR" initials
 * placeholder (2026-08-31).
 *
 * Two loops cut from one source take, because the tile has two states and they
 * must not look alike:
 * - `idle` — the one closed-mouth stretch of the take, ping-ponged. Plays
 *   wherever the app is NOT showing the SPEAKING pill. She is present and
 *   listening, not silently mouthing at the patient.
 * - `speaking` — a continuous talking stretch, for `active` beats.
 *
 * Sound is muted by default and unmutable by a click (owner, 2026-09-01), the
 * same as the room feed — `useVideoSound` holds that behaviour so the two
 * sides of the call cannot drift apart. `muted` stays in the markup because
 * autoplay is granted only to muted video; the control flips it on the live
 * element inside a click.
 *
 * Only the `speaking` clip carries audio. `idle` is silent on purpose: it
 * plays wherever the app is NOT showing the SPEAKING pill, so a voice there
 * would contradict the interface. The control hides itself on a silent clip
 * rather than becoming a dead button.
 *
 * Under `prefers-reduced-motion` the video is never mounted — the poster frame
 * stands in, per the demo-wide reduced-motion contract.
 */
export function ReedFeed({ active, className, onAudio }:
  { active: boolean; className?: string;
    /** Lets the surrounding tile render the sound control in its own control
        row, instead of this feed floating a second cluster over her face. */
    onAudio?: (a: VideoSound) => void }) {
  const reduced = usePrefersReducedMotion();
  const src = asset(active ? "/video/reed-speaking.mp4" : "/video/reed-idle.mp4");
  const audio = useVideoSound(src);
  const ref = audio.ref;

  // Swapping `src` on a live element keeps the old frame until the new one
  // decodes; reloading and replaying makes the state change visible at once.
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.load();
    void v.play().catch(() => {});
  }, [src]);

  // Report upward on change, in an effect, so the parent is never asked to
  // set state while this component is rendering.
  useEffect(() => {
    onAudio?.(audio);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audio.hasAudio, audio.sound]);

  if (reduced) {
    return (
      <img
        src={asset("/video/reed-poster.jpg")}
        alt="Dr. Susan Reed on the live call"
        className={cn("h-full w-full object-cover", className)}
      />
    );
  }

  return (
    <video
      ref={ref}
      src={src}
      poster={asset("/video/reed-poster.jpg")}
      autoPlay
      loop
      muted
      playsInline
      onLoadedData={audio.onLoadedData}
      aria-label="Dr. Susan Reed on the live call"
      className={cn("h-full w-full object-cover", className)}
    />
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
