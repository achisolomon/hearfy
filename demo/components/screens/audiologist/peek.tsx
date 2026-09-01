"use client";
import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { PrimaryButton, StatusPill } from "../../ui";
import type { SupervisionExam } from "@/lib/mock-data";

/**
 * The peek card (critique 2026-08-31, P0).
 *
 * Shipped, five of the six tiles were inert `<div>`s and the red-flagged exam
 * could not be opened, escalated or acknowledged from the audiologist's own
 * screen — a pulsing red border that resolved to nothing, which is the
 * alarm-fatigue pattern a clinical tool must not ship, and decoration in a
 * system whose stated rule is "state over decoration".
 *
 * Scope is deliberately the persona spec's ceiling: non-hero exams are
 * read-only, "at most a peek card". So this shows the tile's facts and, for a
 * flagged exam, offers exactly one action — acknowledge and route to on-call.
 * No second live feed: "one call, one room" is the product's claim, and
 * VideoSplit owns the call's geometry.
 *
 * A native <dialog> rather than an absolutely-positioned panel: it escapes the
 * tile grid's stacking context, and gets focus trapping, Escape-to-close and
 * the backdrop from the platform instead of from us.
 */
export function ExamPeek({ exam, acknowledged, onAcknowledge, onOpenMonitoring, onClose }: {
  exam: SupervisionExam | null;
  acknowledged: boolean;
  onAcknowledge: () => void;
  /**
   * Absent while the panel is idle: before testing starts there is no live
   * monitoring to open, and wiring one here would jump the story eighteen
   * beats into a case that has not begun.
   */
  onOpenMonitoring?: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  // showModal() is imperative, so open/close has to be driven from the prop
  // rather than from JSX. Calling it twice throws, hence the guards.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (exam && !el.open) el.showModal();
    if (!exam && el.open) el.close();
  }, [exam]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={e => { if (e.target === ref.current) onClose(); }}
      aria-label={exam ? `${exam.name} — exam details` : undefined}
      className="w-[min(22rem,calc(100vw-2rem))] rounded-[24px] border border-[#e4eef0] bg-white p-0 text-brand-navy shadow-card backdrop:bg-[rgba(11,35,64,.34)]"
    >
      {exam && (
        <div className="p-5">
          <div className="flex items-start justify-between gap-3 border-b border-[#eef4f5] pb-3">
            <div className="min-w-0">
              <b className="block text-lg tracking-[-.02em]">{exam.name}</b>
              <span className="mt-0.5 block text-xs text-slate-500">CMA {exam.cma}</span>
            </div>
            <button
              onClick={onClose}
              aria-label="Close details"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#f1f5f6] text-slate-500"
            >
              <X size={17} aria-hidden />
            </button>
          </div>

          <dl className="mt-3 space-y-1.5">
            {[
              ["Step", exam.step],
              ["Waiting", exam.waitMins === 0 ? "Live now" : `${exam.waitMins} min`],
              ["Connection", exam.connection === "weak" ? "Weak" : "Good"],
            ].map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between gap-3 text-sm">
                <dt className="text-slate-500">{k}</dt>
                <dd className="font-semibold">{v}</dd>
              </div>
            ))}
          </dl>

          {exam.redFlag && !acknowledged && (
            <>
              <p className="mt-4 rounded-2xl bg-[#fff6e8] px-4 py-3 text-xs leading-5 text-[#9d6514]">
                <b>Needs attention.</b> {exam.flagReason}
              </p>
              <div className="mt-3">
                <PrimaryButton onClick={onAcknowledge}>Acknowledge &amp; route to on-call</PrimaryButton>
              </div>
              <p className="mt-2 text-center text-[11px] text-slate-400">
                Clears the flag · logged to the record
              </p>
            </>
          )}

          {exam.redFlag && acknowledged && (
            <div className="mt-4"><StatusPill tone="green">Acknowledged · routed to on-call</StatusPill></div>
          )}

          {exam.hero && onOpenMonitoring && (
            <div className="mt-4"><PrimaryButton onClick={onOpenMonitoring}>Open full monitoring</PrimaryButton></div>
          )}

          {!exam.hero && !exam.redFlag && (
            <p className="mt-4 border-t border-[#eef4f5] pt-3 text-center text-[11px] text-slate-400">
              Read-only — only the active exam opens fully
            </p>
          )}
        </div>
      )}
    </dialog>
  );
}
