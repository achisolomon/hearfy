"use client";
import { Clock } from "lucide-react";
import { Card, PageHeader } from "../../ui";
import { Shell } from "../shared";
import { CallSplit } from "./call-tile";
import { CALL_HEADER_MIN } from "../video-split";
import { clinician } from "@/lib/mock-data";

export function CmaHandoff() {
  return (
    <Shell tablet>
      {/* This screen shows the same call panel as the audiologist's beats but
          is a CMA tablet screen, so it uses `Shell`, not `CallShell` — and so
          it was the one call beat that reserved no header height. Its header
          is shorter than the reserved floor, so the panel below sat 37px
          higher here than on the beats either side, and the video jumped up
          and back as the story passed through (found by `stability-sweep`,
          2026-09-02). Reserving the same floor CallShell uses puts it back in
          line without moving this screen onto a shell built for another role.
          `em`, so it scales with the text-size control rather than clipping. */}
      <div style={{ minHeight: `${CALL_HEADER_MIN / 16}em` }}>
        <PageHeader title="With the audiologist" subtitle="Exam submitted. Stay with the patient while it is reviewed." eyebrow="Handoff" />
      </div>
      <CallSplit active note="Reviewing and signing the results on the call — still on screen with you and the patient.">
      <Card className="grid place-items-center p-8 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-[#edf8f7] text-teal-ink">
          <Clock size={26} />
        </span>
        <b className="mt-4 text-[15px]">{clinician.name} is reviewing</b>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Results are released to the patient once signed. You will see the device shortlist
          when that happens.
        </p>
      </Card>
      </CallSplit>
    </Shell>
  );
}
