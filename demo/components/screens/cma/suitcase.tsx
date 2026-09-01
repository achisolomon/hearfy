"use client";
import { useState } from "react";
import { Briefcase, Check, CreditCard, PackageCheck, PenLine, Truck } from "lucide-react";
import { Card, PageHeader, PrimaryButton, StatusPill } from "../../ui";
import { cn } from "@/lib/cn";
import { createLatch } from "@/lib/latch";
import { Shell } from "../shared";
import { CallSplit } from "./call-tile";
import { devices, deviceDetail, identity, patient, serials, compareRecommendation, tryOnTalk } from "@/lib/mock-data";
import { CompareTable } from "../compare-table";
import { creditedFirstMonth, tierFor } from "@/lib/commerce";
import { SIGNING_ITEMS, useSigning } from "@/lib/signing";
import { useStory } from "../../shell/story-context";

/**
 * The story shell remounts this screen on back-navigation, which would clear
 * `tried` and re-close a gate the presenter already opened. This latch keeps
 * the one-way fact — a try-on was recorded at least once — so returning here
 * mid-demo doesn't dead-end the continue button.
 */
const triedLatch = createLatch();

/** The audiologist's signed shortlist, marked by what is physically in the case. */
export function CmaStock({ next }: { next: () => void }) {
  const shortlist = devices.slice(0, 3);
  return (
    <Shell tablet>
      <PageHeader title="Signed shortlist" subtitle="Open the case. The patient tries what is here." eyebrow="Prescription locked" />
      <CallSplit active note={compareRecommendation.note}>
        {/* The same comparison the patient is reading, read-only: the CMA
           follows the conversation without being able to choose or sell. */}
        <Card className="mb-4 flex gap-3 p-4">
          <Briefcase size={18} className="mt-0.5 shrink-0 text-brand-teal" />
          <p className="text-sm leading-6 text-slate-500">{compareRecommendation.cmaNote}</p>
        </Card>
        <CompareTable layout="table" selectable={false} />

        <p className="mb-2 mt-6 text-[11px] font-extrabold uppercase tracking-[0.2em] text-slate-400">
          In the case
        </p>
        <div className="space-y-3">
          {shortlist.map(d => {
            const detail = deviceDetail[d.name];
            return (
              <Card key={d.name} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <b className="text-[15px]">{d.name}</b>
                    <p className="mt-1 text-xs text-slate-500">{tierFor(detail.tier).name} tier</p>
                  </div>
                  {detail.inCase
                    ? <StatusPill tone="green">In your case</StatusPill>
                    // Bespoke pill: StatusPill always renders a leading Check, which would
                    // wrongly imply "done" for a device that hasn't arrived yet.
                    : <span className="flex items-center gap-1.5 rounded-full bg-[#edf4fb] px-3 py-1 text-xs font-bold text-[#235f98]">
                        <Truck size={12} /> Ships
                      </span>}
                </div>
              </Card>
            );
          })}
        </div>
        <Card className="mt-4 flex gap-3 p-4">
          <Briefcase size={18} className="mt-0.5 shrink-0 text-brand-teal" />
          <p className="text-sm leading-6 text-slate-500">
            Availability is logistics, not a recommendation. A device that ships is equally
            available to the patient — the clinical choice was made before the case opened.
          </p>
        </Card>
        <div className="mt-6"><PrimaryButton onClick={next}>Start try-on</PrimaryButton></div>
      </CallSplit>
    </Shell>
  );
}

