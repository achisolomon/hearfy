"use client";
import { useState } from "react";
import { AlertCircle, Check, CircleHelp, Sparkles } from "lucide-react";
import { Card } from "../ui";
import { cn } from "@/lib/cn";
import { BRAND_NAME } from "@/lib/mock-data";
import type { Framing } from "./otoscopy-step";

/**
 * The three pieces of the AI Avatar Exam Engine spec that the v1 demo can
 * carry without overturning the 2026-09-02 rulings (no video on the
 * patient's pages; Dr. Reed present on every exam step).
 *
 * The spec's avatar REPLACES the audiologist in the patient interaction.
 * That is not what this demo shows and deliberately so — here the automated
 * guidance runs the instructions while Dr. Reed stays the clinician on the
 * visit. What is implemented is the part that survives that difference:
 * disclosure before consent (AC02), comprehension checked before the first
 * measured stimulus (AC07), and a correction loop the patient can see
 * (AC09) — explain, demonstrate, verify, resume from the same point.
 */

/**
 * AC02: the patient is told, before consenting, that automated guidance is
 * running the instructions and that a licensed clinician stays responsible.
 *
 * The spec's wording requirement is that disclosure states what the system
 * does AND when a human is involved, so both halves are here; a banner that
 * only said "AI is used" would satisfy the letter and miss the point.
 */
export function AiDisclosure({className=""}:{className?:string}){
  return <Card className={cn("p-5",className)}>
    <div className="flex items-start gap-3">
      <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#edf4fb] text-[#235f98]"><Sparkles size={18}/></span>
      <div>
        <b className="text-sm">Guided by {BRAND_NAME}&rsquo;s automated examiner</b>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          The step-by-step instructions in this visit are delivered automatically, not spoken by a person.
          It explains each step, checks you have understood, and corrects the setup when something is off.
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          It does not decide anything about your hearing. Your licensed audiologist supervises the visit,
          reviews every result, and signs your report.
        </p>
      </div>
    </div>
  </Card>;
}

/**
 * AC07: comprehension verified before the first measured stimulus.
 *
 * The check is a real question with a wrong answer available, because
 * teach-back that cannot fail is not teach-back. Choosing wrongly does not
 * scold or block — it re-explains and lets the patient answer again, which
 * is the spec's "respectful correction" principle applied to the tutorial.
 *
 * `answered` is the reserved-height trick from the Held Frame Rule: the
 * feedback row keeps its box whether or not it holds text, so the card does
 * not grow when an answer appears.
 */
const TEACH_BACK_MIN = "4.5em";
export function TeachBack({onConfirm}:{onConfirm:()=>void}){
  const [answered,setAnswered]=useState<null|"right"|"wrong">(null);
  return <Card className="p-5">
    <div className="flex items-start gap-3">
      <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#e8f9f8] text-teal-ink"><CircleHelp size={18}/></span>
      <div className="min-w-0">
        <b className="text-sm">A tone is playing now — this one does not count</b>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          During the test, tones get quieter and quieter. Some will be so soft you are not sure you heard them.
        </p>
        <p className="mt-3 text-sm font-semibold leading-6 text-brand-navy">
          What should you do when a tone is almost too soft to hear?
        </p>
      </div>
    </div>
    <div className="mt-4 grid gap-3">
      <button
        onClick={()=>{setAnswered("right");onConfirm();}}
        className="rounded-2xl border border-[#d8e5e8] bg-white p-4 text-left text-sm font-semibold leading-6 text-brand-navy hover:border-teal-ink">
        Tap anyway — even if I am not certain
      </button>
      <button
        onClick={()=>setAnswered("wrong")}
        className="rounded-2xl border border-[#d8e5e8] bg-white p-4 text-left text-sm font-semibold leading-6 text-brand-navy hover:border-teal-ink">
        Wait until I am sure before tapping
      </button>
    </div>
    {/* Reserved, not conditional: the row holds its height empty so the
        card cannot resize when the answer arrives (Held Frame Rule). */}
    <div className="mt-4 text-sm leading-6" style={{minHeight:TEACH_BACK_MIN}}>
      {answered==="wrong" && <p className="text-slate-600">
        <b className="text-brand-navy">Not quite — and this is the part people find surprising.</b>{" "}
        Tap even when you are unsure. A guess you get wrong tells us as much as one you get right,
        and waiting for certainty hides the softest sounds you can still hear.
        Have another go at the question.
      </p>}
      {answered==="right" && <p className="flex items-start gap-2 text-teal-ink">
        <Check size={17} className="mt-0.5 shrink-0"/>
        <span><b>That is it.</b> Tap whenever you think you hear a tone. The real test starts now.</span>
      </p>}
    </div>
  </Card>;
}

/**
 * AC09: the correction loop, made visible.
 *
 * The spec's required order is explain → demonstrate → verify → resume from
 * the validated checkpoint, and never blame the patient. The component takes
 * the issue and the fix as data so the same loop shape serves any trigger
 * (room noise here; placement or a device fault read identically).
 *
 * `resumeAt` is the spec's checkpoint: correction resumes from the last
 * validated point, not from the beginning, and the patient is told so —
 * being sent back to the start is what makes people abandon a home exam.
 */
export function CorrectionNotice({
  framing, issue, why, fix, resumeAt, className=""
}:{
  framing:Framing; issue:string; why:string; fix:string; resumeAt:string; className?:string;
}){
  const forPatient = framing === "patient";
  return <Card className={cn("border-[#f0d9a8] p-5",className)}>
    <div className="flex items-start gap-3">
      <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#fff6e8] text-[#9d6514]"><AlertCircle size={18}/></span>
      <div className="min-w-0">
        <b className="text-sm text-[#9d6514]">{issue}</b>
        <p className="mt-2 text-sm leading-6 text-slate-600">{why}</p>
        <p className="mt-2 text-sm leading-6 text-slate-600"><b className="text-brand-navy">What to do:</b> {fix}</p>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          {forPatient
            ? `Nothing you did caused this, and nothing is lost — we pick up again at ${resumeAt}.`
            : `Testing is paused. On correction it resumes at ${resumeAt}, not from the start.`}
        </p>
      </div>
    </div>
  </Card>;
}
