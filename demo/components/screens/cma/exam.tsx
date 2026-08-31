"use client";
import { PageHeader, PrimaryButton } from "../../ui";
import { Shell } from "../shared";
import { AudiologistCallTile } from "./call-tile";
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

export function CmaOtoscopy({ next }: { next: () => void }) {
  const s = step("otoscopy");
  return (
    <Shell>
      <PageHeader title={s.title} subtitle={s.procedure} eyebrow={s.eyebrow} />
      <AudiologistCallTile note="Watching both captures live — she flags a retake before you move on." />
      <OtoscopyStep framing="cma" />
      <div className="mt-6"><PrimaryButton onClick={next}>Both ears captured</PrimaryButton></div>
    </Shell>
  );
}

// Corrections sheet 2026-08-31, item 5: tympanometry runs on every exam,
// between the ear health check and the hearing test.
export function CmaTympanometry({ next }: { next: () => void }) {
  const s = step("tympanometry");
  return (
    <Shell>
      <PageHeader title={s.title} subtitle={s.procedure} eyebrow={s.eyebrow} />
      <AudiologistCallTile note="Reading each trace as it lands — a broken seal means a re-run, not a guess." />
      <TympanometryStep framing="cma" />
      <div className="mt-6"><PrimaryButton onClick={next}>Both ears traced</PrimaryButton></div>
    </Shell>
  );
}

export function CmaPureTone({ next }: { next: () => void }) {
  const s = step("puretone");
  return (
    <Shell>
      <PageHeader title={s.title} subtitle={s.procedure} eyebrow={s.eyebrow} />
      <AudiologistCallTile active note="Has joined the test — she is adjusting the left-ear sweep herself." />
      <PureToneStep framing="cma" />
      <div className="mt-6"><PrimaryButton onClick={next}>Thresholds complete</PrimaryButton></div>
    </Shell>
  );
}

export function CmaSpeech({ next }: { next: () => void }) {
  const s = step("speech");
  return (
    <Shell>
      <PageHeader title={s.title} subtitle={s.procedure} eyebrow={s.eyebrow} />
      <AudiologistCallTile note="Listening to the word lists live and scoring responses as they come." />
      <SpeechStep framing="cma" />
      <div className="mt-6"><PrimaryButton onClick={next}>Lists complete</PrimaryButton></div>
    </Shell>
  );
}

// A fixed part of every exam since the 2026-08-31 corrections (item 6) —
// no longer added case-by-case after the pure tone result.
export function CmaBone({ next }: { next: () => void }) {
  const s = step("bone");
  return (
    <Shell>
      <PageHeader title={s.title} subtitle={s.procedure} eyebrow={s.eyebrow} />
      <AudiologistCallTile active note="Watching the bone thresholds — this is what separates conductive from sensorineural loss." />
      <BoneStep framing="cma" />
      <div className="mt-6"><PrimaryButton onClick={next}>Submit exam</PrimaryButton></div>
    </Shell>
  );
}
