"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Play, Wifi } from "lucide-react";
import { Card, StatusPill } from "../ui";
import { audiogram } from "@/lib/mock-data";
import { advanceSweep, lossBand, pta, type SweepState } from "@/lib/exam";
import type { Framing } from "./otoscopy-step";

// Each ear sweeps for ~4s; the whole animation runs once per visit to the
// screen (the story shell remounts it, so stepping back replays it).
const TICK_MS = 80, STEP = 2;

// The ring's arc length at r=43 in the 100-unit viewBox.
const ARC = 270;

/**
 * Both ears get tested, right then left, and each posts its own result
 * (corrections sheet 2026-08-31, item 4 + refinement): the sweep is a live
 * animation, not a frozen snapshot.
 */
function useSweep(): SweepState {
  const [s, setS] = useState<SweepState>({ phase: "right", progress: 0 });
  useEffect(() => {
    if (s.phase === "done") return;
    const id = setInterval(() => setS(cur => advanceSweep(cur, STEP)), TICK_MS);
    return () => clearInterval(id);
  }, [s.phase]);
  return s;
}

function EarCard({ label, avg, state, progress }:
  { label: string; avg: number; state: "pending" | "testing" | "done"; progress: number }) {
  return (
    <Card className="p-4">
      <span className="text-xs text-slate-500">{label}</span>
      {state === "done" ? <>
        <h3 className="text-sm font-extrabold">{avg} dB HL</h3>
        <p className="mt-1 text-[11px] leading-4 text-slate-500">{lossBand(avg)} · avg 500–4k Hz</p>
        <div className="mt-2"><StatusPill tone="green">Complete</StatusPill></div>
      </> : state === "testing" ? <>
        <h3 className="text-sm font-extrabold">Testing — {Math.round(progress)}%</h3>
        <p className="mt-1 text-[11px] leading-4 text-slate-500">Result posts when the sweep ends</p>
        <div className="mt-2"><StatusPill tone="blue">In progress</StatusPill></div>
      </> : <>
        <h3 className="text-sm font-extrabold text-slate-400">Waiting</h3>
        <p className="mt-1 text-[11px] leading-4 text-slate-500">Starts after the right ear</p>
        <div className="mt-2"><StatusPill tone="amber">Up next</StatusPill></div>
      </>}
    </Card>
  );
}

export function PureToneStep({ framing }: { framing: Framing }) {
  const sweep = useSweep();
  const done = sweep.phase === "done";
  const right = pta(audiogram.frequencies, audiogram.right);
  const left = pta(audiogram.frequencies, audiogram.left);

  return (
    <>
      <div className="relative mx-auto mt-2 grid h-56 w-56 place-items-center rounded-full bg-white shadow-card">
        <svg className="absolute inset-4 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="43" fill="none" stroke="#e6efef" strokeWidth="6" />
          <circle cx="50" cy="50" r="43" fill="none" stroke="#12aaa5" strokeWidth="6"
                  strokeLinecap="round" strokeDasharray={ARC}
                  strokeDashoffset={ARC * (1 - sweep.progress / 100)}
                  style={{ transition: `stroke-dashoffset ${TICK_MS}ms linear` }} />
        </svg>
        <div className="text-center">
          {done ? <>
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#dcf5ef] text-emerald-600"><Check size={26} /></span>
            <p className="mt-2 text-xs font-bold uppercase tracking-widest text-brand-teal">Both ears complete</p>
          </> : <>
            <b className="text-4xl">{Math.round(sweep.progress)}%</b>
            <p className="mt-1 text-xs font-bold uppercase tracking-widest text-brand-teal">Testing {sweep.phase} ear</p>
            <motion.p animate={{ opacity: [1, .25, 1] }} transition={{ repeat: Infinity, duration: 1.2 }}
              className="mt-1 text-[10px] font-semibold text-slate-400">♪ tone playing</motion.p>
          </>}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <EarCard label="Right ear" avg={right} progress={sweep.progress}
          state={sweep.phase === "right" ? "testing" : "done"} />
        <EarCard label="Left ear" avg={left} progress={sweep.progress}
          state={sweep.phase === "left" ? "testing" : done ? "done" : "pending"} />
      </div>

      {framing === "patient" ? (
        <>
          <motion.button
            animate={done ? { scale: 1 } : { scale: [1, 1.06, 1] }}
            transition={done ? {} : { repeat: Infinity, duration: 1.2 }}
            className="mx-auto mt-6 grid h-24 w-24 place-items-center rounded-full bg-brand-navy text-white shadow-card">
            <Play size={34} fill="currentColor" />
          </motion.button>
          <p className="mt-4 text-center text-[15px] text-slate-500">
            {done ? "All done — nicely heard" : "Press when you hear the tone"}
          </p>
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
        <Wifi className="shrink-0 text-brand-teal" />
        <div className="min-w-0 flex-1">
          <b className="text-sm">Environment is stable</b>
          <p className="text-xs text-slate-500">Ambient noise within clinical range</p>
        </div>
        <StatusPill tone="green">Good</StatusPill>
      </Card>
    </>
  );
}
