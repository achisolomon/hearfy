"use client";
import { Lock, PenLine } from "lucide-react";
import { Card, PrimaryButton, StatusPill } from "../../ui";
import { Audiogram } from "../../charts/audiogram";
import { createLatch } from "@/lib/latch";
import { clinician, speech, otoscopy, patient } from "@/lib/mock-data";
import { HomeFeed } from "./home-feed";
import { VideoSplit } from "../video-split";

/** Signing is irreversible, so the flag outlives the component. See lib/latch. */
const signedLatch = createLatch();

export function AudReview({ next }: { next: () => void }) {
  return (
    <div className="min-h-[100dvh] bg-brand-bg p-6 pb-20 text-brand-navy md:pb-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-5">
          <span className="text-[10px] font-extrabold uppercase tracking-[.2em] text-brand-teal">Clinical review</span>
          <h1 className="mt-1 text-[28px] font-extrabold tracking-[-.02em]">{patient.name} — exam complete</h1>
        </header>

        {/* The room stays on screen until the patient is fitted and happy
           (refined 2026-08-31) — she reviews while still on the call, and the
           video sits exactly where it sits on every other screen. */}
        <VideoSplit video={<HomeFeed />}>
          <Card className="p-5">
            <b className="text-sm">Audiogram with bone conduction</b>
            <div className="mt-4"><Audiogram showBone /></div>
          </Card>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Card className="p-4">
              <b className="text-sm">Speech recognition</b>
              <div className="mt-3 flex gap-6">
                <div><span className="text-xs text-slate-400">Right</span><b className="block text-2xl">{speech.right}%</b></div>
                <div><span className="text-xs text-slate-400">Left</span><b className="block text-2xl">{speech.left}%</b></div>
              </div>
            </Card>
            <Card className="p-4">
              <b className="text-sm">Otoscopy</b>
              <p className="mt-2 text-xs leading-5 text-slate-500">R: {otoscopy.right.finding}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">L: {otoscopy.left.finding}</p>
            </Card>
          </div>

          {/* Findings / interpretation / candidacy stay visibly distinct (MRD). */}
          <div className="mt-4 grid gap-3">
            {[
              ["Findings", "Bilateral air thresholds 20–65 dB HL sloping. Bone thresholds 15–35 dB HL. Air–bone gap present."],
              ["Interpretation", "Moderate mixed hearing loss, worse on the left. Speech recognition preserved."],
              ["Candidacy", "Candidate for bilateral amplification. No red flags requiring referral."],
            ].map(([h, body]) => (
              <Card key={h} className="p-4">
                <span className="text-[10px] font-extrabold uppercase tracking-[.18em] text-brand-teal">{h}</span>
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
    <div className="min-h-[100dvh] bg-brand-bg p-6 pb-20 text-brand-navy md:pb-6">
      <div className="mx-auto max-w-5xl">
      {/* Same page header as every other audiologist screen (consistency,
         Achi 2026-08-31) — the card below carries the state, not the title. */}
      <header className="mb-5">
        <span className="text-[10px] font-extrabold uppercase tracking-[.2em] text-brand-teal">Signature</span>
        <h1 className="mt-1 text-[26px] font-extrabold tracking-[-.02em]">{patient.name} — sign the report</h1>
      </header>
      <VideoSplit video={<HomeFeed />}>
      <Card className="w-full max-w-lg p-7">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#edf8f7] text-brand-teal">
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
            : <PrimaryButton onClick={signedLatch.set}>Sign &amp; release results</PrimaryButton>}
        </div>
      </Card>
      </VideoSplit>
      </div>
    </div>
  );
}
