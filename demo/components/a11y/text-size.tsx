"use client";
import { useEffect, useState } from "react";
import { Type } from "lucide-react";
import { cn } from "@/lib/cn";

const SIZES = [
  { id: "standard", label: "A", scale: 1 },
  { id: "large", label: "A", scale: 1.15 },
  { id: "larger", label: "A", scale: 1.3 },
] as const;

/**
 * Patient-facing text-size control (patient persona §2).
 * Lives in the product UI, not the demo shell — a real patient would have this.
 * Scales the root font size, so every rem-based size follows.
 */
export function TextSize() {
  const [i, setI] = useState(0);

  useEffect(() => {
    document.documentElement.style.fontSize = `${SIZES[i].scale * 100}%`;
    return () => { document.documentElement.style.fontSize = ""; };
  }, [i]);

  return (
    <div className="flex items-center gap-1 rounded-full bg-white p-1 shadow-soft" role="group" aria-label="Text size">
      <Type size={14} className="ml-1.5 text-slate-400" aria-hidden />
      {SIZES.map((s, idx) => (
        <button
          key={s.id}
          onClick={() => setI(idx)}
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
