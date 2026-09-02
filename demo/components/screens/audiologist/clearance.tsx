"use client";
import { useState } from "react";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { Card, PageHeader, PrimaryButton, StatusPill } from "../../ui";
import { CallShell, VideoSplit } from "../video-split";
import { HomeFeed } from "./home-feed";
import { ConfirmButton } from "./confirm-button";
import { ClearanceList } from "../../exam/clearance-list";
import { referralReason, visitClearance } from "@/lib/clearance";
import { supervisionQueue } from "@/lib/mock-data";

/**
 * The audiologist's own sign-off on the three pre-test checks (owner,
 * 2026-09-02: "the audiologist screen should show a checklist for 3 items —
 * pre-test questionnaire, otoscopy and tympanometry").
 *
 * The CMA's clearance screen shows the same three rows from the same
 * `visitClearance()`, and that is the point: she reports the findings, the
 * licensed clinician decides what they mean. This screen is where the decision
 * is actually recorded — the CMA's screen reflects it.
 *
 * When a check fails, this screen offers NO sign-off control at all. The only
 * thing an audiologist can do with a failed safety check is refer the patient,
 * so that is the only thing the screen lets her do. A disabled "sign anyway"
 * button would still be a button.
 */
export function AudClearance({ next }: { next: () => void }) {
  const clearance = visitClearance();
  const hero = supervisionQueue.find(e => e.hero)!;
  const [signed, setSigned] = useState(false);

  return (
    <CallShell header={
      /* The status pill sits BELOW the header, not beside it.
         `AudMonitor` puts its pill in a flex row next to PageHeader, which
         works there because its eyebrow is one short word. Copying that shape
         with a longer eyebrow starved the eyebrow of width at 390px: it wrapped
         to three lines and crowded the mark PageHeader draws on mobile. The
         pill is status, not a title, so it reads perfectly well on its own
         line — and this way the eyebrow's length stops being load-bearing. */
      <div>
        <PageHeader
          eyebrow="Pre-test review"
          title={clearance.stopped ? `${hero.name} · refer to a physician` : `${hero.name} · clear to test`}
          subtitle="Questionnaire, otoscopy and tympanometry — reviewed before any test begins."
        />
        <div className="-mt-2 mb-1">
          <StatusPill tone={clearance.stopped ? "amber" : signed ? "green" : "teal"}>
            {clearance.stopped ? "Stopped" : signed ? "Signed off" : "Awaiting sign-off"}
          </StatusPill>
        </div>
      </div>
    }>
      <VideoSplit video={<HomeFeed cmaName={hero.cma} beat="tympanometry" />}>
        <div className="space-y-3">
          <ClearanceList clearance={clearance} title="Pre-test safety checklist" />

          {clearance.stopped ? (
            <Card className="border-red-300 p-5">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#fdeaea] text-[#b42318]">
                  <AlertTriangle size={17} aria-hidden />
                </span>
                <div>
                  <b className="text-sm text-[#b42318]">Do not proceed to testing</b>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{referralReason(clearance)}</p>
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
          ) : (
            <Card className="p-5">
              <b className="text-sm">Your call</b>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Noted findings are yours to interpret. Signing releases the hearing test to
                begin and travels with the clinical record.
              </p>
              {/* The same two-stage gate the report signature and the
                  prescription lock use: this decides whether a hearing test
                  runs at all, so it carries their weight, not "Continue"'s. */}
              <div className="mt-4">
                <ConfirmButton
                  label="Sign off all three checks"
                  confirmLabel="Confirm — clear for testing"
                  note="This clears the visit to proceed to the hearing test, on your license."
                  onConfirm={() => setSigned(true)}
                />
              </div>
            </Card>
          )}
        </div>
      </VideoSplit>
    </CallShell>
  );
}
