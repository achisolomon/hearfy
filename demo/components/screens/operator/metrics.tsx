"use client";
import { Card } from "../../ui";
import { metrics } from "@/lib/mock-data";

const money = (n: number) => `$${n.toLocaleString("en-US")}`;

export function Metrics() {
  return (
    <section>
      {/* Membership leads — Hearfy is a subscription business (spec §9a). */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active memberships</span>
          <b className="mt-1 block text-3xl text-brand-navy">{metrics.activeMemberships.toLocaleString("en-US")}</b>
        </Card>
        <Card className="p-5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">MRR</span>
          <b className="mt-1 block text-3xl text-brand-navy">{money(metrics.mrr)}</b>
        </Card>
        <Card className="p-5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">New this month</span>
          <b className="mt-1 block text-3xl text-brand-navy">{metrics.newThisMonth}</b>
        </Card>
      </div>

      {/* Tier mix — a better revenue story than one ARPU figure (spec §9b). */}
      <Card className="mt-3 p-5">
        <b className="text-sm">Membership mix</b>
        <div className="mt-4 space-y-3">
          {metrics.mix.map(m => {
            const pct = Math.round(m.count / metrics.activeMemberships * 100);
            return (
              <div key={m.tier}>
                <div className="flex justify-between text-xs">
                  <b>{m.tier} · ${m.monthly}/mo</b>
                  <span className="text-slate-400">{m.count} · {pct}%</span>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-[#eef4f5]">
                  <div className="h-full rounded-full bg-brand-teal" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Funnel that feeds it. Conversion, Device GP and Supervision have no
          source in the deck or the MRD — demo placeholders only (spec §14).
          They're flagged `illustrative` below so investors don't mistake
          them for sourced figures; Visit fee is the real commercial model
          and stays unmarked. */}
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        {([
          ["Visit fee", "$99", "credited to month 1", false],
          ["Conversion", `${Math.round(metrics.conversion * 100)}%`, "visit → membership", true],
          ["Device GP", money(metrics.deviceGrossProfit), "per device", true],
          ["Supervision", `1 : ${metrics.supervisionRatio}`, "audiologist : exams", true],
        ] as [label: string, value: string, sub: string, illustrative: boolean][]).map(([l, v, sub, illustrative]) => (
          <Card key={l} className="p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{l}</span>
              {illustrative && (
                <span className="rounded-full bg-[#fff6e8] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#9d6514]">
                  Illustrative
                </span>
              )}
            </div>
            <b className="mt-1 block text-xl text-brand-navy">{v}</b>
            <span className="text-[11px] text-slate-400">{sub}</span>
          </Card>
        ))}
      </div>
    </section>
  );
}
