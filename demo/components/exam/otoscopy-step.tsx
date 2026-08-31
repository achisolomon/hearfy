"use client";
import { Card, StatusPill } from "../ui";
import { otoscopy } from "@/lib/mock-data";

export type Framing = "patient" | "cma";

/** The scope view, tinted slightly differently per ear so the two captures read as two. */
function EarImage({ hue }: { hue: "warm" | "cool" }) {
  const canal = hue === "warm"
    ? "bg-[radial-gradient(circle_at_50%_50%,#c97b53_0,#8e4a35_32%,#3c1e21_58%,#111827_72%)]"
    : "bg-[radial-gradient(circle_at_46%_54%,#c9825d_0,#95503a_34%,#42221f_60%,#111827_74%)]";
  return (
    <div className="grid h-36 place-items-center bg-[#0c2340]">
      <div className={`relative h-28 w-28 rounded-full border-[9px] border-[#173a5b] ${canal}`}>
        <div className="absolute inset-3.5 rounded-full border border-white/20" />
      </div>
    </div>
  );
}

/**
 * One capture per ear (corrections sheet 2026-08-31, item 3) — never a single
 * image standing in for both.
 */
export function OtoscopyStep({ framing }: { framing: Framing }) {
  const ears = [
    { label: "Right ear", hue: "warm" as const, ...otoscopy.right },
    { label: "Left ear", hue: "cool" as const, ...otoscopy.left },
  ];
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        {ears.map(ear => (
          <Card key={ear.label} className="overflow-hidden">
            <EarImage hue={ear.hue} />
            <div className="p-4">
              <span className="text-xs text-slate-500">{ear.label}</span>
              <h3 className="text-sm font-extrabold">Image captured</h3>
              {/* Procedural quality, not a clinical finding — safe for both roles. */}
              <div className="mt-2">
                <StatusPill tone={ear.tone}>{ear.tone === "green" ? "Good view" : "View adequate"}</StatusPill>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <Card className="mt-4 p-4">
        <p className="text-sm leading-6 text-slate-500">
          {framing === "cma"
            ? "Angle the scope slightly up and back. One clear capture per ear; retake if the view is obscured."
            : "Both ears captured, one image each. Your audiologist reviews the images and explains what they show."}
        </p>
      </Card>
    </>
  );
}
