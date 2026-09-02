"use client";
import { useState } from "react";
import { AlertTriangle, Check, ShieldCheck } from "lucide-react";
import { Card, PageHeader, PrimaryButton, StatusPill } from "../../ui";
import { CallShell, VideoSplit } from "../video-split";
import { HomeFeed } from "./home-feed";
import { ConfirmButton } from "./confirm-button";
import { ClearanceRow } from "../../exam/clearance-list";
import {
  REVIEWABLE, reviewOutcome, reviewReferralReason, visitGates,
  type ReviewableId, type ReviewState,
} from "@/lib/clearance";
import { reviewStore, useReview } from "@/lib/review-store";
import { supervisionQueue } from "@/lib/mock-data";
import { cn } from "@/lib/cn";

/**
 * The audiologist's pre-test checklist (owner, 2026-09-02, refined).
 *
 * As first built this screen SHOWED her a verdict the app had computed from
 * the recorded tones. That was the wrong shape: it made the checklist a
 * read-out rather than a decision, and — the tell — nobody on screen could
 * ever say "I see a problem", so the referral path was unreachable without
 * editing mock data. The owner's correction: "there needs to be a checklist to
 * approve we don't see critical issues. If she does see critical issues she
 * needs to refer the patient to a doctor and stop the procedure."
 *
 * So she rules on each physical check herself. The instrument's own reading is
 * still shown beside each one — she is reading findings, not guessing — but it
 * is evidence for her decision, never the decision.
 *
 * Only otoscopy and tympanometry are hers (owner). The questionnaire was
 * answered at intake and is shown as a read-only row for context.
 *
 * A visit is CLEARED only once she has marked both clear. Pending is not
 * cleared: `reviewOutcome` keeps the third state precisely so this screen
 * cannot let the test start before she has looked.
 */
function ReviewChoice({ gate, mark, onMark }: {
  gate: ReturnType<typeof visitGates>[number];
  mark: ReviewState[ReviewableId];
  onMark: (m: "clear" | "critical") => void;
}) {
  const id = gate.id as ReviewableId;
  return (
    <div className={cn("rounded-2xl border p-4",
      mark === "critical" ? "border-red-300 bg-[#fffafa]"
        : mark === "clear" ? "border-[#cfe9df] bg-[#fbfefc]"
        : "border-[#e4eef0] bg-white")}>
      <div className="flex items-baseline justify-between gap-3">
        <b className="text-sm text-brand-navy">{gate.label}</b>
        <span className="shrink-0 text-[11px] font-bold uppercase tracking-[.12em] text-slate-400">
          {mark === "pending" ? "Your call" : mark === "clear" ? "No critical issue" : "Critical"}
        </span>
      </div>
      {/* The instrument's reading — evidence for her decision, not the decision. */}
      <p className="mt-1 text-xs leading-5 text-slate-500">{gate.detail}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {/* Two explicit choices rather than one checkbox: "not ticked" and
            "reviewed, and it is a problem" are different clinical states, and a
            single tick cannot tell them apart. */}
        <button
          onClick={() => onMark("clear")}
          aria-pressed={mark === "clear"}
          className={cn("flex min-h-11 items-center justify-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#087d7a]",
            mark === "clear"
              ? "border-[#237451] bg-[#237451] text-white"
              : "border-[#d8e5e8] bg-white text-brand-navy hover:bg-[#f4f8f8]")}>
          <Check size={14} aria-hidden />
          No critical issue
        </button>
        <button
          onClick={() => onMark("critical")}
          aria-pressed={mark === "critical"}
          className={cn("flex min-h-11 items-center justify-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b42318]",
            mark === "critical"
              ? "border-[#b42318] bg-[#b42318] text-white"
              : "border-[#d8e5e8] bg-white text-[#b42318] hover:bg-[#fff7f7]")}>
          <AlertTriangle size={14} aria-hidden />
          Critical issue
        </button>
      </div>
    </div>
  );
}

