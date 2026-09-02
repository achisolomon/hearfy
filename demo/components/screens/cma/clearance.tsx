"use client";
import { AlertTriangle, PhoneCall, ShieldCheck } from "lucide-react";
import { Card, PageHeader, PrimaryButton } from "../../ui";
import { CallShell } from "../video-split";
import { CallSplit } from "./call-tile";
import { ClearanceList } from "../../exam/clearance-list";
import { referralReason, visitClearance } from "@/lib/clearance";
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
  return (
    <CallShell header={
      <PageHeader
        eyebrow="Clearance"
        title={clearance.stopped ? "Visit stops here" : "Cleared for testing"}
        subtitle={clearance.stopped
          ? "The safety checks did not clear. Do not start the hearing test."
          : "Both safety checks are in. The hearing test can begin."}
      />
    }>
      <CallSplit note={clearance.stopped
        ? "Has seen the findings and is calling the patient now — she makes the referral, not you."
        : "Has reviewed all three checks and signed the visit off — you are clear to start the test."}>

        <ClearanceList clearance={clearance} title="Pre-test safety checks" />

        {clearance.stopped ? (
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
                  <p className="mt-2 text-sm leading-6 text-slate-600">{referralReason(clearance)}</p>
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
        ) : (
          <>
            <Card className="mt-4 p-5">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#dcf5ef] text-[#237451]">
                  <ShieldCheck size={17} aria-hidden />
                </span>
                <p className="text-sm leading-6 text-slate-600">
                  {clinician.name} has signed off the questionnaire, the otoscopy and the
                  tympanometry. Noted findings travel with the record — she reads them against
                  the thresholds once the test is done.
                </p>
              </div>
            </Card>
            <div className="mt-6">
              <PrimaryButton onClick={next}>Start hearing test</PrimaryButton>
            </div>
          </>
        )}
      </CallSplit>
    </CallShell>
  );
}
