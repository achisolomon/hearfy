"use client";
import { PageHeader, PrimaryButton } from "../../ui";
import { CallShell } from "../video-split";
import { CallSplit } from "./call-tile";
import { OtoscopyStep } from "../../exam/otoscopy-step";
import { TympanometryStep } from "../../exam/tympanometry-step";
import { PureToneStep } from "../../exam/puretone-step";
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
function ExamStepShell({ id, note, active = false, cta, next, children }: {
  id: string; note: string; active?: boolean; cta: string; next: () => void;
  children: React.ReactNode;
}) {
  const s = step(id);
  return (
    <CallShell header={<PageHeader title={s.title} subtitle={s.procedure} eyebrow={s.eyebrow} />}>
      <CallSplit note={note} active={active}>
        {children}
        <div className="mt-6"><PrimaryButton onClick={next}>{cta}</PrimaryButton></div>
      </CallSplit>
    </CallShell>
  );
}

export function CmaOtoscopy({ next }: { next: () => void }) {
  return (
    <ExamStepShell id="otoscopy" next={next} cta="Both ears captured"
      note="Watching both captures live — she flags a retake before you move on.">
      <OtoscopyStep framing="cma" />
    </ExamStepShell>
  );
}

// Corrections sheet 2026-08-31, item 5: tympanometry runs on every exam,
// between the ear health check and the hearing test.
export function CmaTympanometry({ next }: { next: () => void }) {
  return (
    <ExamStepShell id="tympanometry" next={next} cta="Both ears traced"
      note="Reading each trace as it lands — a broken seal means a re-run, not a guess.">
      <TympanometryStep framing="cma" />
    </ExamStepShell>
  );
}

export function CmaPureTone({ next }: { next: () => void }) {
  return (
    <ExamStepShell id="puretone" next={next} cta="Thresholds complete" active
      note="Has joined the test — she is adjusting the left-ear sweep herself.">
      <PureToneStep framing="cma" />
    </ExamStepShell>
  );
}

export function CmaSpeech({ next }: { next: () => void }) {
  return (
    <ExamStepShell id="speech" next={next} cta="Lists complete"
      note="Listening to the word lists live and scoring responses as they come.">
      <SpeechStep framing="cma" />
    </ExamStepShell>
  );
}

// A fixed part of every exam since the 2026-08-31 corrections (item 6) —
// no longer added case-by-case after the pure tone result.
export function CmaBone({ next }: { next: () => void }) {
  return (
    <ExamStepShell id="bone" next={next} cta="Submit exam" active
      note="Watching the bone thresholds — this is what separates conductive from sensorineural loss.">
      <BoneStep framing="cma" />
    </ExamStepShell>
  );
}
