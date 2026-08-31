"use client";
import { AlertTriangle, WifiOff } from "lucide-react";
import { Card, PrimaryButton, StatusPill } from "../../ui";
import { cn } from "@/lib/cn";
import { supervisionQueue, clinician } from "@/lib/mock-data";
import { Audiogram } from "../../charts/audiogram";
import { HomeFeed } from "./home-feed";

/** Red flags first, then longest wait — the MRD prioritisation cues (spec §7). */
function prioritised() {
  return [...supervisionQueue].sort((a, b) => {
    if (a.redFlag !== b.redFlag) return a.redFlag ? -1 : 1;
    return b.waitMins - a.waitMins;
  });
}

function Tile({ e, onOpen }: { e: (typeof supervisionQueue)[number]; onOpen?: () => void }) {
  const className = cn(
    "rounded-2xl border bg-white p-4 text-left transition",
    e.redFlag ? "border-red-300 animate-pulse motion-reduce:animate-none" : "border-[#e4eef0]",
    e.hero ? "ring-2 ring-brand-teal" : "cursor-default opacity-90"
  );

  const body = (
    <>
      <div className="flex items-start justify-between gap-1">
        <div>
          <b className="text-sm">{e.name}</b>
          <p className="mt-0.5 text-xs text-slate-500">{e.step}</p>
        </div>
        {/* Icons carry state, so each pairs with text for anyone not seeing the glyph. */}
        {e.redFlag && (
          <span className="flex items-center text-red-500">
            <AlertTriangle size={16} aria-hidden />
            <span className="sr-only">Needs attention</span>
          </span>
        )}
        {e.connection === "weak" && (
          <span className="flex items-center text-amber-500">
            <WifiOff size={15} aria-hidden />
            <span className="sr-only">Weak connection</span>
          </span>
        )}
      </div>
      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
        <span>CMA {e.cma}</span>
        <span>{e.waitMins === 0 ? "live" : `${e.waitMins}m wait`}</span>
      </div>
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
          <p className="mt-2 text-sm text-slate-500">
            {clinician.name}, {clinician.credential} · Licensed in {clinician.licenseState}
          </p>
        </header>

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
          <p className="mt-3 text-xs leading-5 text-slate-400">
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

        {/* Zoom-like (refined 2026-08-31): once the test starts the room IS
           the screen — the video leads, the clinical data rides beside it. */}
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <HomeFeed hero cmaName={hero.cma} />

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
        </div>
      </div>
    </div>
  );
}
