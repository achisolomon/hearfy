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

type Side = "left" | "right";

/**
 * Which ears she has sent back — a SET, not a single choice (owner,
 * 2026-09-02: "she also needs to be able to send the left ear").
 *
 * It was one `"left" | "right" | null` driven by one shared button, which
 * could only ever name one ear and left the other un-rejectable. Either ear
 * can come back badly, or both — and in this data the LEFT canal is the one
 * with cerumen, so the un-returnable ear was precisely the one most likely to
 * need returning.
 *
 * Local state on purpose: this is a demo affordance, not story state. The beat
 * advances either way, and nothing outside this screen needs to know. Crucially
 * it is NOT a write into `lib/mock-data`, which the CMA's and the patient's
 * screens read from the same import — her sending an ear back must not change
 * their screens.
 */
type SentBack = ReadonlySet<Side>;

function statusFor(sent: SentBack, ordered: string): { left?: EarStatus; right?: EarStatus } {
  const out: { left?: EarStatus; right?: EarStatus } = {};
  if (sent.has("left")) out.left = { tone: "amber", label: ordered };
  if (sent.has("right")) out.right = { tone: "amber", label: ordered };
  return out;
}

function toggle(sent: SentBack, side: Side): Set<Side> {
  const next = new Set(sent);
  if (next.has(side)) next.delete(side);
  else next.add(side);
  return next;
}

/** Names the ears she has returned, so the summary says which, not how many. */
function named(sent: SentBack): string {
  if (sent.size === 2) return "Both ears";
  const [only] = [...sent];
  return `The ${only} ear`;
}

/** One ear's send-back control, rendered inside that ear's own card. */
function EarButton({ side, sent, onToggle, sendLabel }: {
  side: Side; sent: SentBack; onToggle: (s: Side) => void; sendLabel: string;
}) {
  const on = sent.has(side);
  return (
    <SecondaryButton
      onClick={() => onToggle(side)}
      className={on ? "border-brand-teal text-teal-ink" : ""}
    >
      {on ? "Cancel" : sendLabel}
    </SecondaryButton>
  );
}

function ExamJudgment({
  id, beat, accepted, onAccept, sent, ordered, instruction, prompt, cta, next, children,
}: {
  id: string; beat: string; accepted: boolean; onAccept: () => void;
  sent: SentBack;
  /** The pill wording on a returned ear — "Retake ordered" / "Re-run ordered". */
  ordered: string;
  /** What she is telling Maya to do, shown once an ear is returned. */
  instruction: string;
  /** What she is being asked to decide, in this step's own noun — captures
      for the ear check, traces for tympanometry. Shared wording sent an
      audiologist looking at two tympanograms a card about "captures". */
  prompt: string;
  cta: string; next: () => void; children: React.ReactNode;
}) {
  const s = step(id);
  const any = sent.size > 0;
  // "The left ear — retake ordered. Asking Maya to re-angle the scope."
  const verdict = any ? `${named(sent)} — ${ordered.toLowerCase()}. ${instruction}` : "";
  return (
    <CallShell header={
      <PageHeader
        eyebrow={s.eyebrow}
        title={s.title}
        subtitle={any ? verdict : "Both ears are in — accept them, or send either one back."}
      />
    }>
      {/* The one shared video geometry: her tile sits in the same 380px column
         at the same size as the call on every other screen of every role. */}
      <VideoSplit video={<HomeFeed beat={beat} active={!any} />}>
        {/* Each ear carries its OWN send-back control, inside its own card
           (owner, 2026-09-02), so the button sits under the ear it judges and
           names no ear at all — which ear it acts on is its position. */}
        {children}
        <Card className="mt-4 p-4">
          <b className="text-sm">Your call</b>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            {any
              ? verdict
              : accepted
              ? "Accepted. Maya can move the exam on."
              : prompt}
          </p>
          <div className="mt-3">
            {/* Sending an ear back does not block the walkthrough: the demo
                still has to move. It changes what the button SAYS, so nobody
                reads "accept both" over an ear she just rejected. */}
            <PrimaryButton onClick={() => { onAccept(); next(); }}>
              {any ? "Continue with the exam" : cta}
            </PrimaryButton>
          </div>
        </Card>
      </VideoSplit>
    </CallShell>
  );
}

export function AudOtoscopy({ next }: { next: () => void }) {
  const [sent, setSent] = useState<SentBack>(new Set<Side>());
  const [accepted, setAccepted] = useState(false);
  const onToggle = (side: Side) => setSent(s => toggle(s, side));
  return (
    <ExamJudgment
      id="otoscopy" beat="otoscopy" cta="Accept both captures" next={next}
      accepted={accepted} onAccept={() => setAccepted(true)}
      sent={sent} ordered="Retake ordered"
      instruction="Asking Maya to re-angle the scope up and back."
      prompt="Accept both captures, or send either ear back before the exam moves on."
    >
      <OtoscopyStep
        framing="audiologist"
        status={statusFor(sent, "Retake ordered")}
        earAction={side => (
          <EarButton side={side} sent={sent} onToggle={onToggle}
            sendLabel="Send back for a retake" />
        )}
      />
    </ExamJudgment>
  );
}

export function AudTympanometry({ next }: { next: () => void }) {
  const [sent, setSent] = useState<SentBack>(new Set<Side>());
  const [accepted, setAccepted] = useState(false);
  const onToggle = (side: Side) => setSent(s => toggle(s, side));
  return (
    <ExamJudgment
      id="tympanometry" beat="tympanometry" cta="Accept both traces" next={next}
      accepted={accepted} onAccept={() => setAccepted(true)}
      sent={sent} ordered="Re-run ordered"
      instruction="The seal broke, so the trace is not readable."
      prompt="Accept both traces, or send either ear back before the exam moves on."
    >
      <TympanometryStep
        framing="audiologist"
        status={statusFor(sent, "Re-run ordered")}
        earAction={side => (
          <EarButton side={side} sent={sent} onToggle={onToggle}
            sendLabel="Send back for a re-run" />
        )}
      />
    </ExamJudgment>
  );
}
