"use client";
import { AlertTriangle } from "lucide-react";
import { Card } from "../../ui";
import { cn } from "@/lib/cn";
import { exceptions } from "@/lib/mock-data";

const TONE = {
  high: "border-l-red-500 bg-red-50/40",
  medium: "border-l-amber-500 bg-amber-50/30",
  low: "border-l-slate-300",
} as const;

/** Exception-first: the operator works this list, not the happy path. */
export function Exceptions() {
  const order = { high: 0, medium: 1, low: 2 } as const;
  const sorted = [...exceptions].sort((a, b) => order[a.severity] - order[b.severity]);

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <b className="text-sm">Exception queue</b>
        <span className="flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-600">
          <AlertTriangle size={12} /> {sorted.filter(e => e.severity === "high").length} urgent
        </span>
      </div>
      <div className="mt-4 space-y-2">
        {sorted.map(e => (
          <div key={e.kind + e.patient}
               className={cn("flex items-start justify-between gap-4 rounded-xl border-l-4 p-3", TONE[e.severity])}>
            <div>
              <b className="text-sm">{e.kind}</b>
              <p className="mt-0.5 text-xs text-slate-500">{e.patient} · stage {e.stage}</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">{e.detail}</p>
            </div>
            <span className="shrink-0 text-xs font-bold text-slate-400">{e.age}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
