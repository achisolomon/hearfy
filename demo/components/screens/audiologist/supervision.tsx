"use client";
import { AlertTriangle, WifiOff } from "lucide-react";
import { Card, PrimaryButton, StatusPill } from "../../ui";
import { cn } from "@/lib/cn";
import { supervisionQueue, clinician } from "@/lib/mock-data";
import { Audiogram } from "../../charts/audiogram";
import { ExamSparkline } from "../../charts/exam-sparkline";
import { HomeFeed } from "./home-feed";
import { VideoSplit } from "../video-split";

/** Red flags first, then longest wait — the MRD prioritisation cues (spec §7). */
function prioritised() {
  return [...supervisionQueue].sort((a, b) => {
    if (a.redFlag !== b.redFlag) return a.redFlag ? -1 : 1;
    return b.waitMins - a.waitMins;
  });
}

function Tile({ e, onOpen }: { e: (typeof supervisionQueue)[number]; onOpen?: () => void }) {
  // Chart world: the tile IS a chart. A red flag no longer pulses the whole
  // card (motion that says "alarm" but carries no state); it states itself in
  // a row with the action beside it, which is both calmer and more useful.
  const className = cn(
    "rounded-2xl border bg-white p-4 text-left transition",
    e.redFlag ? "border-[#eebcbc]" : "border-[#e4eef0]",
    e.hero ? "ring-2 ring-brand-teal" : "cursor-default"
  );

  const body = (
    <>
      <div className="flex items-start justify-between gap-1">
        <div>
          <b className="text-sm">{e.name}</b>
          <p className="mt-0.5 text-xs text-slate-600">{e.step}</p>
        </div>
        {/* Icons carry state, so each pairs with text for anyone not seeing the glyph. */}
        {e.redFlag && (
          <span className="flex items-center text-red-500">
            <AlertTriangle size={16} aria-hidden />
            <span className="sr-only">Needs attention</span>
          </span>
        )}
        {e.connection === "weak" && (
          <span className="flex items-center text-amber-600">
            <WifiOff size={15} aria-hidden />
            <span className="sr-only">Weak connection</span>
          </span>
        )}
      </div>

      <ExamSparkline plotted={e.plotted} label={e.name} />

      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-600">
        <span>CMA {e.cma}</span>
        <span className="tabular-nums">{e.waitMins === 0 ? "live" : `${e.waitMins}m wait`}</span>
      </div>

      {e.redFlag && (
        <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-[#fdf1f1] px-3 py-2">
          <span className="text-[11px] font-bold text-[#a63838]">
            Red flag · waiting {e.waitMins}m
          </span>
          <span className="rounded-full bg-brand-navy px-3 py-1 text-[11px] font-bold text-white">
            Respond
          </span>
        </div>
      )}
      {e.hero && <p className="mt-3 text-[11px] font-bold text-brand-teal">Open monitoring →</p>}
    </>
  );

  // Only the hero's exam opens; the rest are read-only, so they are not controls.
  // Rendering them as buttons would put five inert tab stops before the one action.
  if (!e.hero) return <div className={className}>{body}</div>;

  return (
    <button onClick={onOpen} className={className}>
      {body}
    </button>
  );
}

export function AudPanel({ next }: { next: () => void }) {
  const list = prioritised();
  return (
    <div className="min-h-[100dvh] bg-brand-bg p-6 pb-20 text-brand-navy md:pb-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6">
          <span className="text-[10px] font-extrabold uppercase tracking-[.2em] text-brand-teal">Live supervision</span>
          <h1 className="mt-2 text-[28px] font-extrabold tracking-[-.02em]">Six exams in progress</h1>
          <p className="mt-2 text-sm text-slate-600">
            {clinician.name}, {clinician.credential} · Licensed in {clinician.licenseState}
          </p>
        </header>

        {/* The room's vital signs, before the tiles: what a supervisor checks
           first is whether anything needs them right now. */}
        <div className="mb-4 flex flex-wrap gap-2">
          {[
            { v: String(list.length), l: "live" },
            { v: String(list.filter(e => e.redFlag).length), l: "need attention", warn: true },
            { v: `${Math.round(list.reduce((s, e) => s + e.waitMins, 0) / list.length)}m`, l: "average wait" },
            { v: `${list.length}/6`, l: "room capacity" },
          ].map(c => (
            <span key={c.l} className={cn(
              "rounded-full border px-3 py-1 text-[11.5px] font-bold",
              c.warn && Number(c.v) > 0
                ? "border-[#f3d9a8] bg-[#fff6e8] text-[#9d6514]"
                : "border-[#e4eef0] bg-white text-slate-600"
            )}>
              <b className="text-brand-navy tabular-nums">{c.v}</b> {c.l}
            </span>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map(e => <Tile key={e.id} e={e} onOpen={next} />)}
        </div>

        <Card className="mt-6 p-5">
          <b className="text-sm">Why one audiologist can cover six visits</b>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            The <b>2026 CMS rule change</b> replaced the physical-presence requirement with
            live remote supervision and immediate intervention — the shift from a 1:1
            clinical bottleneck to a 1:many model.
          </p>
          <p className="mt-3 text-xs leading-5 text-slate-600">
            Demo note: this shows the target model. The MVP starts at one active encounter
            per clinician, pending validated protocol and legal approval.
          </p>
        </Card>
      </div>
    </div>
  );
}

export function AudMonitor({ next }: { next: () => void }) {
  const hero = supervisionQueue.find(e => e.hero)!;
  return (
    <div className="min-h-[100dvh] bg-brand-bg p-6 pb-20 text-brand-navy md:pb-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-[.2em] text-brand-teal">Monitoring</span>
            <h1 className="mt-1 text-[26px] font-extrabold tracking-[-.02em]">{hero.name} · {hero.step}</h1>
          </div>
          <StatusPill tone="teal">Live</StatusPill>
        </header>

        {/* The one shared video geometry (refined 2026-08-31): the room feed
           sits where the call sits on every screen, clinical data beside it. */}
        <VideoSplit video={<HomeFeed cmaName={hero.cma} />}>
          <div className="space-y-3">
            <Card className="p-4">
              <b className="text-sm">Thresholds arriving live</b>
              <div className="mt-3"><Audiogram /></div>
            </Card>
            {/* Bone conduction is standard on every exam (corrections sheet
               2026-08-31, item 6) — it is monitored like any other step,
               never "added" as an intervention. */}
            <Card className="p-4">
              <b className="text-sm">Up next: bone conduction</b>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Standard on every exam. The air–bone comparison separates conductive from
                sensorineural loss.
              </p>
              <div className="mt-3"><PrimaryButton onClick={next}>Continue monitoring</PrimaryButton></div>
            </Card>
          </div>
        </VideoSplit>
      </div>
    </div>
  );
}
