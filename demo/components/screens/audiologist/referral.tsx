"use client";
import { Check, Stethoscope } from "lucide-react";
import { Card, PageHeader } from "../../ui";
import { CallShell, VideoSplit } from "../video-split";
import { HomeFeed } from "./home-feed";
import { criticalGates, reviewReferralReason, visitGates } from "@/lib/clearance";
import { useReview } from "@/lib/review-store";
import { supervisionQueue, patient } from "@/lib/mock-data";

/**
 * Where a stopped visit ends for Dr. Reed (owner, 2026-09-02).
 *
 * Her own "Stop the visit and refer" used to call the story's shared `next()`,
 * which advanced to `aud-monitor` — she pressed stop and was handed live
 * thresholds for a test that must never have run. This is the destination that
 * was missing.
 *
 * The record of her decision, and the referral she is making. No forward
 * control: nothing further happens on this visit.
 */
export function AudReferral() {
  const review = useReview();
  const gates = visitGates();
  const hero = supervisionQueue.find(e => e.hero)!;
  const flagged = criticalGates(review, gates);

  return (
    <CallShell header={
      <div>
        <PageHeader
          eyebrow="Visit closed"
          title={`${hero.name} · referred to a physician`}
          subtitle="The exam stopped at the pre-test checks. No thresholds were taken."
        />
        <div className="-mt-2 mb-1">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fdeaea] px-3 py-1 text-xs font-bold text-[#b42318]">
            <Stethoscope size={13} aria-hidden />
            Referral issued
          </span>
        </div>
      </div>
    }>
      <VideoSplit video={<HomeFeed cmaName={hero.cma} beat="tympanometry" />}>
        <div className="space-y-3">
          <Card className="border-red-300 p-5">
            <b className="text-sm text-[#b42318]">Your finding</b>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {reviewReferralReason(review, gates)}
            </p>
            {/* The specific checks she flagged, with what the instruments
                recorded — this is what travels to the physician. */}
            <div className="mt-4 space-y-2">
              {flagged.map(g => (
                <div key={g.id} className="rounded-xl border border-[#f0d6d6] bg-[#fffafa] p-3">
                  <b className="text-xs text-brand-navy">{g.label}</b>
                  <p className="mt-0.5 text-xs leading-5 text-slate-500">{g.detail}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <b className="text-sm">Referral actions</b>
            <div className="mt-4 space-y-3">
              {[
                `Call ${patient.name} and explain the finding`,
                "Release today's otoscopy images and tympanograms to the referral",
                "Flag the record: no hearing test, no prescription, no device",
                "Re-book only after a physician has cleared him",
              ].map(x => (
                <div key={x} className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#dcf5ef] text-emerald-600">
                    <Check size={14} aria-hidden />
                  </span>
                  <span className="text-sm leading-6 text-slate-600">{x}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <b className="text-sm">This is not a lost patient</b>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Once a physician has treated and cleared him, the visit resumes from the
              hearing test — the intake, consent and today&rsquo;s ear findings all carry
              over.
            </p>
          </Card>
        </div>
      </VideoSplit>
    </CallShell>
  );
}
