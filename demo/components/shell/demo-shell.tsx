"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, LayoutGrid, X } from "lucide-react";
import { BrandLogo } from "../ui";
import { Cover, EndCap } from "./cover";
import { Interstitial } from "./interstitial";
import { RoleTabs } from "./role-tabs";
import { RoleView } from "./role-view";
import { Timeline } from "./timeline";
import { prevBeatForRole } from "@/lib/story";
import { useStory } from "./story-context";

export function DemoShell() {
  const { phase, next, back, beat, mode, role, atWalkEnd } = useStory();
  const [sheet, setSheet] = useState(false);
  // Both walks clamp at their first beat, so Back is dead there rather than
  // wrong. Say so with the control instead of letting it look broken.
  const atStart = mode === "solo" ? prevBeatForRole(beat, role) === beat : beat === 0;

  if (phase === "cover") return <Cover />;
  if (phase === "endcap") return <EndCap />;

  return (
    <>
      {/* Desktop: slim persistent top bar. */}
      <div className="sticky top-0 z-40 hidden border-b border-[#dce7e9] bg-white/95 backdrop-blur md:block">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-5">
          <BrandLogo compact />
          <RoleTabs />
          <div className="flex-1" />
          <Timeline />
          <button
            onClick={back}
            disabled={atStart}
            aria-label="Previous beat"
            className="flex items-center gap-1.5 rounded-full border border-[#dce7e9] px-3 py-2 text-xs font-bold text-brand-navy disabled:border-transparent disabled:text-slate-300"
          >
            <ArrowLeft size={14} /> Back
          </button>
          {/* A finished solo walk is not the end of the demo — say so, and
              leave the role tabs and timeline live. */}
          <button
            onClick={next}
            disabled={atWalkEnd}
            className="flex items-center gap-1.5 rounded-full bg-brand-navy px-4 py-2 text-xs font-bold text-white disabled:bg-[#e4eef0] disabled:text-slate-400"
          >
            {atWalkEnd ? "End of this persona's day" : <>Next <ArrowRight size={14} /></>}
          </button>
        </div>
      </div>

      <RoleView />

      {/* Phone: one docked bar flush to the viewport bottom (Option C) — Back
          and the sheet/grid trigger sit at the left edge, Next owns the right
          edge. This replaces the old floating row that hovered above a
          separate BottomNav; BottomNav (patient role only) now stacks
          directly on top of this bar instead of sharing bottom-0 with it —
          see its `bottom-14 md:bottom-0` offset in shared.tsx. */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex h-14 items-center justify-between gap-2 border-t border-[#dce7e9] bg-white/95 px-3 backdrop-blur md:hidden">
        <div className="flex items-center gap-2">
          <button
            onClick={back}
            disabled={atStart}
            aria-label="Previous beat"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-brand-navy disabled:text-slate-300"
          >
            <ArrowLeft size={19} />
          </button>
          <button
            onClick={() => setSheet(true)}
            aria-label="Demo controls"
            className="grid h-10 w-10 place-items-center rounded-full text-brand-navy"
          >
            <LayoutGrid size={19} />
          </button>
        </div>
        <button
          onClick={next}
          disabled={atWalkEnd}
          className="flex h-10 items-center justify-center gap-2 rounded-full bg-brand-navy px-4 text-sm font-bold text-white disabled:bg-[#e4eef0] disabled:text-slate-400"
        >
          {atWalkEnd ? "End of this persona's day" : <>Next <ArrowRight size={17} /></>}
        </button>
      </div>

      <AnimatePresence>
        {sheet && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSheet(false)}
            className="fixed inset-0 z-50 bg-brand-navy/40 md:hidden"
          >
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="absolute inset-x-0 bottom-0 rounded-t-[28px] bg-brand-bg p-6"
            >
              <div className="mb-5 flex items-center justify-between">
                <b className="text-sm font-extrabold text-brand-navy">Demo controls</b>
                <button onClick={() => setSheet(false)} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full bg-white">
                  <X size={17} />
                </button>
              </div>
              <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[.2em] text-slate-400">View as</p>
              <RoleTabs full />
              <p className="mb-2 mt-6 text-[11px] font-extrabold uppercase tracking-[.2em] text-slate-400">Jump to stage</p>
              <Timeline full />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Interstitial />
    </>
  );
}
