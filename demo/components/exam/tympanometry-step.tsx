"use client";
import { Card, StatusPill } from "../ui";
import { tympanometry } from "@/lib/mock-data";
import type { EarStatus, Framing } from "./otoscopy-step";

/**
 * A tympanogram trace: eardrum compliance (y) against canal pressure (x,
 * −300…+200 daPa). `peak` scales the curve height — a stiff middle ear
 * (Type As) is the same shape at lower amplitude.
 */
function Tympanogram({ peak, shift, color }: { peak: number; shift: number; color: string }) {
  const W = 130, H = 72, BASE = H - 12;
  const apexX = W / 2 + shift, apexY = BASE - peak;
  const d = `M6 ${BASE} C ${apexX - 34} ${BASE}, ${apexX - 16} ${apexY}, ${apexX} ${apexY} `
    + `S ${apexX + 34} ${BASE}, ${W - 6} ${BASE}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-hidden>
      <line x1="6" y1={BASE} x2={W - 6} y2={BASE} stroke="#dfe9eb" />
      <line x1={W / 2} y1="8" x2={W / 2} y2={BASE} stroke="#eef4f5" />
      <path d={d} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <text x="8" y={H - 2} fontSize="7" fill="#94a3b8">−300</text>
      <text x={W / 2} y={H - 2} fontSize="7" fill="#94a3b8" textAnchor="middle">0</text>
      <text x={W - 8} y={H - 2} fontSize="7" fill="#94a3b8" textAnchor="end">+200 daPa</text>
    </svg>
  );
}

/** One tympanogram per ear (corrections sheet 2026-08-31, item 5). */
export function TympanometryStep({ framing, status, earAction }: {
  framing: Framing;
  /** Per-ear pill override; see `EarStatus` in otoscopy-step.tsx. */
  status?: { left?: EarStatus; right?: EarStatus };
  /** Per-ear control, rendered inside that ear's card. See `OtoscopyStep`. */
  earAction?: (side: "left" | "right") => React.ReactNode;
}) {
  // Left ear in the left column, right ear on the right (see OtoscopyStep).
  const ears = [
    { label: "Left ear", peak: 22, shift: -12, color: "#2788c8", side: "left" as const, ...tympanometry.left },
    { label: "Right ear", peak: 44, shift: -4, color: "#ef6b6b", side: "right" as const, ...tympanometry.right },
  ];
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        {ears.map(ear => {
          const over = status?.[ear.side];
          const tone = over?.tone ?? ear.tone;
          const label = over?.label ?? (ear.tone === "green" ? "Normal" : "Noted");
          const icon = over?.icon;
          return (
            <Card key={ear.label} className="p-4">
              <span className="text-xs text-slate-500">{ear.label}</span>
              <h3 className="text-sm font-extrabold">{ear.type}</h3>
              <div className="mt-2"><Tympanogram peak={ear.peak} shift={ear.shift} color={ear.color} /></div>
              <p className="mt-2 text-[11px] leading-4 text-slate-500">
                Peak {ear.pressure} · {ear.compliance}
              </p>
              <div className="mt-2">
                <StatusPill tone={tone} icon={icon}>{label}</StatusPill>
              </div>
              {earAction && <div className="mt-3">{earAction(ear.side)}</div>}
            </Card>
          );
        })}
      </div>
      <Card className="mt-4 p-4">
        <p className="text-sm leading-6 text-slate-500">
          {framing === "cma"
            ? "Seal the probe tip in the canal and hold still through the pressure sweep. One trace per ear; re-run if the seal breaks."
            : framing === "audiologist"
            ? "Both traces are in. Accept them, or send either ear back for a re-run before the exam moves on."
            : "A gentle pressure test of how your eardrums move — one result for each ear. No response is needed from you."}
        </p>
      </Card>
    </>
  );
}
