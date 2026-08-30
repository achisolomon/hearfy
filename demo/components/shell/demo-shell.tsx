"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, LayoutGrid, X } from "lucide-react";
import { BrandLogo } from "../ui";
import { Cover, EndCap } from "./cover";
import { Interstitial } from "./interstitial";
import { RoleTabs } from "./role-tabs";
import { RoleView } from "./role-view";
import { Timeline } from "./timeline";
import { useStory } from "./story-context";

export function DemoShell() {
  const { phase, next, atWalkEnd } = useStory();
  const [sheet, setSheet] = useState(false);

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

      {/* Phone: floating Next pill + sheet trigger. */}
      <div className="fixed inset-x-0 bottom-24 z-40 flex justify-center gap-3 px-5 md:hidden">
        <button
          onClick={() => setSheet(true)}
          aria-label="Demo controls"
          className="grid h-12 w-12 place-items-center rounded-full bg-white text-brand-navy shadow-card"
        >
          <LayoutGrid size={19} />
        </button>
        <button
          onClick={next}
          disabled={atWalkEnd}
          className="flex h-12 flex-1 max-w-[240px] items-center justify-center gap-2 rounded-full bg-brand-navy px-4 text-sm font-bold text-white shadow-card disabled:bg-white disabled:text-slate-400"
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
