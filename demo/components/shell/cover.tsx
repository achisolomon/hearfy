"use client";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { LiveBrandLogo, PrimaryButton, SecondaryButton } from "../ui";
import { BRAND_NAME } from "@/lib/mock-data";
import { BEATS, STAGES, ROLES } from "@/lib/story";
import { personaFor } from "@/lib/personas";
import { resetAllLatches } from "@/lib/latch";
import { resetSelection } from "@/lib/selection";
import { resetSigning } from "@/lib/signing";
import { resetTextSize } from "../a11y/text-size";
import { PersonaAvatar } from "../persona-avatar";
import { useStory } from "./story-context";

const DISCLAIMER =
  "Everything in this demo is fictional — names, images, readings and figures. No real patient data.";

export function Cover() {
  const { start, startAs } = useStory();
  // The clinical gates latch for the length of a walkthrough, not the page.
  // Every fresh run begins here, so a second demo starts unsigned rather than
  // skipping the signing beat outright. The text-size choice and the
  // patient's device selection live outside React the same way, so both
  // reset alongside the gates.
  useEffect(() => { resetAllLatches(); resetTextSize(); resetSelection(); resetSigning(); }, []);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid min-h-[100dvh] place-items-center bg-brand-bg px-6 py-10">
      <div className="w-full max-w-md text-center">
        {/* The mark arrives, then keeps breathing. `BrandLogo animate` stopped
            after its entry, which reads as an animation that broke; this is the
            cover, where the mark is the subject and nothing else is moving —
            one of the three surfaces DESIGN.md lets the brandmark perform on. */}
        <div className="mb-8 flex justify-center"><LiveBrandLogo size="lg" /></div>
        <h1 className="text-[34px] font-extrabold leading-[1.08] tracking-[-.03em] text-brand-navy">
          Hearing diagnostics, at home
        </h1>
        <p className="mt-4 text-[15px] leading-6 text-slate-500">
          A CMA at the patient&rsquo;s door. An audiologist online. One record across
          {" "}{STAGES.length} stages and {ROLES.length} roles.
        </p>

        <div className="mt-9">
          <PrimaryButton onClick={start}>Start the guided journey</PrimaryButton>
        </div>

        {/* Per-persona entry: enter as one role and stay there. */}
        <p className="mt-9 text-[11px] font-extrabold uppercase tracking-[.2em] text-slate-400">
          Or enter as one persona
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {ROLES.map(r => {
            const p = personaFor(r);
            return (
              <button
                key={r}
                onClick={() => startAs(r)}
                className="flex min-h-[4.5rem] items-start gap-3 rounded-2xl border border-[#dfeaec] bg-white p-3 text-left transition hover:border-brand-teal"
              >
                <PersonaAvatar role={r} size="md" />
                <span className="min-w-0">
                  <b className="block text-[13px] leading-tight">{p.name}</b>
                  <span className="block text-[11px] leading-snug text-slate-400">{p.title}</span>
                </span>
              </button>
            );
          })}
        </div>

        <p className="mt-8 text-[11px] leading-5 text-slate-400">{DISCLAIMER}</p>
      </div>
    </motion.div>
  );
}

export function EndCap() {
  const { restart, exploreFreely } = useStory();
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid min-h-[100dvh] place-items-center bg-brand-bg px-6">
      <div className="w-full max-w-md text-center">
        {/* Alive here too — the end-cap bookends the cover, and the walkthrough
            has stopped, so the mark is again the only thing on screen moving. */}
        <div className="mb-8 flex justify-center"><LiveBrandLogo size="lg" /></div>
        <h1 className="text-[30px] font-extrabold leading-[1.1] tracking-[-.03em] text-brand-navy">
          One journey, end to end
        </h1>
        <div className="mt-7 grid grid-cols-3 gap-3">
          {[[STAGES.length, "stages"], [ROLES.length, "roles"], [BEATS.length, "beats"]].map(([n, l]) => (
            <div key={String(l)} className="rounded-2xl bg-white p-4 shadow-card">
              <b className="block text-2xl text-brand-navy">{n}</b>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{l}</span>
            </div>
          ))}
        </div>
        <p className="mt-6 text-[15px] leading-6 text-slate-500">
          {BRAND_NAME} keeps every visit on one record — booking, exam, signature,
          prescription, device and follow-up.
        </p>
        <div className="mt-9 space-y-3">
          <PrimaryButton onClick={restart}>Watch it again</PrimaryButton>
          <SecondaryButton onClick={exploreFreely}>Explore freely</SecondaryButton>
        </div>
      </div>
    </motion.div>
  );
}
