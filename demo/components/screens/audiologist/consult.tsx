"use client";
import { useState } from "react";
import { Ban, Lock, Video } from "lucide-react";
import { Card, PrimaryButton, StatusPill } from "../../ui";
import { cn } from "@/lib/cn";
import { createLatch } from "@/lib/latch";
import { devices, tiers, clinician, patient } from "@/lib/mock-data";

/**
 * Locking the prescription is a separate, irreversible commitment from signing
 * the report — a different latch, on purpose.
 */
const lockedLatch = createLatch();

export function AudConsult({ next }: { next: () => void }) {
  // The audiologist recommends 2–3 and excludes at least one with a rationale.
  const [recommended, setRecommended] = useState<string[]>([devices[0].name, devices[1].name]);
  const excluded = devices[2].name;

  return (
    <div className="min-h-[100dvh] bg-brand-bg p-6 text-brand-navy">
      <div className="mx-auto max-w-4xl">
        <header className="mb-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-[.2em] text-brand-teal">Recorded consult</span>
            <h1 className="mt-1 text-[26px] font-extrabold tracking-[-.02em]">Device shortlist for {patient.name}</h1>
          </div>
          <span className="flex items-center gap-2 rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600">
            <span className="h-2 w-2 rounded-full bg-red-500" aria-hidden />
            <span aria-hidden>REC</span>
            <span className="sr-only">This consult is being recorded</span>
          </span>
        </header>

        <Card className="mb-4 flex items-center gap-3 p-4">
          <Video size={18} className="text-brand-teal" aria-hidden />
          <p className="text-sm text-slate-500">
            Recording is visible to the patient throughout, per their consent.
          </p>
        </Card>

        <div className="space-y-3">
          {devices.map(d => {
            const isRec = recommended.includes(d.name);
            const isEx = d.name === excluded;
            return (
              <Card key={d.name} className={cn("p-4", isRec && "border-brand-teal", isEx && "opacity-70")}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                      <b className="text-[15px]">{d.name}</b>
                      <span className="text-xs font-bold text-slate-400">{d.price}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{d.features.join(" · ")}</p>
                    {isEx && (
                      <p className="mt-2 flex items-start gap-1.5 text-xs leading-5 text-[#9d6514]">
                        <Ban size={13} className="mt-0.5 shrink-0" aria-hidden />
                        Excluded: open fitting is unsuitable with the air–bone gap on the left.
                      </p>
                    )}
                  </div>
                  {!isEx && (
                    <button
                      aria-pressed={isRec}
                      onClick={() => setRecommended(r => isRec ? r.filter(n => n !== d.name) : [...r, d.name])}
                      className={cn("shrink-0 rounded-full px-3 py-1.5 text-xs font-bold",
                        isRec ? "bg-brand-teal text-white" : "bg-[#f1f5f6] text-slate-500")}>
                      {isRec ? "Recommended" : "Recommend"}
                    </button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        <Card className="mt-4 p-4">
          <p className="text-xs leading-5 text-slate-400">
            The shortlist is clinical. Which device, and which tier
            ({tiers.map(t => `${t.name} $${t.monthly}`).join(" · ")}), stay the
            patient&rsquo;s decision.
          </p>
        </Card>

        {/* A prescription locks a shortlist, so there has to be one. */}
        <div className="mt-5 max-w-sm">
          <PrimaryButton disabled={recommended.length === 0} onClick={next}>
            Continue to prescription
          </PrimaryButton>
          {recommended.length === 0 && (
            <p className="mt-2 text-xs text-[#9d6514]">Recommend at least one device to continue.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function AudPrescription() {
  const locked = lockedLatch.use();
  return (
    <div className="grid min-h-[100dvh] place-items-center bg-brand-bg p-6 text-brand-navy">
      <Card className="w-full max-w-lg p-7">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#edf8f7] text-brand-teal">
          <Lock size={21} aria-hidden />
        </span>
        <h1 className="mt-4 text-2xl font-extrabold tracking-[-.02em]">
          {locked ? "Prescription locked" : "Sign & lock the prescription"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          {locked
            ? "The digital prescription is locked and on the patient record. The CMA can now fulfil the shortlist."
            : "Locking finalises the shortlist and the fitting parameters. This is a second, separate commitment from the results signature."}
        </p>
        <div className="mt-5 rounded-2xl bg-[#f6fafa] p-4">
          <b className="text-sm">{clinician.name}, {clinician.credential}</b>
          <p className="mt-1 text-xs text-slate-500">Licensed in {clinician.licenseState}</p>
        </div>
        {locked && <div className="mt-4"><StatusPill tone="green">Locked &amp; immutable</StatusPill></div>}
        {!locked && (
          <div className="mt-6"><PrimaryButton onClick={lockedLatch.set}>Sign &amp; lock</PrimaryButton></div>
        )}
      </Card>
    </div>
  );
}
