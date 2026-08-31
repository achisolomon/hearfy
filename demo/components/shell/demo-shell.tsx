"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { BrandLogo } from "../ui";
import { PersonaAvatar } from "../persona-avatar";
import { Cover, EndCap } from "./cover";
import { Interstitial } from "./interstitial";
import { RoleTabs } from "./role-tabs";
import { RoleView } from "./role-view";
import { Timeline } from "./timeline";
import { personaFor } from "@/lib/personas";
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
          sits at the left edge, Next owns the right edge. This replaces the
          old floating row that hovered above a separate BottomNav; BottomNav
          (patient role only) now stacks directly on top of this bar instead
          of sharing bottom-0 with it — see its `bottom-14 md:bottom-0` offset
          in shared.tsx.

          The middle used to be empty. On a phone, the desktop top bar (which
          carries RoleTabs) is md:hidden, so nothing on screen said which of
          the four personas was active — "I can select persona, but I don't
          see which one I'm on right now." The persona indicator fills that
          space and replaces the old grid button as the sheet's opener: the
          sheet already offers both role-switching and stage-jumping, so one
          labelled trigger that also shows the current role covers what two
          separate buttons did, and leaves more width for the label at
          375px. */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex h-14 items-center justify-between gap-2 border-t border-[#dce7e9] bg-white/95 px-3 backdrop-blur md:hidden">
        <button
          onClick={back}
          disabled={atStart}
          aria-label="Previous beat"
          // The owner: "there is no back button." It was really there, but
          // as a bare icon with no border/fill in either state — nothing
          // told a viewer it was a control at all, so a disabled first beat
          // and a merely-easy-to-miss enabled one read the same: absent.
          // A visible ring now marks it as a control in the enabled state
          // and stays (paled, not gone) when disabled — present but
          // unavailable, the same contract Next's filled pill already gives
          // for granted.
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#dce7e9] text-brand-navy disabled:border-[#eef3f4] disabled:text-slate-300"
        >
          <ArrowLeft size={19} />
        </button>
        <button
          onClick={() => setSheet(true)}
          aria-label={`Viewing as ${personaFor(role).name} — change role`}
          className="flex h-10 min-w-0 flex-1 items-center justify-center gap-2 rounded-full px-2 text-brand-navy"
        >
          <span aria-hidden className="shrink-0"><PersonaAvatar role={role} size="md" /></span>
          {/*
            The bar showed a static role-label lookup ("CMA", "Patient") —
            a job title, not a person, which is what the owner asked for:
            "which user am I, not just what is my role?" personas.ts names
            the four people this demo follows, so the visible label reads
            from personaFor(role).name (the accessible name above already
            does).

            Full names don't fit this bar at 375px alongside Back (40px) and
            Next (~92-114px across the three text sizes) — see the width
            budget in the fix commit. First name alone ("Maya", "Alex",
            "Jordan") is unambiguous among these four personas and fits with
            room to spare. Dr. Susan Reed is the one exception: the "Dr."
            honorific is clinically load-bearing (she signs the audiogram),
            so dropping it to fit would misrepresent her credential the same
            way a bare first name never does for the other three. "Dr. Reed"
            — the surname, the way she'd actually be addressed clinically —
            keeps the honorific at roughly the same width as a first name.
          */}
          <span className="truncate text-sm font-bold">
            {personaFor(role).name.startsWith("Dr. ")
              ? `Dr. ${personaFor(role).name.split(" ").at(-1)}`
              : personaFor(role).name.split(" ")[0]}
          </span>
        </button>
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
