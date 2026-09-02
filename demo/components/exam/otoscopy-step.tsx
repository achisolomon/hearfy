"use client";
import { Card, StatusPill } from "../ui";
import { otoscopy } from "@/lib/mock-data";
import { asset } from "@/lib/asset";

export type Framing = "patient" | "cma" | "audiologist";

/**
 * The scope view: a real otoscopy capture per ear, so the two read as two
 * distinct captures rather than one picture used twice.
 *
 * Exported because the audiologist's clinical review shows the same captures
 * (persona spec §2: review carries "otoscopy imagery"). Drawing a second ear
 * view there would put two different illustrations of the same organ in one
 * product; the capture the CMA took is the capture she reads.
 */
export function EarImage({ hue }: { hue: "warm" | "cool" }) {
  // cool = the patient's left ear (cerumen present), warm = the right (clear).
  // Kept as a hue prop so both call sites — the exam step and the audiologist's
  // clinical review — stay one component showing one set of captures.
  const capture = hue === "cool"
    ? { src: asset("/exam/ear-left-cerumen.jpg"), alt: "Otoscopy capture, left ear: mild cerumen along the canal wall, tympanic membrane visible" }
    : { src: asset("/exam/ear-right-clear.jpg"), alt: "Otoscopy capture, right ear: clear canal with intact tympanic membrane" };
  return (
    // Full-bleed capture. The navy ground still shows while the image decodes,
    // so the card never flashes white against the Harbor Navy shell.
    <div className="relative h-36 overflow-hidden bg-[#0c2340]">
      <img
        src={capture.src}
        alt={capture.alt}
        loading="lazy"
        decoding="async"
        // The assets are cut to this header's ratio with the whole otoscope
        // disc fitted to height, so cover fills the card without clipping it.
        className="h-full w-full object-cover"
      />
    </div>
  );
}

/**
 * One capture per ear (corrections sheet 2026-08-31, item 3) — never a single
 * image standing in for both.
 */
export function OtoscopyStep({ framing }: { framing: Framing }) {
  // Anatomical order: the patient's left ear renders in the left column and
  // the right ear on the right, matching how a clinician reads a chart.
  const ears = [
    { label: "Left ear", hue: "cool" as const, ...otoscopy.left },
    { label: "Right ear", hue: "warm" as const, ...otoscopy.right },
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
            : framing === "audiologist"
            ? "Both captures are in. Accept them, or send one back for a retake before the exam moves on."
            : "Both ears captured, one image each. Your audiologist reviews the images and explains what they show."}
        </p>
      </Card>
    </>
  );
}
