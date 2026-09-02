"use client";
import { MapPin, Navigation } from "lucide-react";
import { Card, PageHeader, PrimaryButton, StatusPill } from "../../ui";
import { Shell, RouteMap } from "../shared";
import { cmaDay, kit, visit } from "@/lib/mock-data";

export function CmaDay({ next }: { next: () => void }) {
  return (
    <Shell tablet>
      <PageHeader title="Today's visits" subtitle="Three appointments. Kit checked out and calibrated." eyebrow="Maya L. · CMA" />
      <div className="space-y-3">
        {cmaDay.map(v => (
          <Card key={v.time} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <b className="text-[15px]">{v.time}</b>
                <p className="mt-1 text-sm text-slate-500">{v.name} · {v.area}</p>
                <p className="mt-0.5 text-xs text-slate-400">{v.type}</p>
              </div>
              {v.status === "next" && <StatusPill tone="teal">Next</StatusPill>}
            </div>
          </Card>
        ))}
      </div>
      <Card className="mt-4 flex items-center gap-3 p-4">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#edf8f7] text-teal-ink">
          <MapPin size={18} />
        </span>
        <div className="flex-1">
          <b className="text-sm">Kit {kit.id}</b>
          <p className="text-xs text-slate-500">Calibration current · due {kit.calibrationDue}</p>
        </div>
      </Card>
      {/* Maya's day list is beat 0; her next screen is the drive, after the
          patient's whole booking stretch. A button that crosses dead time
          says so — the same contract as the patient's "Simulate visit day".
          The time comes from `cmaDay` rather than a literal, so it cannot
          drift from the row shown directly above it. */}
      <div className="mt-6">
        <PrimaryButton onClick={next}>
          Start the {cmaDay.find(v => v.status === "next")?.time ?? "next"} visit
        </PrimaryButton>
      </div>
    </Shell>
  );
}

export function CmaEnroute({ next }: { next: () => void }) {
  return (
    <Shell tablet>
      <PageHeader title="En route" subtitle={visit.address} eyebrow="Visit" />
      <RouteMap moving />
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Card className="p-4">
          <span className="text-xs text-slate-400">Visit ID</span>
          <b className="mt-1 block text-sm">{visit.id}</b>
        </Card>
        <Card className="p-4">
          <span className="text-xs text-slate-400">Kit ID</span>
          <b className="mt-1 block text-sm">{kit.id}</b>
        </Card>
      </div>
      <Card className="mt-3 flex items-center gap-3 p-4">
        <Navigation className="text-teal-ink" size={18} />
        <p className="text-sm text-slate-500">Arriving in about 6 minutes</p>
      </Card>
      <div className="mt-6"><PrimaryButton onClick={next}>I have arrived</PrimaryButton></div>
    </Shell>
  );
}