export function AudClearance({ next }: { next: () => void }) {
  const gates = visitGates();
  const hero = supervisionQueue.find(e => e.hero)!;
  // Shared, not local: her decision has to reach Maya's and Alex's screens.
  // See lib/review-store.ts.
  const review = useReview();
  const [signed, setSigned] = useState(false);
  const outcome = reviewOutcome(review);

  const questionnaire = gates.find(g => g.id === "questionnaire")!;
  const reviewable = gates.filter(g => REVIEWABLE.includes(g.id as ReviewableId));

  const title = outcome === "stopped" ? `${hero.name} · refer to a physician`
    : outcome === "cleared" ? `${hero.name} · clear to test`
    : `${hero.name} · your review`;

  return (
    <CallShell header={
      <div>
        <PageHeader
          eyebrow="Pre-test review"
          title={title}
          subtitle="Confirm there is no critical issue on either ear check before any test begins."
        />
        <div className="-mt-2 mb-1">
          {/* Not StatusPill when stopped: its glyph is a checkmark, and a tick
              beside "Stopped" reads as approval — the one misreading this
              screen must never invite. A stopped visit gets the warning
              triangle and red ink instead. */}
          {outcome === "stopped" ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fdeaea] px-3 py-1 text-xs font-bold text-[#b42318]">
              <AlertTriangle size={13} aria-hidden />
              Stopped — referral
            </span>
          ) : (
            <StatusPill tone={signed ? "green" : "teal"}>
              {signed ? "Signed off" : outcome === "cleared" ? "Ready to sign" : "Awaiting your review"}
            </StatusPill>
          )}
        </div>
      </div>
    }>
      <VideoSplit video={<HomeFeed cmaName={hero.cma} beat="tympanometry" />}>
        <div className="space-y-3">
          <Card className="p-5">
            <b className="text-sm text-brand-navy">Pre-test safety checklist</b>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Both ear checks must be cleared by you before the hearing test begins.
            </p>

            {/* Answered at intake — context, not hers to rule on. */}
            <div className="mt-4"><ClearanceRow gate={questionnaire} /></div>

            <div className="mt-3 space-y-3">
              {reviewable.map(gate => (
                <ReviewChoice
                  key={gate.id}
                  gate={gate}
                  mark={review[gate.id as ReviewableId]}
                  onMark={m => reviewStore.set(gate.id as ReviewableId, m)}
                />
              ))}
            </div>
          </Card>

          {outcome === "stopped" ? (
            <Card className="border-red-300 p-5">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#fdeaea] text-[#b42318]">
                  <AlertTriangle size={17} aria-hidden />
                </span>
                <div>
                  <b className="text-sm text-[#b42318]">Do not proceed to testing</b>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {reviewReferralReason(review, gates)}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Stop the visit, call the patient and route them to a physician. No
                    thresholds, no results and no device recommendation come out of a visit
                    that stopped here.
                  </p>
                  <div className="mt-4">
                    <PrimaryButton onClick={next} className="bg-[#b42318] hover:bg-[#992018]">
                      Stop the visit and refer
                    </PrimaryButton>
                  </div>
                </div>
              </div>
            </Card>
          ) : signed ? (
            <Card className="p-5">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#dcf5ef] text-[#237451]">
                  <ShieldCheck size={17} aria-hidden />
                </span>
                <div>
                  <b className="text-sm">Cleared — Maya can start the test</b>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Your sign-off is on the record with today&rsquo;s findings.
                  </p>
                </div>
              </div>
              <div className="mt-4"><PrimaryButton onClick={next}>Monitor the hearing test</PrimaryButton></div>
            </Card>
          ) : outcome === "cleared" ? (
            <Card className="p-5">
              <b className="text-sm">Your call</b>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                You have cleared both ear checks. Signing releases the hearing test to begin
                and travels with the clinical record.
              </p>
              <div className="mt-4">
                <ConfirmButton
                  label="Sign off and clear for testing"
                  confirmLabel="Confirm — clear for testing"
                  note="This clears the visit to proceed to the hearing test, on your license."
                  onConfirm={() => setSigned(true)}
                />
              </div>
            </Card>
          ) : (
            /* Pending. No sign-off control exists yet — the test cannot be
               released by a clinician who has not finished looking. */
            <Card className="p-5">
              <b className="text-sm">Waiting on your review</b>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Mark each ear check above. The hearing test cannot start until you have
                cleared both.
              </p>
            </Card>
          )}
        </div>
      </VideoSplit>
    </CallShell>
  );
}
