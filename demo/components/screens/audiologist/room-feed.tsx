"use client";
import { useEffect, useRef, useState } from "react";
import { asset } from "@/lib/asset";
import { cn } from "@/lib/cn";

/**
 * The room's camera feed — Maya and Alex at the table, the footage that
 * replaced the "ML" / "AR" initials circles (2026-09-01).
 *
 * The mirror of `ReedFeed`: same contract, other side of the same call. She
 * sees the room here; they see her there. Both are silent, both loop, and
 * both keep the call chrome in the DOM rather than baked into the frame.
 *
 * One clip so far — the pure-tone beat, the only stretch of the source take
 * whose first and last frames match closely enough to loop without a visible
 * jump. The remaining beats in `internal/docs/assets/room-video-prompts.md`
 * are still to be generated, so `beat` falls back to this clip rather than
 * rendering a beat the footage does not show.
 */
const CLIPS: Record<string, string> = {
  puretone: "/video/room-puretone.mp4",
};

const POSTER = "/video/room-puretone-poster.jpg";

export function RoomFeed({ beat = "puretone", className }:
  { beat?: string; className?: string }) {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLVideoElement>(null);
  const src = asset(CLIPS[beat] ?? CLIPS.puretone);

  // Same reason as ReedFeed: swapping `src` on a live element keeps the old
  // frame until the new one decodes, so reload and replay on change.
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.load();
    void v.play().catch(() => {});
  }, [src]);

  const label = "Maya and the patient on the live call";

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
    <video
      ref={ref}
      src={src}
      poster={asset(POSTER)}
      autoPlay
      loop
      muted
      playsInline
      aria-label={label}
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
