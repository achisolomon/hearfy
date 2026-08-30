"use client";
import { useEffect, useSyncExternalStore } from "react";
import { Type } from "lucide-react";
import { cn } from "@/lib/cn";

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

/** Reset to the standard size, for the start of a fresh walkthrough. */
export function resetTextSize() {
  setIndex(0);
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

  useEffect(() => {
    document.documentElement.style.fontSize = `${SIZES[i].scale * 100}%`;
    // No cleanup that resets fontSize here: this component remounts as the
    // presenter moves between beats, and a reset-on-unmount would silently
    // discard the chosen size. The stored index (and `resetTextSize`) is what
    // governs the applied size instead.
  }, [i]);

  return (
    <div className="flex items-center gap-1 rounded-full bg-white p-1 shadow-soft" role="group" aria-label="Text size">
      <Type size={14} className="ml-1.5 text-slate-400" aria-hidden />
      {SIZES.map((s, idx) => (
        <button
          key={s.id}
          onClick={() => setIndex(idx)}
          aria-pressed={i === idx}
          aria-label={`${s.id} text size`}
          className={cn("grid h-8 w-8 place-items-center rounded-full font-bold transition",
            i === idx ? "bg-brand-navy text-white" : "text-slate-500")}
          style={{ fontSize: `${11 * s.scale}px` }}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
