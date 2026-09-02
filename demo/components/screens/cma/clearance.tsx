"use client";
import { AlertTriangle, Hourglass, PhoneCall, ShieldCheck } from "lucide-react";
import { Card, PageHeader, PrimaryButton } from "../../ui";
import { CallShell } from "../video-split";
import { CallSplit } from "./call-tile";
import { ClearanceList } from "../../exam/clearance-list";
import { reviewOutcome, reviewReferralReason, visitClearance, visitGates } from "@/lib/clearance";
import { useReview } from "@/lib/review-store";
import { clinician } from "@/lib/mock-data";

/**
 * The formal pass gate between the ear checks and the hearing test (owner,
 * 2026-09-02: "we need a formal passing screen before hearing test start").
 *
 * Before this screen existed, tympanometry's "Both ears traced" button walked
 * straight into the pure tone sweep. Nothing in the product ever ASKED whether
 * the two safety checks had actually passed — the exam simply carried on, and
 * a failed otoscopy would have ended in a device sale like any other visit.
 * This screen is where the visit either clears or stops.
 *
 * A stopped visit offers no way past it: a gate with a bypass is not a gate,
 * and the CMA is not licensed to make the call that would justify one. The
 * only control on a stopped visit closes it and hands over the referral.
 *
 * (`corrections.test.ts` greps both clearance screens for bypass wording, so
 * this comment deliberately describes the rule without naming the phrases it
 * bans — a comment is what the next person copies into a button label.)
 */
export function CmaClearance({ next }: { next: () => void }) {
  const clearance = visitClearance();
  // Maya's screen follows Dr. Reed's decision, not the raw tones: the clinician
  // rules, the CMA is told the result. Until Dr. Reed has ruled on both checks
  // the visit is PENDING — and pending is not permission to start, so Maya
  // gets no "Start hearing test" button yet.
  const review = useReview();
  const outcome = reviewOutcome(review);
  const stopped = outcome === "stopped";
  const cleared = outcome === "cleared";
  return (
    <CallShell header={
      <PageHeader
        eyebrow="Clearance"
        title={stopped ? "Visit stops here" : cleared ? "Cleared for testing" : "Waiting on Dr. Reed"}
        subtitle={stopped
          ? "Dr. Reed found a critical issue. Do not start the hearing test."
          : cleared
            ? "Dr. Reed has cleared both ear checks. The hearing test can begin."
            : "Both ear checks are in and with Dr. Reed. Wait for her clearance before testing."}
      />
    }>
      <CallSplit note={stopped
        ? "Has seen the findings and is calling the patient now — she makes the referral, not you."
        : cleared
          ? "Has reviewed both ear checks and signed the visit off — you are clear to start the test."
          : "Is reading your captures and traces now — she will tell you when to start."}>

        <ClearanceList clearance={clearance} title="Pre-test safety checks" />

        {stopped ? (
          <>
            {/* The stop is stated in full before anything else is offered, and
                what follows it is a referral, not a next step in the exam. */}
            <Card className="mt-4 border-red-300 p-5">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#fdeaea] text-[#b42318]">
                  <AlertTriangle size={17} aria-hidden />
                </span>
                <div>
                  <b className="text-sm text-[#b42318]">Stop the exam — refer to a doctor</b>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{reviewReferralReason(review, visitGates())}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    No hearing test, no results and no device today. Pack the kit, explain that
                    a physician needs to look first, and {clinician.name} will call the patient
                    to arrange the referral.
                  </p>
                </div>
              </div>
            </Card>
            <div className="mt-6">
              <PrimaryButton onClick={next} className="bg-[#b42318] hover:bg-[#992018]">
                <PhoneCall size={17} aria-hidden />
                Close the visit and hand over the referral
              </PrimaryButton>
            </div>
          </>
        ) : cleared ? (
          <>
            <Card className="mt-4 p-5">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#dcf5ef] text-[#237451]">
                  <ShieldCheck size={17} aria-hidden />
                </span>
                <p className="text-sm leading-6 text-slate-600">
                  {clinician.name} has cleared the otoscopy and the tympanometry. Noted
                  findings travel with the record — she reads them against the thresholds
                  once the test is done.
                </p>
              </div>
            </Card>
            <div className="mt-6">
              <PrimaryButton onClick={next}>Start hearing test</PrimaryButton>
            </div>
          </>
        ) : (
          /* Pending. No button: the test cannot start on a visit the clinician
             has not cleared, and a disabled control would still suggest the
             CMA is the one who decides when to press it. */
          <Card className="mt-4 p-5">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#e8f9f8] text-[#087d7a]">
                <Hourglass size={17} aria-hidden />
              </span>
              <div>
                <b className="text-sm">With {clinician.name} for review</b>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  She is checking both ear findings for anything critical. The hearing test
                  starts only once she has cleared them.
                </p>
              </div>
            </div>
          </Card>
        )}
      </CallSplit>
    </CallShell>
  );
}
