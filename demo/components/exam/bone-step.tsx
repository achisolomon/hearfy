"use client";
import { Card, StatusPill } from "../ui";
import { Audiogram } from "../charts/audiogram";
import type { Framing } from "./otoscopy-step";

/**
 * The transducer illustration: where the bone oscillator sits, for the
 * patient's copy of this step. The patient is being told what is about to
 * touch them, so a picture of the device is the right answer.
 */
function TransducerDiagram() {
  return (
    <div className="mt-5 grid h-40 place-items-center rounded-2xl bg-gradient-to-br from-[#e7f8f7] to-white">
      <div className="relative h-24 w-40">
        <div className="absolute inset-x-0 top-3 h-2 rounded-full bg-brand-navy" />
        <div className="absolute left-3 top-3 h-14 w-6 rounded-b-xl bg-[#173a5b]" />
        <div className="absolute right-3 top-3 h-14 w-6 rounded-b-xl bg-brand-teal" />
      </div>
    </div>
  );
}

export function BoneStep({ framing }: { framing: Framing }) {
  // The CMA is running the thresholds, not being shown the hardware: she needs
  // the plot the bone marks are landing on, because the air–bone gap is the
  // whole point of the step. The patient still gets the device picture — she is
  // being told what is about to touch her.
  const cma = framing === "cma";

  return (
    <>
      <Card className="p-5">
        <div className="flex items-center justify-between">
          {/* Mandatory on every exam since the 2026-08-31 corrections (item 6). */}
          <b className="text-sm">Bone conduction</b>
          <StatusPill tone="teal">Standard step</StatusPill>
        </div>
        {cma
          // Same chart, same scale as the audiologist's "exam complete" review
          // (asked 2026-09-02): one audiogram shape across the demo, so the two
          // screens that show bone thresholds read as the same instrument.
          ? <div className="mt-4"><Audiogram animate showBone /></div>
          : <TransducerDiagram />}
      </Card>

      <Card className="mt-4 p-4">
        <p className="text-sm leading-6 text-slate-500">
          {cma
            ? "Seat the transducer on the mastoid, behind the ear, firm but comfortable. The headphone stays off on that side."
            : "This uses gentle vibration behind your ear instead of sound through the ear canal. You may feel a slight buzz."}
        </p>
      </Card>
    </>
  );
}
