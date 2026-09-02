"use client";
import { AlertTriangle, Check, Info } from "lucide-react";
import { Card } from "../ui";
import { cn } from "@/lib/cn";
import type { Clearance, GateResult, Verdict } from "@/lib/clearance";

/**
 * The three-item clearance checklist, shared by the CMA's clearance screen and
 * the audiologist's panel (owner, 2026-09-02).
 *
 * One component for both surfaces deliberately: the CMA and the audiologist
 * must never be looking at two different accounts of whether this visit may
 * proceed. That is the same reasoning `OtoscopyStep` is shared between the
 * exam and the clinical review — the capture she took is the capture Dr. Reed
 * reads.
 *
 * Every row states its verdict in TEXT as well as colour and icon: a checklist
 * whose only signal is a green tick is unreadable to anyone not seeing the
 * green, and this is the one screen in the product where misreading a row
 * means a device gets fitted over an untreated ear.
 */
const LOOK: Record<Verdict, { icon: typeof Check; label: string; dot: string; ink: string; ring: string }> = {
  pass: { icon: Check, label: "Pass", dot: "bg-[#dcf5ef] text-[#237451]", ink: "text-[#237451]", ring: "border-[#e4eef0]" },
  noted: { icon: Info, label: "Noted", dot: "bg-[#fff6e8] text-[#9d6514]", ink: "text-[#9d6514]", ring: "border-[#f0e0c4]" },
  fail: { icon: AlertTriangle, label: "Fail", dot: "bg-[#fdeaea] text-[#b42318]", ink: "text-[#b42318]", ring: "border-red-300" },
};

export function ClearanceRow({ gate }: { gate: GateResult }) {
  const look = LOOK[gate.verdict];
  const Icon = look.icon;
  return (
    <div className={cn("flex items-start gap-3 rounded-2xl border bg-white p-4", look.ring)}>
      <span className={cn("mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full", look.dot)}>
        <Icon size={16} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <b className="text-sm text-brand-navy">{gate.label}</b>
          <span className={cn("shrink-0 text-[11px] font-extrabold uppercase tracking-[.12em]", look.ink)}>
            {look.label}
          </span>
        </div>
        <p className="mt-1 text-xs leading-5 text-slate-500">{gate.detail}</p>
      </div>
    </div>
  );
}

/**
 * The list plus its verdict line. `title` differs by surface — the CMA is
 * being told whether she may start, the audiologist is signing the checks off
 * — but the rows never do.
 */
export function ClearanceList({ clearance, title }: { clearance: Clearance; title: string }) {
  return (
    <Card className="p-5">
      <b className="text-sm text-brand-navy">{title}</b>
      <p className="mt-1 text-xs leading-5 text-slate-500">
        All three must clear before the hearing test begins.
      </p>
      <div className="mt-4 space-y-3">
        {clearance.gates.map(gate => <ClearanceRow key={gate.id} gate={gate} />)}
      </div>
    </Card>
  );
}
