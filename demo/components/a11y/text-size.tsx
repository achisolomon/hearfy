"use client";
import { useEffect, useSyncExternalStore } from "react";
import { Type } from "lucide-react";
import { cn } from "@/lib/cn";
import { useStoryOptional } from "../shell/story-context";

const SIZES = [
  { id: "standard", label: "A", scale: 1 },
  { id: "large", label: "A", scale: 1.15 },
  { id: "larger", label: "A", scale: 1.3 },
] as const;

/**
 * Selected text-size index, held outside React.
 *
 * The patient Shell that hosts this control unmounts and remounts on every
 * beat change as the presenter moves through the walkthrough, so a choice
 * held in `useState` would quietly revert. Holding it here — same pattern as
 * lib/latch — lets it survive the remount. `resetTextSize` exists for the
 * other end: a fresh walkthrough should start from the standard size, so it
 * is cleared alongside the clinical latches when the cover screen mounts.
 */
let index = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());

const getIndex = () => index;
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};

function setIndex(i: number) {
  index = i;
  emit();
}

/** The root font-size for a given SIZES scale.
 *
 * This was `${scale * 112.5}%` — a percentage of the browser's own default.
 * That default is 16px on a desktop but is scaled by the OS/browser "font
 * size" accessibility setting on a phone, so the percentage multiplied it and
 * the rem base ran away (see the `html` rule in globals.css for the measured
 * damage). Mirroring that rule's `clamp()` keeps this control authoritative
 * over its own three steps while staying inside the same safe 18–22px band,
 * scaled per step. The user's own setting still shows through the `1.125rem`
 * preferred term, so asking the phone for bigger text still does something. */
const rootFontSize = (scale: number) =>
  `clamp(${18 * scale}px, ${1.125 * scale}rem, ${22 * scale}px)`;

/**
 * The current text-size step, for chrome that must react to it outside the
 * `TextSize` control itself.
 *
 * The phone docked bar (DemoShell) is rem-based like everything else, so it
 * scales together with the text — but the 375px viewport does not scale, and
 * at the largest step ("larger") the persona name/role column no longer has
 * room for the labelled "Next" pill. That can't be expressed as a Tailwind
 * responsive prefix (`lg:`/`md:`) because it isn't a viewport breakpoint —
 * it's this module's own runtime index, chosen independently of screen size.
 * This hook gives DemoShell (or any other consumer) read access to that same
 * `useSyncExternalStore`-backed index without duplicating the store.
 *
 * SSR-safe the same way `TextSize` itself is: the server snapshot is always
 * `0` (standard), so the first paint never disagrees with the client before
 * hydration reconciles it.
 */
export function useTextSizeIndex() {
  return useSyncExternalStore(subscribe, getIndex, () => 0);
}

/** True at the largest step ("larger") — the one step where the phone
 * docked bar's Next pill no longer fits beside the persona name/role. */
export function useIsLargestTextSize() {
  return useTextSizeIndex() === SIZES.length - 1;
}

/**
 * Reset to the standard size, for the start of a fresh walkthrough.
 *
 * Writes `document.documentElement.style.fontSize` directly rather than only
 * resetting the stored index. `Cover` calls this without rendering `Shell`,
 * so no `TextSize` instance is mounted to react to the index change and
 * rewrite the DOM — without this direct write, a root font size set by a
 * previous walkthrough (e.g. 130%) would persist onto whatever unrelated
 * screen renders next. Guarded for SSR / pre-hydration, where `document`
 * does not exist.
 */
export function resetTextSize() {
  setIndex(0);
  if (typeof document !== "undefined") {
    document.documentElement.style.fontSize = rootFontSize(SIZES[0].scale);
  }
}

/**
 * Patient-facing text-size control (patient persona §2).
 * Lives in the product UI, not the demo shell — a real patient would have this.
 * Scales the root font size, so every rem-based size follows.
 */
export function TextSize() {
  // The server render and the client's first paint must agree, and a fresh
  // page always starts at the standard size.
  const i = useSyncExternalStore(subscribe, getIndex, () => 0);
  // `Shell` (which mounts this) hosts both the patient app and the CMA
  // screens under the same `<StoryProvider>`, so this must render only for
  // the patient role (patient persona §2) — the CMA is a working
  // professional on their own device, not this control's audience.
  // `useStoryOptional` covers `Shell` being mounted with no provider above
  // it at all, in which case this stays patient-facing by default.
  const story = useStoryOptional();
  const hidden = story !== null && story.role !== "patient";

  useEffect(() => {
    if (hidden) return;
    document.documentElement.style.fontSize = rootFontSize(SIZES[i].scale);
    // No cleanup that resets fontSize here: this component remounts as the
    // presenter moves between beats, and a reset-on-unmount would silently
    // discard the chosen size. The stored index (and `resetTextSize`) is what
    // governs the applied size instead.
  }, [i, hidden]);

  if (hidden) return null;

  return (
    <div className="flex items-center gap-1 rounded-full bg-white p-1 shadow-soft" role="group" aria-label="Text size">
      <Type size={14} className="ml-1.5 text-slate-400" aria-hidden />
      {SIZES.map((s, idx) => (
        <button
          key={s.id}
          onClick={() => setIndex(idx)}
          aria-pressed={i === idx}
          aria-label={`${s.id} text size`}
          // h-11 (44px), not h-8: this is the low-vision patient's own
          // control, so it must clear the 44px touch minimum rather than sit
          // under it at 36px. The visual pill stays compact because the
          // buttons are round and the label inside them is unchanged.
          className={cn("grid h-11 w-11 place-items-center rounded-full font-bold transition",
            i === idx ? "bg-brand-navy text-white" : "text-slate-500 hover:bg-[#f1f5f6]")}
          style={{ fontSize: `${11 * s.scale}px` }}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
