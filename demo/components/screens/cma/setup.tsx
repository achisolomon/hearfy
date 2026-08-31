"use client";
import { useState } from "react";
import { Check, Lock } from "lucide-react";
import { Card, PageHeader, PrimaryButton } from "../../ui";
import { Shell } from "../shared";
import { kit } from "@/lib/mock-data";

/** The calibration checklist is a HARD GATE — no bypass control exists (persona spec §4). */
export function CmaCalibration({ next }: { next: () => void }) {
  const [done, setDone] = useState<boolean[]>(kit.checklist.map(() => false));
  const allDone = done.every(Boolean);

  return (
    <Shell>
      <PageHeader title="Kit checklist" subtitle="Every item must pass before the exam can start." eyebrow={`Kit ${kit.id}`} />
      <div className="space-y-3">
        {kit.checklist.map((item, i) => (
          <button key={item} onClick={() => setDone(d => d.map((v, j) => j === i ? !v : v))}
            className="flex w-full items-center gap-3 rounded-2xl bg-white p-4 text-left">
            <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${
              done[i] ? "bg-[#dcf5ef] text-emerald-600" : "bg-[#f1f5f6] text-slate-300"}`}>
              {done[i] && <Check size={16} />}
            </span>
            <b className="text-sm">{item}</b>
          </button>
        ))}
      </div>
      {!allDone && (
        <Card className="mt-4 flex items-center gap-3 p-4">
          <Lock size={17} className="text-slate-400" />
          <p className="text-sm text-slate-500">
            The exam is locked until the checklist passes. A failed or expired calibration is
            reported, not overridden.
          </p>
        </Card>
      )}
      <div className="mt-6">
        <PrimaryButton disabled={!allDone} onClick={next}>Begin exam</PrimaryButton>
      </div>
    </Shell>
  );
}
