"use client";
import { Lock, PenLine } from "lucide-react";
import { Card, PageHeader, PrimaryButton, StatusPill } from "../../ui";
import { Audiogram } from "../../charts/audiogram";
import { EarImage } from "../../exam/otoscopy-step";
import { createLatch } from "@/lib/latch";
import { clinician, speech, otoscopy, tympanometry, patient } from "@/lib/mock-data";
import { HomeFeed } from "./home-feed";
import { VideoSplit } from "../video-split";
import { ConfirmButton } from "./confirm-button";

/** Signing is irreversible, so the flag outlives the component. See lib/latch. */
const signedLatch = createLatch();

export function AudReview({ next }: { next: () => void }) {
  return (
    <div className="min-h-[100dvh] bg-brand-bg p-6 pb-32 text-brand-navy md:pb-6">
      <div className="mx-auto max-w-5xl">
        <PageHeader eyebrow="Clinical review" title={`${patient.name} — exam complete`} />

        {/* The room stays on screen until the patient is fitted and happy
           (refined 2026-08-31) — she reviews while still on the call, and the
           video sits exactly where it sits on every other screen. */}
        <VideoSplit video={<HomeFeed beat="listening" />}>
          <Card className="p-5">
            <b className="text-sm">Audiogram with bone conduction</b>
            <div className="mt-4"><Audiogram showBone /></div>
          </Card>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Card className="p-4">
              <b className="text-sm">Speech recognition</b>
              <div className="mt-3 flex gap-6">
                <div><span className="text-xs text-slate-400">Left</span><b className="block text-2xl">{speech.left}%</b></div>
                <div><span className="text-xs text-slate-400">Right</span><b className="block text-2xl">{speech.right}%</b></div>
              </div>
            </Card>
            {/* Tympanometry belongs on the screen where candidacy is decided
               (persona spec §2). The stiff left trace is what the left-ear
               air–bone gap looks like from the middle ear — the two findings
               corroborate each other, so reading one without the other is
               reading half the evidence. */}
            <Card className="p-4">
              <b className="text-sm">Tympanometry</b>
              <div className="mt-3 grid gap-2">
                {([["Left", tympanometry.left], ["Right", tympanometry.right]] as const).map(([side, t]) => (
                  <div key={side} className="flex items-baseline justify-between gap-3">
                    <span className="text-xs text-slate-400">{side}</span>
                    <span className="text-right">
                      <b className="text-sm">{t.type}</b>
                      <span className="ml-2 text-xs text-slate-500">{t.pressure} · {t.compliance}</span>
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">L: {tympanometry.left.finding}</p>
            </Card>
          </div>

          {/* The captures themselves, not a description of them — she reads the
             images the CMA took (persona spec §2). Same EarImage the exam step
             renders, so there is one otoscopy view in the product, not two. */}
          <Card className="mt-4 overflow-hidden">
            <div className="p-4 pb-3"><b className="text-sm">Otoscopy captures</b></div>
            <div className="grid grid-cols-2 gap-px bg-[#e4eef0]">
              {([["Left", otoscopy.left, "cool"], ["Right", otoscopy.right, "warm"]] as const).map(
                ([side, ear, hue]) => (
                  <div key={side} className="bg-white">
                    <EarImage hue={hue} />
                    <div className="p-4">
                      <span className="text-xs text-slate-400">{side}</span>
                      <p className="mt-1 text-xs leading-5 text-slate-500">{ear.finding}</p>
                    </div>
                  </div>
                )
              )}
            </div>
          </Card>

          {/* Findings / interpretation / candidacy stay visibly distinct (MRD). */}
          <div className="mt-4 grid gap-3">
            {[
              ["Findings", "Bilateral air thresholds 20–65 dB HL sloping. Bone thresholds 15–35 dB HL. Air–bone gap present."],
              ["Interpretation", "Moderate mixed hearing loss, worse on the left. Speech recognition preserved."],
              ["Candidacy", "Candidate for bilateral amplification. No red flags requiring referral."],
            ].map(([h, body]) => (
              <Card key={h} className="p-4">
                <span className="text-[10px] font-extrabold uppercase tracking-[.18em] text-teal-ink">{h}</span>
                <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
              </Card>
            ))}
          </div>

          <div className="mt-5 max-w-sm"><PrimaryButton onClick={next}>Continue to signature</PrimaryButton></div>
        </VideoSplit>
      </div>
    </div>
  );
}

export function AudSign({ next }: { next: () => void }) {
  const signed = signedLatch.use();
  return (
    <div className="min-h-[100dvh] bg-brand-bg p-6 pb-32 text-brand-navy md:pb-6">
      <div className="mx-auto max-w-5xl">
      {/* Same page header as every other audiologist screen (consistency,
         Achi 2026-08-31) — the card below carries the state, not the title. */}
      <PageHeader eyebrow="Signature" title={`${patient.name} — sign the report`} />
      <VideoSplit video={<HomeFeed beat="listening" />}>
      <Card className="w-full max-w-lg p-7">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#edf8f7] text-teal-ink">
          {signed ? <Lock size={21} aria-hidden /> : <PenLine size={21} aria-hidden />}
        </span>
        <h2 className="mt-4 text-2xl font-extrabold tracking-[-.02em]">
          {signed ? "Report signed and locked" : "Ready for your signature"}
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          {signed
            ? "The report is now immutable and the results have been released to the patient."
            : "Signing releases the results to the patient and makes this report immutable. Both happen at once."}
        </p>

        <div className="mt-5 rounded-2xl bg-[#f6fafa] p-4">
          <b className="text-sm">{clinician.name}, {clinician.credential}</b>
          <p className="mt-1 text-xs text-slate-500">
            Licensed in {clinician.licenseState} · {clinician.licenseNo}
          </p>
        </div>

        {signed && <div className="mt-4"><StatusPill tone="green">Released to patient</StatusPill></div>}

        <div className="mt-6">
          {signed
            ? <PrimaryButton onClick={next}>Start the consult</PrimaryButton>
            : <ConfirmButton
                label="Sign & release results"
                confirmLabel="Confirm — sign and release"
                note="Neither step can be undone once you confirm."
                onConfirm={signedLatch.set}
              />}
        </div>
      </Card>
      </VideoSplit>
      </div>
    </div>
  );
}
