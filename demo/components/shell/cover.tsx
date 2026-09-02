"use client";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { CalendarDays } from "lucide-react";
import { Card, LiveBrandLogo, PrimaryButton, SecondaryButton, StatusPill } from "../ui";
import { clinician, devices, patient, visitHistory } from "@/lib/mock-data";
import { STAGES, ROLES } from "@/lib/story";
import { personaFor } from "@/lib/personas";
import { resetAllLatches } from "@/lib/latch";
import { reviewStore } from "@/lib/review-store";
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
  useEffect(() => { resetAllLatches(); resetTextSize(); resetSelection(); resetSigning(); reviewStore.reset(); }, []);
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
  // The visit is over; these are the three things it left behind. The follow-up
  // row is the point of the screen — it is dated, booked, and lands on the same
  // record, which is what makes the encounter a relationship rather than a
  // transaction. Dates and names come from mock-data so this screen agrees with
  // the journey the viewer just watched (in-home fitting, not a shipment).
  const followUp = visitHistory.find(v => !v.done);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid min-h-[100dvh] place-items-center bg-brand-bg px-6 py-10">
      <div className="w-full min-w-0 max-w-md text-center">
        {/* Alive here too — the end-cap bookends the cover, and the walkthrough
            has stopped, so the mark is again the only thing on screen moving. */}
        <div className="mb-8 flex justify-center"><LiveBrandLogo size="lg" /></div>
        <p className="text-[11px] font-extrabold uppercase tracking-[.2em] text-teal-ink">
          After the visit
        </p>
        <h1 className="mt-2 text-[30px] font-extrabold leading-[1.1] tracking-[-.03em] text-brand-navy">
          The visit ends.<br />The record doesn&rsquo;t.
        </h1>

        <div className="mt-7 space-y-3 text-left">
          <Card className="flex w-full min-w-0 items-center gap-2.5 px-3.5 py-3.5">
            <PersonaAvatar role="cma" size="sm" />
            <div className="flex min-w-0 flex-1 flex-col justify-center min-h-[2.9em]">
              <b className="block text-sm leading-tight">{devices[0].name}</b>
              <span className="mt-0.5 block text-xs leading-snug text-slate-500">
                Fitted and activated in your home
              </span>
            </div>
            <span className="shrink-0"><StatusPill tone="green">Active</StatusPill></span>
          </Card>

          <Card className="flex w-full min-w-0 items-center gap-2.5 px-3.5 py-3.5">
            <PersonaAvatar role="audiologist" size="sm" />
            <div className="flex min-w-0 flex-1 flex-col justify-center min-h-[2.9em]">
              <b className="block text-sm leading-tight">{followUp?.what ?? "Follow-up hearing check"}</b>
              <span className="mt-0.5 block text-xs leading-snug text-slate-500">
                {followUp?.date} &middot; at home
              </span>
            </div>
            <span className="shrink-0"><StatusPill tone="blue" icon={CalendarDays}>Booked</StatusPill></span>
          </Card>

          <Card className="flex w-full min-w-0 items-center gap-2.5 px-3.5 py-3.5">
            <PersonaAvatar role="patient" size="sm" />
            <div className="flex min-w-0 flex-1 flex-col justify-center min-h-[2.9em]">
              <b className="block text-sm leading-tight">Visit record</b>
              <span className="mt-0.5 block text-xs leading-snug text-slate-500">
                Shared with {patient.name} &amp; {clinician.name}
              </span>
            </div>
            <span className="shrink-0"><StatusPill tone="green">Signed</StatusPill></span>
          </Card>
        </div>

        <p className="mt-6 text-[15px] leading-6 text-slate-500">
          Every future visit lands on{" "}
          <b className="font-bold text-brand-navy">this same record</b> — one patient,
          {" "}{STAGES.length} stages, {ROLES.length} roles.
        </p>

        <div className="mt-9 space-y-3">
          <PrimaryButton onClick={restart}>Watch it again</PrimaryButton>
          <SecondaryButton onClick={exploreFreely}>Explore freely</SecondaryButton>
        </div>
      </div>
    </motion.div>
  );
}
