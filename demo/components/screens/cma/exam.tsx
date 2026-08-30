"use client";
import { Radio } from "lucide-react";
import { Card, PageHeader, PrimaryButton } from "../../ui";
import { Shell } from "../shared";
import { OtoscopyStep } from "../../exam/otoscopy-step";
import { PureToneStep } from "../../exam/puretone-step";
import { SpeechStep } from "../../exam/speech-step";
import { BoneStep } from "../../exam/bone-step";
import { EXAM_STEPS } from "@/lib/exam";
import { clinician } from "@/lib/mock-data";

/** Persistent supervision indicator — the audiologist is watching (persona spec §2). */
function SupervisionBar({ intervening = false }: { intervening?: boolean }) {
  return (
    <Card className={`mb-4 flex items-center gap-3 p-3 ${intervening ? "border-brand-teal bg-[#edfbfa]" : ""}`}>
      <span className="relative grid h-9 w-9 place-items-center rounded-full bg-brand-navy text-white">
        <Radio size={16} />
        <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-[#47d0c4]" />
      </span>
      <div className="flex-1">
        <b className="text-xs">{intervening ? "Audiologist has joined" : "Supervised live"}</b>
        <p className="text-[11px] text-slate-500">{clinician.name}, {clinician.credential}</p>
      </div>
    </Card>
  );
}

function step(id: string) {
  const s = EXAM_STEPS.find(x => x.id === id);
  return { title: s?.title ?? "", procedure: s?.procedure ?? "" };
}

export function CmaOtoscopy({ next }: { next: () => void }) {
  const s = step("otoscopy");
  return (
    <Shell>
      <PageHeader title={s.title} subtitle={s.procedure} eyebrow="Step 1 of 4" />
      <SupervisionBar />
      <OtoscopyStep framing="cma" />
      <div className="mt-6"><PrimaryButton onClick={next}>Both ears captured</PrimaryButton></div>
    </Shell>
  );
}

export function CmaPureTone({ next }: { next: () => void }) {
  const s = step("puretone");
  return (
    <Shell>
      <PageHeader title={s.title} subtitle={s.procedure} eyebrow="Step 2 of 4" />
      <SupervisionBar intervening />
      <PureToneStep framing="cma" />
      <div className="mt-6"><PrimaryButton onClick={next}>Thresholds complete</PrimaryButton></div>
    </Shell>
  );
}

export function CmaSpeech({ next }: { next: () => void }) {
  const s = step("speech");
  return (
    <Shell>
      <PageHeader title={s.title} subtitle={s.procedure} eyebrow="Step 3 of 4" />
      <SupervisionBar />
      <SpeechStep framing="cma" />
      <div className="mt-6"><PrimaryButton onClick={next}>Lists complete</PrimaryButton></div>
    </Shell>
  );
}

export function CmaBone({ next }: { next: () => void }) {
  const s = step("bone");
  return (
    <Shell>
      <PageHeader title={s.title} subtitle={s.procedure} eyebrow="Step 4 of 4 · added" />
      <SupervisionBar intervening />
      <Card className="mb-4 p-4">
        <p className="text-sm leading-6 text-slate-500">
          The audiologist added this step after reviewing the pure tone result. Run it as instructed.
        </p>
      </Card>
      <BoneStep framing="cma" />
      <div className="mt-6"><PrimaryButton onClick={next}>Submit exam</PrimaryButton></div>
    </Shell>
  );
}
