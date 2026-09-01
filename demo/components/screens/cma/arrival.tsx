"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Check, ScanLine, ShieldCheck, UserRound } from "lucide-react";
import { Card, PageHeader, PrimaryButton, StatusPill } from "../../ui";
import { Shell } from "../shared";
import { identity, patient, visit } from "@/lib/mock-data";

/**
 * The door check verifies the PERSON, not the kit (corrections sheet
 * 2026-08-31, item 1): scan the photo ID, confirm the SSN tail on record.
 * The kit has its own gate — the calibration checklist on the next screen.
 */
export function CmaArrival({ next }: { next: () => void }) {
  const [scan, setScan] = useState<"idle" | "scanning" | "matched">("idle");
  const [ssnOk, setSsnOk] = useState(false);
  const verified = scan === "matched" && ssnOk;

  return (
    <Shell tablet>
      {/* No call tile here: the identity check is the CMA's own doorstep task —
         the audiologist joins from consent onward (refined 2026-08-31). */}
      <PageHeader title="Confirm the visit" subtitle="Verify who you are treating before anything begins." eyebrow="Identity" />
      <Card className="p-5">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#edf8f7] text-teal-ink">
            <ShieldCheck size={20} />
          </span>
          <div>
            <b className="text-[15px]">{patient.name}</b>
            <p className="text-xs text-slate-500">{visit.address}</p>
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between rounded-xl bg-[#f6fafa] px-4 py-3">
          <span className="text-xs text-slate-500">Visit ID</span>
          <b className="text-sm">{visit.id}</b>
        </div>
      </Card>

      {/* The photo ID — a card the CMA scans, not a number they eyeball. */}
      <Card className="mt-4 overflow-hidden">
        <div className="relative bg-gradient-to-br from-[#16426c] to-[#0c2340] p-4 text-white">
          <div className="flex items-start gap-3">
            <span className="grid h-14 w-12 shrink-0 place-items-center rounded-lg bg-white/15">
              <UserRound size={24} className="text-white/80" />
            </span>
            <div className="min-w-0 text-[11px] leading-4 text-white/75">
              <b className="block text-[13px] leading-5 text-white">{identity.legalName}</b>
              <span className="block">{identity.idType}</span>
              <span className="block">DOB {identity.dob}</span>
              <span className="block tracking-wide">{identity.idNumber}</span>
            </div>
          </div>
          {scan === "scanning" && (
            <motion.div
              initial={{ top: 0 }} animate={{ top: "100%" }} transition={{ duration: 1.1, ease: "easeInOut" }}
              onAnimationComplete={() => setScan("matched")}
              className="absolute inset-x-0 h-0.5 bg-brand-teal shadow-[0_0_12px_2px_rgba(18,170,165,.9)]"
            />
          )}
        </div>
        <div className="flex items-center justify-between p-4">
          {scan === "matched"
            ? <StatusPill tone="green">ID matched — {identity.legalName}</StatusPill>
            : <span className="text-xs text-slate-500">
                {scan === "scanning" ? "Scanning…" : "Scan the ID and check the photo against the person."}
              </span>}
          {scan !== "matched" && (
            <button onClick={() => setScan("scanning")} disabled={scan === "scanning"}
              className="flex items-center gap-1.5 rounded-full bg-brand-navy px-4 py-2 text-xs font-bold text-white disabled:opacity-50">
              <ScanLine size={14} /> Scan photo ID
            </button>
          )}
        </div>
      </Card>

      {/* Asked aloud and confirmed by the patient — never displayed in full. */}
      <button onClick={() => setSsnOk(v => !v)}
        className="mt-4 flex w-full items-start gap-3 rounded-2xl bg-white p-4 text-left">
        <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md border ${
          ssnOk ? "border-teal-ink bg-teal-ink text-white" : "border-slate-300"}`}>
          {ssnOk && <Check size={15} />}
        </span>
        <span className="text-sm leading-6 text-slate-600">
          Social security number ending <b>••••{identity.ssnLast4}</b> confirmed with the patient
        </span>
      </button>

      <Card className="mt-4 p-4">
        <p className="text-sm leading-6 text-slate-500">
          The patient confirms your photo and the visit ID on their own phone before you begin.
        </p>
      </Card>
      <div className="mt-6">
        <PrimaryButton disabled={!verified} onClick={next}>
          {verified ? "Identity confirmed" : "Verify ID and SSN to continue"}
        </PrimaryButton>
      </div>
    </Shell>
  );
}

export function CmaConsent({ next }: { next: () => void }) {
  // Every box starts UNCHECKED (corrections sheet 2026-08-31, item 2) —
  // consent is given in front of the CMA, never presumed by a default.
  const [granted, setGranted] = useState<Record<string, boolean>>({
    care: false, telehealth: false, recording: false,
  });
  const items: [string, string][] = [
    ["care", "Care and clinical data"],
    ["telehealth", "Telehealth session with a remote audiologist"],
    ["recording", "Session recording (optional)"],
  ];
  // Care and telehealth are required; recording alone may be declined (persona spec §4).
  const canProceed = granted.care && granted.telehealth;

  return (
    <Shell tablet>
      <PageHeader title="Capture consent" subtitle="Walk the patient through each item. Consent is a gate." eyebrow="Consent" />
      <div className="space-y-3">
        {items.map(([k, label]) => (
          <button key={k} onClick={() => setGranted(g => ({ ...g, [k]: !g[k] }))}
            className="flex w-full items-start gap-3 rounded-2xl bg-white p-4 text-left">
            <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md border ${
              granted[k] ? "border-teal-ink bg-teal-ink text-white" : "border-slate-300"}`}>
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
