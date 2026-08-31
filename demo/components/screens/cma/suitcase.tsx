"use client";
import { useState } from "react";
import { Briefcase, Check, PackageCheck, Truck } from "lucide-react";
import { Card, PageHeader, PrimaryButton, StatusPill } from "../../ui";
import { cn } from "@/lib/cn";
import { createLatch } from "@/lib/latch";
import { Shell } from "../shared";
import { devices, deviceDetail, patient } from "@/lib/mock-data";
import { creditedFirstMonth, tierFor } from "@/lib/commerce";

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
    <Shell>
      <PageHeader title="Signed shortlist" subtitle="Open the case. The patient tries what is here." eyebrow="Prescription locked" />
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
    <Shell>
      <PageHeader title="Try-on" subtitle="Fit each device. Record which ones were tried." eyebrow="In the home" />
      <div className="space-y-3">
        {inCase.map(d => {
          const on = tried.includes(d.name);
          return (
            <button key={d.name}
              aria-pressed={on}
              onClick={() => { setTried(t => on ? t.filter(n => n !== d.name) : [...t, d.name]); triedLatch.set(); }}
              className={cn("flex w-full items-center gap-3 rounded-2xl border p-4 text-left",
                on ? "border-brand-teal bg-[#edfbfa]" : "border-[#dfeaec] bg-white")}>
              <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-full",
                on ? "bg-brand-teal text-white" : "bg-[#f1f5f6] text-slate-300")}>
                <Check size={15} />
              </span>
              <span className="flex-1">
                <b className="block text-sm">{d.name}</b>
                <span className="text-xs text-slate-500">Dome size M · left and right</span>
              </span>
            </button>
          );
        })}
      </div>
      <Card className="mt-4 p-4">
        <p className="text-sm leading-6 text-slate-500">
          Check comfort and retention on both ears. Swap dome size if the fit is loose.
        </p>
      </Card>
      <div className="mt-6">
        <PrimaryButton disabled={!gateOpen} onClick={next}>
          {gateOpen ? "Patient has chosen" : "Record a try-on to continue"}
        </PrimaryButton>
      </div>
    </Shell>
  );
}

export function CmaActivate({ next }: { next: () => void }) {
  // The patient's pick — Premium tier in the hero story.
  const chosen = devices[0];
  const tier = deviceDetail[chosen.name].tier;
  const { monthly, credit, dueNow } = creditedFirstMonth(tier);
  return (
    <Shell>
      <PageHeader title="Fit &amp; activate" subtitle={`${chosen.name} · ${tierFor(tier).name} membership`} eyebrow="Same day" />
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
    </Shell>
  );
}

export function CmaCloseout({ next }: { next: () => void }) {
  const chosen = devices[0];
  return (
    <Shell>
      <PageHeader title="Visit complete" subtitle={`${patient.name} left the visit hearing.`} eyebrow="Close-out" />
      <Card className="grid place-items-center p-8 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-[#edf8f7] text-brand-teal">
          <PackageCheck size={26} />
        </span>
        <b className="mt-4 text-[15px]">{chosen.name} dispensed</b>
        <p className="mt-2 text-sm text-slate-500">Serial HF-2284-L / HF-2284-R · activated on site</p>
      </Card>
      <Card className="mt-3 p-4">
        <b className="text-sm">Next visit</b>
        <p className="mt-1 text-sm text-slate-500">11:30 — Doris P., Coconut Grove</p>
      </Card>
      <div className="mt-6"><PrimaryButton onClick={next}>Back to today&rsquo;s visits</PrimaryButton></div>
    </Shell>
  );
}
