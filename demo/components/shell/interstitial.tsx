"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { STAGES } from "@/lib/story";
import { personaFor } from "@/lib/personas";
import { PersonaAvatar } from "../persona-avatar";
import { useStory } from "./story-context";

/** ~1s role-handoff announcement with the persona's face, tap to skip. */
export function Interstitial() {
  const { handoff, stage, clearHandoff } = useStory();

  useEffect(() => {
    if (!handoff) return;
    const t = setTimeout(clearHandoff, 1100);
    return () => clearTimeout(t);
  }, [handoff, clearHandoff]);

  const stageName = STAGES.find(s => s.n === stage)?.name ?? "";

  return (
    <AnimatePresence>
      {handoff && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={clearHandoff}
          className="fixed inset-0 z-50 grid place-items-center bg-brand-navy/95 px-6 text-center text-white"
        >
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[.25em] text-brand-teal">Now viewing as</p>
            <div className="mt-5 flex justify-center"><PersonaAvatar role={handoff} size="lg" ring /></div>
            <p className="mt-4 text-3xl font-extrabold tracking-[-.02em]">{personaFor(handoff).name}</p>
            <p className="mt-1 text-sm text-white/70">{personaFor(handoff).title}</p>
            <p className="mt-4 text-sm text-white/50">Stage {stage} — {stageName}</p>
            <p className="mt-8 text-[11px] text-white/40">Tap to skip</p>
          </div>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
