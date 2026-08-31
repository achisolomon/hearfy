"use client";
import { Clock } from "lucide-react";
import { Card, PageHeader } from "../../ui";
import { Shell } from "../shared";
import { AudiologistCallTile } from "./call-tile";
import { clinician } from "@/lib/mock-data";

export function CmaHandoff() {
  return (
    <Shell>
      <PageHeader title="With the audiologist" subtitle="Exam submitted. Stay with the patient while it is reviewed." eyebrow="Handoff" />
      <AudiologistCallTile active note="Reviewing and signing the results on the call — still on screen with you and the patient." />
      <Card className="grid place-items-center p-8 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-[#edf8f7] text-brand-teal">
          <Clock size={26} />
        </span>
        <b className="mt-4 text-[15px]">{clinician.name} is reviewing</b>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Results are released to the patient once signed. You will see the device shortlist
          when that happens.
        </p>
      </Card>
    </Shell>
  );
}