export function CmaTryOn({ next }: { next: () => void }) {
  const inCase = devices.filter(d => deviceDetail[d.name].inCase);
  const [tried, setTried] = useState<string[]>([]);
  // Read the latch unconditionally: it is a hook, and `||` would skip it on
  // the render right after the first try-on, changing the hook count.
  const everTried = triedLatch.use();
  const gateOpen = tried.length > 0 || everTried;
  return (
    <Shell tablet>
      <PageHeader title="Try-on" subtitle="Fit each device. The patient tells Dr. Reed how it feels and what they hear." eyebrow="In the home" />
      <CallSplit active note="Asking how each one sounds — comfort and retention are hers to judge with the patient.">
        <div className="space-y-3">
          {inCase.map(d => {
            const on = tried.includes(d.name);
            const talk = tryOnTalk[d.name];
            return (
              <button key={d.name}
                aria-pressed={on}
                onClick={() => { setTried(t => on ? t.filter(n => n !== d.name) : [...t, d.name]); triedLatch.set(); }}
                className={cn("flex w-full items-center gap-3 rounded-2xl border p-4 text-left",
                  on ? "border-brand-teal bg-[#edfbfa]" : "border-[#dfeaec] bg-white")}>
                <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-full",
                  on ? "bg-teal-ink text-white" : "bg-[#f1f5f6] text-slate-300")}>
                  <Check size={15} />
                </span>
                <span className="flex-1">
                  <b className="block text-sm">{d.name}</b>
                  <span className="text-xs text-slate-500">Dome size M · left and right</span>
                  {/* Recording the fit opens the conversation it stands for:
                     what the patient hears, and her read on it. Comfort and
                     retention are hers to judge WITH the patient, so both
                     voices belong on the screen — not just a tick. */}
                  {on && talk && (
                    <span className="mt-2 block space-y-1.5 border-t border-brand-teal/25 pt-2">
                      <span className="block text-xs italic leading-5 text-brand-navy">
                        {patient.name}: {talk.patient}
                      </span>
                      <span className="block text-xs leading-5 text-slate-500">
                        <b className="font-semibold text-teal-ink">Dr. Reed:</b> {talk.clinician}
                      </span>
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
        <Card className="mt-4 p-4">
          <p className="text-sm leading-6 text-slate-500">
            Check comfort and retention on both ears. Swap dome size if the fit is loose.
            {" "}She asks the patient how each one sounds before anything is chosen.
          </p>
        </Card>
        <div className="mt-6">
          <PrimaryButton disabled={!gateOpen} onClick={next}>
            {gateOpen ? "Try-on recorded" : "Record a try-on to continue"}
          </PrimaryButton>
        </div>
      </CallSplit>
    </Shell>
  );
}

/**
 * Nothing activates unsigned (item 12, refined 2026-08-31): the PATIENT
 * reviews, approves and signs on their own phone. This screen is a READ-ONLY
 * mirror — every approval lands here live, and the CMA can act on none of
 * them. The one control is continuing once the signature is in.
 */
export function CmaSigning({ next }: { next: () => void }) {
  const chosen = devices[0];
  const tier = tierFor(deviceDetail[chosen.name].tier);
  const s = useSigning();

  return (
    <Shell tablet>
      <PageHeader title="Patient is signing" subtitle={`${chosen.name} · ${tier.name} membership — on the patient's phone`} eyebrow="Contract" />
      <CallSplit active note="Walking the patient through each item on the call — the approvals below are the patient's own.">
        <Card className="p-4">
          <p className="text-sm leading-6 text-slate-500">
            {patient.name} is reviewing the contract on their phone. You see each approval
            as it lands — nothing here is yours to tap.
          </p>
        </Card>
        <div className="mt-4 space-y-3">
          {SIGNING_ITEMS.map(([k, label]) => (
            <div key={k} className="flex w-full items-start gap-3 rounded-2xl bg-white p-4">
              <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md border ${
                s[k] ? "border-teal-ink bg-teal-ink text-white" : "border-slate-300"}`}>
                {s[k] && <Check size={15} />}
              </span>
              <span className="min-w-0 flex-1 text-sm leading-6 text-slate-600">
                {label}
                {k === "card" && <span className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                  <CreditCard size={13} /> Visa •••• 4242 · saved at booking
                </span>}
              </span>
              <span className={cn("shrink-0 text-[11px] font-bold", s[k] ? "text-brand-teal" : "text-slate-300")}>
                {s[k] ? "Approved" : "Waiting"}
              </span>
            </div>
          ))}
        </div>
        <div className={cn("mt-4 grid min-h-24 w-full place-items-center rounded-2xl border-2 border-dashed p-4 text-center",
          s.signed ? "border-brand-teal bg-[#edfbfa]" : "border-[#c9dadd] bg-white")}>
          {s.signed
            ? <span>
                <span className="font-serif text-2xl italic text-brand-navy">{identity.legalName}</span>
                <span className="mt-1 block text-[11px] text-slate-500">Signed on the patient&rsquo;s phone · May 21, 2025</span>
              </span>
            : <span className="flex items-center gap-2 text-sm font-semibold text-slate-400">
                <PenLine size={16} /> Awaiting the patient&rsquo;s signature
              </span>}
        </div>
        <div className="mt-6">
          <PrimaryButton disabled={!s.signed} onClick={next}>
            {s.signed ? "Signed — start the fit" : "Waiting for the patient"}
          </PrimaryButton>
        </div>
      </CallSplit>
    </Shell>
  );
}

export function CmaActivate({ next }: { next: () => void }) {
  // The patient's pick — Premium tier in the hero story.
  const chosen = devices[0];
  const tier = deviceDetail[chosen.name].tier;
  const { monthly, credit, dueNow } = creditedFirstMonth(tier);
  return (
    <Shell tablet>
      <PageHeader title="Fit &amp; activate" subtitle={`${chosen.name} · ${tierFor(tier).name} membership`} eyebrow="Same day" />
      {/* She stays on the call until the patient is fitted and happy — this
         is the last screen of the session she is part of. */}
      <CallSplit note="Still on with you both — she confirms the fit sounds right before the call ends.">
        <Card className="p-5">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">First month</span><b>${monthly}</b></div>
            <div className="flex justify-between text-brand-teal"><span>Visit fee credited</span><b>−${credit}</b></div>
            <div className="mt-2 flex justify-between border-t border-[#eef4f5] pt-3">
              <b>Due today</b><b className="text-lg">${dueNow}</b>
            </div>
          </div>
        </Card>
        <div className="mt-4 space-y-3">
          {["Devices paired and programmed", "Fit checked, both ears", "Patient shown charging and cleaning"].map(x => (
            <div key={x} className="flex items-center gap-3 rounded-2xl bg-white p-4">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-[#dcf5ef] text-emerald-600"><Check size={16} /></span>
              <b className="text-sm">{x}</b>
            </div>
          ))}
        </div>
        <div className="mt-6"><PrimaryButton onClick={next}>Activated</PrimaryButton></div>
      </CallSplit>
    </Shell>
  );
}

export function CmaCloseout() {
  const chosen = devices[0];
  /**
   * "Back to today's visits" is navigation inside Maya's own shift, and a
   * BACKWARD one — her day list, not her next step — so it stays `goToScreen`
   * rather than the forward `advanceInRole`.
   *
   * This was once a hand-rolled guard against the shell's `next()` adopting
   * the landing beat's lead and handing the viewer Alex's order screen. No
   * in-screen control calls the context's `next()` any more (see
   * story-context.tsx and shell/role-view.tsx), so this is now simply the
   * ordinary way to move within a persona.
   */
  const { goToScreen } = useStory();
  return (
    <Shell tablet>
      <PageHeader title="Visit complete" subtitle={`${patient.name} left the visit hearing.`} eyebrow="Close-out" />
      <Card className="grid place-items-center p-8 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-[#edf8f7] text-brand-teal">
          <PackageCheck size={26} />
        </span>
        <b className="mt-4 text-[15px]">{chosen.name} dispensed</b>
        <p className="mt-2 text-sm text-slate-500">Serial {serials.left} / {serials.right} · activated on site</p>
      </Card>
      <Card className="mt-3 p-4">
        <b className="text-sm">Next visit</b>
        <p className="mt-1 text-sm text-slate-500">11:30 — Doris P., Coconut Grove</p>
      </Card>
      <div className="mt-6">
        <PrimaryButton onClick={() => goToScreen("cma-day")}>Back to today&rsquo;s visits</PrimaryButton>
      </div>
    </Shell>
  );
}
