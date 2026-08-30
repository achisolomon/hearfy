"use client";
import { Card } from "../ui";
import { speech } from "@/lib/mock-data";
import type { Framing } from "./otoscopy-step";

const WORDS = ["baseball", "sidewalk", "hotdog", "cowboy", "airplane"];

export function SpeechStep({ framing }: { framing: Framing }) {
  return (
    <>
      <Card className="p-5">
        <b className="text-sm">Word list — left ear</b>
        <div className="mt-4 flex flex-wrap gap-2">
          {WORDS.map((w, i) => (
            <span key={w}
              className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                i < 3 ? "bg-[#e8f9f8] text-[#087d7a]" : "bg-[#f1f5f6] text-slate-400"
              }`}>
              {w}
            </span>
          ))}
        </div>
      </Card>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {([["Right", speech.right], ["Left", speech.left]] as const).map(([ear, score]) => (
          <Card key={ear} className="p-4 text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{ear}</span>
            <b className="mt-1 block text-3xl text-brand-navy">{score}%</b>
            <span className="text-[11px] text-slate-400">words correct</span>
          </Card>
        ))}
      </div>

      <Card className="mt-4 p-4">
        <p className="text-sm leading-6 text-slate-500">
          {framing === "cma"
            ? "Play each list at the set level. Record the patient's repetition exactly — do not prompt or repeat a word."
            : "Repeat each word you hear. It is normal to miss some — that is what the test measures."}
        </p>
      </Card>
    </>
  );
}
