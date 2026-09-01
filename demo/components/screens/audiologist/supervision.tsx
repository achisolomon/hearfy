"use client";
import { useEffect, useState } from "react";
import { AlertTriangle, WifiOff } from "lucide-react";
import { Card, PageHeader, PrimaryButton, StatusPill } from "../../ui";
import { cn } from "@/lib/cn";
import { supervisionQueue, clinician, type SupervisionExam } from "@/lib/mock-data";
import { Audiogram } from "../../charts/audiogram";
import { HomeFeed } from "./home-feed";
import { VideoSplit } from "../video-split";
import { ExamPeek } from "./peek";

/** Red flags first, then longest wait — the MRD prioritisation cues (spec §7). */
function prioritised(acked: Record<string, boolean>) {
  return [...supervisionQueue].sort((a, b) => {
    // An acknowledged flag stops jumping the queue: it has been dealt with,
    // and leaving it pinned to the top would recreate the noise the
    // acknowledgement just cleared.
    const aFlag = a.redFlag && !acked[a.id];
    const bFlag = b.redFlag && !acked[b.id];
    if (aFlag !== bFlag) return aFlag ? -1 : 1;
    return b.waitMins - a.waitMins;
  });
}

/**
 * Wait times advance while the panel is open, so it reads as live rather than
 * as a screenshot (persona spec §2: "ticking timers, advancing steps").
 *
 * One interval for the whole grid, not one per tile. Under
 * `prefers-reduced-motion` it never starts — a number that changes on its own
 * is motion, and the demo's contract is that motion is opt-out everywhere.
 */
function useTickingWaits(): Record<string, number> {
  const [ticks, setTicks] = useState(0);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setTicks(t => t + 1), 12000);
    return () => window.clearInterval(id);
  }, []);
  return Object.fromEntries(
    supervisionQueue.map(e => [e.id, e.waitMins === 0 ? 0 : e.waitMins + ticks])
  );
}

function Tile({ e, waitMins, acknowledged, onOpen }: {
  e: SupervisionExam; waitMins: number; acknowledged: boolean; onOpen: () => void;
}) {
  const flagging = e.redFlag && !acknowledged;
  return (
    <button
      onClick={onOpen}
      aria-label={`${e.name}, ${e.step}${flagging ? ", needs attention" : ""}. Open details.`}
      className={cn(
        "rounded-2xl border bg-white p-4 text-left transition hover:shadow-soft",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#087d7a]",
        flagging ? "border-red-300 animate-pulse motion-reduce:animate-none" : "border-[#e4eef0]",
        e.hero && "ring-2 ring-brand-teal"
      )}
    >
      <div className="flex items-start justify-between gap-1">
        <div>
          <b className="text-sm">{e.name}</b>
          <p className="mt-0.5 text-xs text-slate-500">{e.step}</p>
        </div>
        {/* Icons carry state, so each pairs with text for anyone not seeing the glyph. */}
        {flagging && (
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
      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
        <span>CMA {e.cma}</span>
        <span>{waitMins === 0 ? "live" : `${waitMins}m wait`}</span>
      </div>
      {e.hero && <p className="mt-3 text-[11px] font-bold text-[#087d7a]">Open monitoring →</p>}
      {e.redFlag && acknowledged && (
        <p className="mt-3 inline-block rounded-full bg-[#edf8f2] px-2.5 py-1 text-[10px] font-bold text-[#237451]">
          Acknowledged · on-call
        </p>
      )}
    </button>
  );
}

export function AudPanel({ next }: { next: () => void }) {
  const [acked, setAcked] = useState<Record<string, boolean>>({});
  const [openId, setOpenId] = useState<string | null>(null);
  const waits = useTickingWaits();
  const list = prioritised(acked);
  const open = supervisionQueue.find(e => e.id === openId) ?? null;

  return (
    <div className="min-h-[100dvh] bg-brand-bg p-6 pb-32 text-brand-navy md:pb-6">
      <div className="mx-auto max-w-5xl">
        <PageHeader
          eyebrow="Live supervision"
          title="Six exams in progress"
          subtitle={`${clinician.name}, ${clinician.credential} · Licensed in ${clinician.licenseState}`}
        />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map(e => (
            <Tile
              key={e.id}
              e={e}
              waitMins={waits[e.id] ?? e.waitMins}
              acknowledged={!!acked[e.id]}
              onOpen={() => setOpenId(e.id)}
            />
          ))}
        </div>

        <ExamPeek
          exam={open}
          acknowledged={!!(open && acked[open.id])}
          onAcknowledge={() => { if (open) setAcked(a => ({ ...a, [open.id]: true })); setOpenId(null); }}
          onOpenMonitoring={() => { setOpenId(null); next(); }}
          onClose={() => setOpenId(null)}
        />

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
    <div className="min-h-[100dvh] bg-brand-bg p-6 pb-32 text-brand-navy md:pb-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <PageHeader eyebrow="Monitoring" title={`${hero.name} · ${hero.step}`} />
          </div>
          <span className="mt-1 shrink-0"><StatusPill tone="teal">Live</StatusPill></span>
        </div>

        {/* The one shared video geometry (refined 2026-08-31): the room feed
           sits where the call sits on every screen, clinical data beside it. */}
        <VideoSplit video={<HomeFeed cmaName={hero.cma} beat="puretone" />}>
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
