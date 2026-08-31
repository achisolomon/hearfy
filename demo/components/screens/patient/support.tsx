"use client";
import { useState } from "react";
import { Bluetooth, CalendarDays, Check, ChevronRight, FileCheck, Headphones, LifeBuoy, MessageCircle, SlidersHorizontal, Video } from "lucide-react";
import { Card, PageHeader, SecondaryButton, SecureFooter, StatusPill } from "../../ui";
import { BRAND_NAME, audiogram, devices, deviceDetail, serials, signedDocuments, visitHistory } from "@/lib/mock-data";
import { lossBand, pta } from "@/lib/exam";
import { tierFor } from "@/lib/commerce";
import { ScreenId } from "../registry";
import { Shell } from "../shared";

/**
 * The guided calibration mock (corrections sheet 2026-08-31, item 14): a
 * three-step service flow — connect, adjust, confirm — driven entirely by
 * local state so the demo can walk it and walk it back.
 */
function CalibrationCard() {
  const steps = [
    { icon: Bluetooth, title: "Connect", detail: "Both devices found over Bluetooth" },
    { icon: SlidersHorizontal, title: "Adjust", detail: "Tuning to your May 21 audiogram" },
    { icon: Check, title: "Confirm", detail: "Calibrated — left and right in balance" },
  ];
  const [step, setStep] = useState(0); // 0 = not started; 1..3 = steps done
  return (
    <Card className="mt-4 p-5">
      <div className="flex items-center justify-between">
        <b className="text-sm">Calibrate my devices</b>
        {step === steps.length && <StatusPill tone="green">Done</StatusPill>}
      </div>
      <p className="mt-1 text-xs leading-5 text-slate-500">
        A quick remote tune-up against your test results. Run it any time your hearing feels off.
      </p>
      <div className="mt-4 space-y-3">
        {steps.map(({ icon: I, title, detail }, i) => {
          const done = step > i, current = step === i;
          return (
            <div key={title} className="flex items-center gap-3">
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${
                done ? "bg-[#dcf5ef] text-emerald-600" : current ? "bg-[#e8f9f8] text-brand-teal" : "bg-[#f1f5f6] text-slate-300"}`}>
                {done ? <Check size={15} /> : <I size={15} />}
              </span>
              <div className="min-w-0 flex-1">
                <b className={`text-sm ${done || current ? "" : "text-slate-400"}`}>{title}</b>
                {done && <p className="text-xs text-slate-500">{detail}</p>}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4">
        {step < steps.length
          ? <SecondaryButton onClick={() => setStep(s => s + 1)}>
              {step === 0 ? "Start calibration" : steps[step].title}
            </SecondaryButton>
          : <SecondaryButton onClick={() => setStep(0)}>Run again</SecondaryButton>}
      </div>
    </Card>
  );
}

/**
 * Everything the visit produced, in one place (corrections sheet 2026-08-31,
 * item 14): results per ear, the device dispensed, the visits, the package
 * and the documents signed.
 */
function CareRecord({ go }: { go: (s: ScreenId) => void }) {
  const chosen = devices[0];
  const tier = tierFor(deviceDetail[chosen.name].tier);
  const ears = [
    { label: "Right ear", avg: pta(audiogram.frequencies, audiogram.right) },
    { label: "Left ear", avg: pta(audiogram.frequencies, audiogram.left) },
  ];
  return (
    <>
      <h2 className="mt-6 text-[13px] font-extrabold uppercase tracking-[.18em] text-slate-400">Your care record</h2>

      <Card className="mt-3 p-5">
        <b className="text-sm">Hearing results</b>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {ears.map(e => (
            <div key={e.label} className="rounded-2xl bg-[#f2f7f7] p-3">
              <span className="text-xs text-slate-500">{e.label}</span>
              <b className="mt-0.5 block text-sm">{e.avg} dB HL</b>
              <span className="text-[11px] text-slate-500">{lossBand(e.avg)}</span>
            </div>
          ))}
        </div>
        <button onClick={() => go("results")} className="mt-3 flex min-h-11 items-center gap-1 text-xs font-bold text-teal-ink">
          View full results <ChevronRight size={14} />
        </button>
      </Card>

      <Card className="mt-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <b className="text-sm">{chosen.name}</b>
            <p className="mt-1 text-xs text-slate-500">Serial {serials.left} / {serials.right} · fitted and activated May 21, 2025</p>
          </div>
          <StatusPill tone="green">Active</StatusPill>
        </div>
      </Card>

      <Card className="mt-3 p-5">
        <b className="text-sm">Visits</b>
        <div className="mt-3 space-y-3">
          {visitHistory.map(v => (
            <div key={v.date} className="flex items-center gap-3">
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${
                v.done ? "bg-[#dcf5ef] text-emerald-600" : "bg-[#edf4fb] text-[#235f98]"}`}>
                {v.done ? <Check size={15} /> : <CalendarDays size={14} />}
              </span>
              <div className="min-w-0 flex-1">
                <b className="text-sm">{v.what}</b>
                <p className="text-xs text-slate-500">{v.date} · {v.by}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <b className="text-sm">{tier.name} membership</b>
            <p className="mt-1 text-xs text-slate-500">${tier.monthly}/month · {tier.care} · $99 visit fee credited</p>
          </div>
        </div>
      </Card>

      <Card className="mt-3 p-5">
        <b className="text-sm">Documents you signed</b>
        <div className="mt-3 space-y-2.5">
          {signedDocuments.map(d => (
            <div key={d.name} className="flex items-center gap-3">
              <FileCheck size={16} className="shrink-0 text-brand-teal" />
              <span className="min-w-0 flex-1 text-sm text-slate-600">{d.name}</span>
              <span className="text-[11px] text-slate-400">{d.signed}</span>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

export function Support({go,back}:{go:(s:ScreenId)=>void;back:()=>void}){return <Shell><PageHeader title="We’re here after delivery" subtitle={`Your ${BRAND_NAME} care team stays with you through setup and adjustment.`} onBack={back} eyebrow="Ongoing care"/><Card className="overflow-hidden bg-gradient-to-br from-[#e5f8f6] to-white p-5"><LifeBuoy className="text-brand-teal" size={30}/><h2 className="mt-5 text-2xl font-extrabold">Your 30-day support plan</h2><p className="mt-2 text-sm leading-6 text-slate-500">Guided setup, remote adjustments, and a follow-up hearing check are included.</p></Card>
<CareRecord go={go}/>
<CalibrationCard/>
<div className="mt-4 grid grid-cols-2 gap-3">{[[MessageCircle,"Message care team"],[Video,"Video support"],[CalendarDays,"Book follow-up"],[Headphones,"Device tutorials"]].map(([I,t]:any)=><button key={t} className="rounded-[22px] bg-white p-4 text-left shadow-card"><I className="text-brand-teal"/><b className="mt-5 block text-sm">{t}</b></button>)}</div><Card className="mt-4 flex items-center gap-3 p-4"><span className="grid h-12 w-12 place-items-center rounded-full bg-[#e9f8f7] text-brand-teal"><MessageCircle/></span><div className="flex-1"><b className="text-sm">{BRAND_NAME} Care</b><p className="text-xs text-slate-500">Typical reply in under 2 minutes</p></div><ChevronRight/></Card><div className="mt-6"><SecondaryButton onClick={()=>go("home")}>Return home</SecondaryButton></div><SecureFooter/></Shell>}
