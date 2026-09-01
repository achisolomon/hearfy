"use client";
import { Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/cn";
import type { VideoSound } from "@/lib/use-video-sound";

/**
 * The one sound control, shared by both call tiles (owner, 2026-09-01: the
 * same mute/unmute behaviour on all the screens).
 *
 * It sits in each tile's existing control row beside the mic and camera
 * glyphs, and is the only live control among them — those two are decorative
 * state, this one does something — so it alone carries hover and focus
 * treatment.
 *
 * Renders nothing until the loaded clip is known to carry audio, so it can
 * never be a dead button on a silent clip (Dr. Reed's `idle` loop is silent
 * on purpose: it plays where the app says she is listening, and sound there
 * would contradict the UI).
 */
export function SoundButton({ audio, className }:
  { audio: VideoSound; className?: string }) {
  if (!audio.hasAudio) return null;
  const label = audio.sound ? "Mute" : "Hear";
  return (
    <button
      type="button"
      onClick={audio.toggle}
      aria-pressed={audio.sound}
      aria-label={label}
      title={label}
      className={cn(
        "grid h-9 w-9 place-items-center rounded-full bg-white/15 text-white transition",
        "hover:bg-white/30 focus-visible:outline focus-visible:outline-2",
        "focus-visible:outline-offset-2 focus-visible:outline-white",
        className)}
    >
      {audio.sound
        ? <Volume2 size={15} aria-hidden />
        : <VolumeX size={15} aria-hidden />}
    </button>
  );
}
