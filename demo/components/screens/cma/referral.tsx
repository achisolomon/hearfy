"use client";
import { Check, Stethoscope } from "lucide-react";
import { Card, PageHeader } from "../../ui";
import { CallShell } from "../video-split";
import { CallSplit } from "./call-tile";
import { reviewReferralReason, visitGates } from "@/lib/clearance";
import { useReview } from "@/lib/review-store";
import { clinician, patient } from "@/lib/mock-data";

/**
 * Where a stopped visit ends for Maya (owner, 2026-09-02).
 *
 * Her clearance screen's referral button used to call the story's shared
 * `next()`, whose next beat is the pure tone test — so the control that says
 * "stop" walked her into the very test being stopped. This is the destination
 * that was missing.
 *
 * It is a close-out checklist, not a clinical screen: the decision was made
 * one beat ago by the clinician and is not hers to revisit. What is hers is
 * what happens in the room now — pack up, hand over, and do not start
 * anything. Deliberately no forward control: the visit is over.
 */
export function CmaReferral() {
  const review = useReview();
  return (
    <CallShell header={
      <PageHeader
        eyebrow="Visit closed"
        title="Referred — pack up the kit"
        subtitle={`${clinician.name} is calling ${patient.name} now. Do not run any further tests.`}
      />
    }>
      <CallSplit note="Is on the phone to the patient explaining the referral — stay in the room until she is done.">
        <Card className="border-red-300 p-5">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#fdeaea] text-[#b42318]">
              <Stethoscope size={17} aria-hidden />
            </span>
            <div>
              <b className="text-sm text-[#b42318]">Why this visit stopped</b>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {reviewReferralReason(review, visitGates())}
              </p>
            </div>
          </div>
        </Card>

        <Card className="mt-4 p-5">
          <b className="text-sm">Before you leave</b>
          <div className="mt-4 space-y-3">
            {[
              "Pack the kit — no further tests today",
              "Confirm the patient understands he is seeing a doctor first",
              "Leave the visit summary and today's ear findings with him",
              "No device conversation, no pricing, no order",
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

        <Card className="mt-4 p-5">
          <b className="text-sm">What you can tell him</b>
          {/* Wording she can safely repeat: it states the referral and the way
              back without interpreting the finding, which is not hers to do. */}
          <p className="mt-2 text-sm leading-6 text-slate-500">
            &ldquo;Dr. Reed wants a doctor to look at your ears before we test your hearing.
            Once they have seen you, we can pick up right where we left off — including
            help with hearing devices if you need them.&rdquo;
          </p>
        </Card>
      </CallSplit>
    </CallShell>
  );
}
