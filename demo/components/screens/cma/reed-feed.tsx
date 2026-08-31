"use client";
import { useEffect, useRef, useState } from "react";
import { asset } from "@/lib/asset";
import { cn } from "@/lib/cn";

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
 * Silent by design: the demo has no audio, and an autoplaying video only gets
 * to autoplay at all because it is muted.
 *
 * Under `prefers-reduced-motion` the video is never mounted — the poster frame
 * stands in, per the demo-wide reduced-motion contract.
 */
export function ReedFeed({ active, className }: { active: boolean; className?: string }) {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLVideoElement>(null);
  const src = asset(active ? "/video/reed-speaking.mp4" : "/video/reed-idle.mp4");

  // Swapping `src` on a live element keeps the old frame until the new one
  // decodes; reloading and replaying makes the state change visible at once.
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.load();
    void v.play().catch(() => {});
  }, [src]);

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
