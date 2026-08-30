"use client";
import { useState } from "react";
import { Check, ShieldCheck } from "lucide-react";
import { Card, PageHeader, PrimaryButton } from "../../ui";
import { Shell } from "../shared";
import { patient, visit, kit } from "@/lib/mock-data";

export function CmaArrival({ next }: { next: () => void }) {
  return (
    <Shell>
      <PageHeader title="Confirm the visit" subtitle="Two-way check before anything begins." eyebrow="Identity" />
      <Card className="p-5">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#edf8f7] text-brand-teal">
            <ShieldCheck size={20} />
          </span>
          <div>
            <b className="text-[15px]">{patient.name}</b>
            <p className="text-xs text-slate-500">{visit.address}</p>
          </div>
        </div>
        <div className="mt-5 space-y-2">
          {[["Visit ID", visit.id], ["Kit ID", kit.id]].map(([l, v]) => (
            <div key={l} className="flex items-center justify-between rounded-xl bg-[#f6fafa] px-4 py-3">
              <span className="text-xs text-slate-500">{l}</span>
              <b className="text-sm">{v}</b>
            </div>
          ))}
        </div>
      </Card>
      <Card className="mt-4 p-4">
        <p className="text-sm leading-6 text-slate-500">
          The patient confirms your photo and these IDs on their own phone before you begin.
        </p>
      </Card>
      <div className="mt-6"><PrimaryButton onClick={next}>Identity confirmed</PrimaryButton></div>
    </Shell>
  );
}

export function CmaConsent({ next }: { next: () => void }) {
  const [granted, setGranted] = useState<Record<string, boolean>>({
    care: true, telehealth: true, recording: true,
  });
  const items: [string, string][] = [
    ["care", "Care and clinical data"],
    ["telehealth", "Telehealth session with a remote audiologist"],
    ["recording", "Session recording (optional)"],
  ];
  // Care and telehealth are required; recording alone may be declined (persona spec §4).
  const canProceed = granted.care && granted.telehealth;

  return (
    <Shell>
      <PageHeader title="Capture consent" subtitle="Walk the patient through each item. Consent is a gate." eyebrow="Consent" />
      <div className="space-y-3">
        {items.map(([k, label]) => (
          <button key={k} onClick={() => setGranted(g => ({ ...g, [k]: !g[k] }))}
            className="flex w-full items-start gap-3 rounded-2xl bg-white p-4 text-left">
            <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md border ${
              granted[k] ? "border-brand-teal bg-brand-teal text-white" : "border-slate-300"}`}>
              {granted[k] && <Check size={15} />}
            </span>
            <span className="text-sm leading-6 text-slate-600">{label}</span>
          </button>
        ))}
      </div>
      {!canProceed && (
        <Card className="mt-4 border-amber-200 bg-[#fff8ec] p-4">
          <p className="text-sm leading-6 text-[#9d6514]">
            Care and telehealth consent are required to run the exam. Recording may be declined —
            the exam proceeds without it.
          </p>
        </Card>
      )}
      <div className="mt-6">
        <PrimaryButton disabled={!canProceed} onClick={next}>Consent captured</PrimaryButton>
      </div>
    </Shell>
  );
}
