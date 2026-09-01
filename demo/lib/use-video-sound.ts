"use client";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Sound for the demo's call feeds: muted by default, unmutable by a click
 * (owner, 2026-09-01 — "the default should be on mute, but I want to be able
 * to click and actually hear the videos", on all the screens).
 *
 * `muted` is not a style choice and must stay in the element's markup: a
 * browser grants autoplay ONLY to muted video, so shipping it unmuted stops
 * the feed playing at all. Sound is turned on by flipping `muted` on the live
 * element inside a real click handler — the user gesture is what earns audio
 * playback — rather than by re-rendering with a different attribute, which a
 * browser reads as a fresh autoplay attempt and may refuse.
 *
 * Both call feeds use this one hook so the two sides of the call cannot drift
 * into different behaviour, and so a clip that gains or loses an audio track
 * needs no component change.
 */
export interface VideoSound {
  /** True once the loaded clip is known to carry an audio track. */
  hasAudio: boolean;
  /** True when the viewer has turned sound on. */
  sound: boolean;
  toggle: () => void;
  /** Wire to the <video>'s `onLoadedData`. */
  onLoadedData: () => void;
  ref: React.RefObject<HTMLVideoElement | null>;
}

/** Chromium, Firefox and WebKit each expose "has audio" differently. */
function detectAudio(v: HTMLVideoElement): boolean {
  const el = v as HTMLVideoElement & {
    mozHasAudio?: boolean;
    webkitAudioDecodedByteCount?: number;
    audioTracks?: { length: number };
  };
  if (typeof el.mozHasAudio === "boolean") return el.mozHasAudio;
  if (el.audioTracks) return el.audioTracks.length > 0;
  if (typeof el.webkitAudioDecodedByteCount === "number") {
    return el.webkitAudioDecodedByteCount > 0;
  }
  return false;
}

export function useVideoSound(src: string): VideoSound {
  const ref = useRef<HTMLVideoElement>(null);
  const [sound, setSound] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);
  // The feeds call `video.load()` when the clip changes, which fires
  // `loadeddata` again. Read the viewer's choice through a ref so that
  // handler can never restore a stale value and silently re-mute a feed the
  // viewer had just turned on.
  const soundRef = useRef(sound);
  soundRef.current = sound;

  // A feed can swap clips (Dr. Reed's idle/speaking): re-detect, and carry the
  // viewer's choice across the swap so turning sound on does not silently
  // undo itself at the next state change.
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    setHasAudio(false);
    v.muted = !soundRef.current;
  }, [src]);

  const onLoadedData = useCallback(() => {
    const v = ref.current;
    if (!v) return;
    setHasAudio(detectAudio(v));
    // Keep the element's mute in step with the viewer's choice after a reload.
    v.muted = !soundRef.current;
  }, []);

  const toggle = useCallback(() => {
    const v = ref.current;
    if (!v) return;
    setSound(prev => {
      const next = !prev;
      v.muted = !next;
      // A muted autoplaying element may have been paused by the browser; this
      // click is the gesture that lets it resume, now with sound.
      if (next) void v.play().catch(() => {});
      return next;
    });
  }, []);

  return { hasAudio, sound, toggle, onLoadedData, ref };
}
