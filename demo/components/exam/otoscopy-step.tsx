"use client";
import { Card, StatusPill } from "../ui";

export type Framing = "patient" | "cma";

export function OtoscopyStep({ framing }: { framing: Framing }) {
  return (
    <>
      <Card className="overflow-hidden">
        <div className="grid h-56 place-items-center bg-[#0c2340]">
          <div className="relative h-40 w-40 rounded-full border-[12px] border-[#173a5b] bg-[radial-gradient(circle_at_50%_50%,#c97b53_0,#8e4a35_32%,#3c1e21_58%,#111827_72%)]">
            <div className="absolute inset-5 rounded-full border border-white/20" />
          </div>
        </div>
        <div className="flex items-center justify-between p-5">
          <div>
            <span className="text-xs text-slate-500">Both ears</span>
            <h3 className="font-extrabold">Image captured</h3>
          </div>
          {/* Procedural quality, not a clinical finding — safe for both roles. */}
          <StatusPill tone="green">Good view</StatusPill>
        </div>
      </Card>
      <Card className="mt-4 p-4">
        <p className="text-sm leading-6 text-slate-500">
          {framing === "cma"
            ? "Angle the scope slightly up and back. Capture both ears; retake if the view is obscured."
            : "Both ears captured clearly. Your audiologist reviews the images and explains what they show."}
        </p>
      </Card>
    </>
  );
}
