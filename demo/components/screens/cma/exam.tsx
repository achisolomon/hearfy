"use client";
import { PageHeader, PrimaryButton } from "../../ui";
import { CallShell } from "../video-split";
import { CallSplit } from "./call-tile";
import { OtoscopyStep } from "../../exam/otoscopy-step";
import { TympanometryStep } from "../../exam/tympanometry-step";
import { PureToneStep } from "../../exam/puretone-step";
import { CorrectionNotice } from "../../exam/guidance";
import { AssistanceRequest } from "../../exam/assistance";
import { SpeechStep } from "../../exam/speech-step";
import { BoneStep } from "../../exam/bone-step";
import { EXAM_STEPS } from "@/lib/exam";

// Analysis happens in the cloud, so the CMA walks every step but that one.
// The eyebrow counts off this list — adding a step renumbers every screen.
const CMA_STEPS = EXAM_STEPS.filter(s => s.id !== "analysis");

function step(id: string) {
  const i = CMA_STEPS.findIndex(x => x.id === id);
  const s = CMA_STEPS[i];
  return {
    title: s?.title ?? "",
    procedure: s?.procedure ?? "",
    eyebrow: `Step ${i + 1} of ${CMA_STEPS.length}`,
  };
}

/**
 * The CMA runs the exam on a tablet (refined 2026-08-31: only the patient is
 * on a phone), so from `md` up every step is two panes: Dr. Reed's Zoom-like
 * call on the left, the procedure on the right — the patient looks at the
 * screen and sees a clinician in the room. Below `md` the call collapses to
 * the compact strip.
 */
/**
 * `asks` is what the examiner needs Maya to physically do on this step
 * (Exam Engine spec §8.2: "Avatar-requested physical-assistance cards with
 * visual steps and confirmation — not full clinical interpretation").
 *
 * It sits above the step's own content because it is the instruction she
 * acts on; the step below is what she is looking at while she does it.
 */
function ExamStepShell({ id, note, asks, active = false, cta, next, children }: {
  id: string; note: string; asks?: string; active?: boolean; cta: string; next: () => void;
  children: React.ReactNode;
}) {
  const s = step(id);
  return (
    <CallShell header={<PageHeader title={s.title} subtitle={s.procedure} eyebrow={s.eyebrow} />}>
      <CallSplit note={note} active={active}>
        {asks && <AssistanceRequest className="mb-4">{asks}</AssistanceRequest>}
        {children}
        <div className="mt-6"><PrimaryButton onClick={next}>{cta}</PrimaryButton></div>
      </CallSplit>
    </CallShell>
  );
}

export function CmaOtoscopy({ next }: { next: () => void }) {
  return (
    <ExamStepShell id="otoscopy" next={next} cta="Both ears captured"
      note="On call — the examiner flags a retake before you move on."
      asks="Steady the otoscope until the ring turns green on each ear, then hold for two seconds.">
      <OtoscopyStep framing="cma" />
    </ExamStepShell>
  );
}

// Corrections sheet 2026-08-31, item 5: tympanometry runs on every exam,
// between the ear health check and the hearing test.
// The CTA says where it goes (owner, 2026-09-02): the next screen is the
// clearance gate, not the hearing test. "Start hearing test" here would state
// the very thing the gate exists to decide.
export function CmaTympanometry({ next }: { next: () => void }) {
  return (
    <ExamStepShell id="tympanometry" next={next} cta="Both ears traced — review clearance"
      note="On call — a broken seal means a re-run, not a guess."
      asks="Seat the probe until the seal indicator holds. If it breaks mid-trace, re-seat and run that ear again.">
      <TympanometryStep framing="cma" />
    </ExamStepShell>
  );
}

export function CmaPureTone({ next }: { next: () => void }) {
  // Spec AC08/AC09: an objective trigger pauses the test, and the correction
  // is explained, demonstrated and verified before it resumes from the last
  // validated checkpoint. Maya is the one who acts on a room-noise event —
  // she is in the room — so the notice sits on her screen, above the sweep
  // she is running. The patient's own screen is not interrupted mid-tone.
  return (
    <ExamStepShell id="puretone" next={next} cta="Thresholds complete" active
      note="Has joined the test — she is adjusting the left-ear sweep herself."
      asks="Close the hallway door and silence the television, then tell me when the room is quiet.">
      <CorrectionNotice
        framing="cma"
        className="mb-4"
        issue="Room noise rose above the testing limit"
        why="Background sound this loud masks the quietest tones, so a threshold measured now would read worse than Alex's real hearing."
        fix="Close the hallway door and silence the television, then confirm the room is quiet again."
        resumeAt="the last confirmed frequency"
      />
      <PureToneStep framing="cma" noisy />
    </ExamStepShell>
  );
}

export function CmaSpeech({ next }: { next: () => void }) {
  return (
    <ExamStepShell id="speech" next={next} cta="Lists complete"
      note="On call — scoring is automatic, she reviews the list after."
      asks="Keep your face out of Alex's sightline while the words play, so he cannot lip-read the answers.">
      <SpeechStep framing="cma" />
    </ExamStepShell>
  );
}

// A fixed part of every exam since the 2026-08-31 corrections (item 6) —
// no longer added case-by-case after the pure tone result.
export function CmaBone({ next }: { next: () => void }) {
  return (
    <ExamStepShell id="bone" next={next} cta="Submit exam" active
      note="On call — bone thresholds separate conductive from sensorineural loss."
      asks="Place the bone oscillator on the mastoid behind the ear, snug but not tight, and check it is not touching the pinna.">
      <BoneStep framing="cma" />
    </ExamStepShell>
  );
}
