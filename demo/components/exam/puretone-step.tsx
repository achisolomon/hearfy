"use client";
import { Play, Wifi } from "lucide-react";
import { Card, StatusPill } from "../ui";
import type { Framing } from "./otoscopy-step";

export function PureToneStep({ framing }: { framing: Framing }) {
  return (
    <>
      <div className="relative mx-auto mt-2 grid h-56 w-56 place-items-center rounded-full bg-white shadow-card">
        <svg className="absolute inset-4 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="43" fill="none" stroke="#e6efef" strokeWidth="6" />
          <circle cx="50" cy="50" r="43" fill="none" stroke="#12aaa5" strokeWidth="6"
                  strokeLinecap="round" strokeDasharray="270" strokeDashoffset="90" />
        </svg>
        <div className="text-center">
          <b className="text-4xl">67%</b>
          <p className="mt-1 text-xs font-bold uppercase tracking-widest text-brand-teal">Testing left ear</p>
        </div>
      </div>

      {framing === "patient" ? (
        <>
          <button className="mx-auto mt-6 grid h-24 w-24 place-items-center rounded-full bg-brand-navy text-white shadow-card">
            <Play size={34} fill="currentColor" />
          </button>
          <p className="mt-4 text-center text-[15px] text-slate-500">Press when you hear the tone</p>
        </>
      ) : (
        <Card className="mt-5 p-4">
          <b className="text-sm">Coach the patient</b>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            &ldquo;Press every time you hear a tone, even a very soft one.&rdquo; Watch for
            false presses; repeat a frequency if responses look inconsistent.
          </p>
        </Card>
      )}

      <Card className="mt-4 flex items-center gap-3 p-4">
        <Wifi className="text-brand-teal" />
        <div className="flex-1">
          <b className="text-sm">Environment is stable</b>
          <p className="text-xs text-slate-500">Ambient noise within clinical range</p>
        </div>
        <StatusPill tone="green">Good</StatusPill>
      </Card>
    </>
  );
}
