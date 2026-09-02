"use client";
import { useState } from "react";
import { Card, PageHeader, PrimaryButton, SecondaryButton } from "../../ui";
import { CallShell, VideoSplit } from "../video-split";
import { HomeFeed } from "./home-feed";
import { OtoscopyStep, type EarStatus } from "../../exam/otoscopy-step";
import { TympanometryStep } from "../../exam/tympanometry-step";
import { EXAM_STEPS } from "@/lib/exam";

/**
 * The audiologist's own view of the two clinical-judgment steps (owner,
 * 2026-09-02: "these pages are not CMA, it is the audiologist").
 *
 * What is hers here is the JUDGMENT, not the scope. Maya is still the hands in
 * the room — she holds the otoscope and seals the probe — so this screen has
 * no procedure copy and no capture controls. It has the one thing the CMA's
 * screen cannot have: the decision about whether what came back is good
 * enough, or whether the ear gets shot again.
 *
 * That is also why the video here is the PATIENT and not Dr. Reed. On the
 * CMA's tablet the tile shows the audiologist, because that is who the CMA is
 * on a call with. On the audiologist's screen the same tile pointed at herself
 * would be the mirror facing the wrong way: what she watches is the person
 * being examined. `HomeFeed` already resolves both these beats to the
 * headphones-on `room-patient.mp4` clip and carries his lines for each, so
 * nothing new had to be shot.
 */

/** The step number in the eyebrow counts the same list the CMA's screens do. */
const CMA_STEPS = EXAM_STEPS.filter(s => s.id !== "analysis");

function step(id: string) {
  const i = CMA_STEPS.findIndex(x => x.id === id);
  const s = CMA_STEPS[i];
  return {
    title: s?.title ?? "",
    eyebrow: `Step ${i + 1} of ${CMA_STEPS.length}`,
  };
}

/**
 * Which ear, if any, she has sent back. `null` is the untouched state — both
 * captures standing as the mock reported them.
 *
 * Local state on purpose: this is a demo affordance, not story state. The beat
 * advances on the primary button either way, and nothing outside this screen
 * needs to know. Crucially it is NOT a write into `lib/mock-data`, which the
 * CMA's and the patient's screens read from the same import.
 */
type Retake = "left" | "right" | null;

function statusFor(retake: Retake, ordered: string): { left?: EarStatus; right?: EarStatus } {
  if (retake === "left") return { left: { tone: "amber", label: ordered } };
  if (retake === "right") return { right: { tone: "amber", label: ordered } };
  return {};
}

function ExamJudgment({ id, beat, accepted, onAccept, retake, onRetake, ordered, instruction, cta, next, children }: {
  id: string; beat: string; accepted: boolean; onAccept: () => void;
  retake: Retake; onRetake: (e: Retake) => void; ordered: string;
  instruction: string; cta: string; next: () => void; children: React.ReactNode;
}) {
  const s = step(id);
  return (
    <CallShell header={
      <PageHeader
        eyebrow={s.eyebrow}
        title={s.title}
        subtitle={retake ? instruction : "Both ears are in — accept them or send one back."}
      />
    }>
      {/* The one shared video geometry: her tile sits in the same 380px column
         at the same size as the call on every other screen of every role. */}
      <VideoSplit video={<HomeFeed beat={beat} active={!retake} />}>
        {children}
        <Card className="mt-4 p-4">
          <b className="text-sm">Your call</b>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            {retake
              ? instruction
              : accepted
              ? "Accepted. Maya can move the exam on."
              : "Accept both captures, or send one ear back before the exam moves on."}
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <SecondaryButton onClick={() => onRetake(retake === "right" ? null : "right")}>
              {retake === "right" ? "Cancel retake" : "Send right ear back"}
            </SecondaryButton>
            <PrimaryButton onClick={() => { onAccept(); next(); }}>{cta}</PrimaryButton>
          </div>
        </Card>
      </VideoSplit>
    </CallShell>
  );
}

export function AudOtoscopy({ next }: { next: () => void }) {
  const [retake, setRetake] = useState<Retake>(null);
  const [accepted, setAccepted] = useState(false);
  return (
    <ExamJudgment
      id="otoscopy" beat="otoscopy" cta="Accept both captures" next={next}
      accepted={accepted} onAccept={() => setAccepted(true)}
      retake={retake} onRetake={setRetake} ordered="Retake ordered"
      instruction="Retake ordered — asking Maya to re-angle the scope up and back."
    >
      <OtoscopyStep framing="audiologist" status={statusFor(retake, "Retake ordered")} />
    </ExamJudgment>
  );
}

export function AudTympanometry({ next }: { next: () => void }) {
  const [retake, setRetake] = useState<Retake>(null);
  const [accepted, setAccepted] = useState(false);
  return (
    <ExamJudgment
      id="tympanometry" beat="tympanometry" cta="Accept both traces" next={next}
      accepted={accepted} onAccept={() => setAccepted(true)}
      retake={retake} onRetake={setRetake} ordered="Re-run ordered"
      instruction="Re-run ordered — the seal broke, so the trace is not readable."
    >
      <TympanometryStep framing="audiologist" status={statusFor(retake, "Re-run ordered")} />
    </ExamJudgment>
  );
}
