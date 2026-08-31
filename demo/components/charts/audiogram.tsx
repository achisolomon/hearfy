"use client";
import { motion } from "framer-motion";
import { audiogram } from "@/lib/mock-data";

/**
 * Clinical audiogram, hand-rolled SVG (spec §11.3).
 * Frequency on x (log-ish, evenly spaced octaves), dB HL on y, inverted —
 * better hearing at the top, the fixed clinical convention.
 *
 * Right ear = red circles (O), left ear = blue crosses (X). The SHAPE carries
 * the meaning as well as the colour, per the low-vision standard.
 */
const W = 320, H = 220, PAD_L = 34, PAD_B = 26, PAD_T = 12, PAD_R = 10;
const DB_MIN = -10, DB_MAX = 90;

function x(i: number, n: number) {
  return PAD_L + (i / (n - 1)) * (W - PAD_L - PAD_R);
}
function y(db: number) {
  return PAD_T + ((db - DB_MIN) / (DB_MAX - DB_MIN)) * (H - PAD_T - PAD_B);
}

/**
 * `ear` narrows the chart to one side so a screen can present two results,
 * one per ear (corrections sheet 2026-08-31, item 4). "both" keeps the
 * combined clinical overlay for the audiologist's screens.
 */
export function Audiogram({ animate = false, showBone = false, ear = "both" }:
  { animate?: boolean; showBone?: boolean; ear?: "both" | "right" | "left" }) {
  const { frequencies, right, left, boneRight, boneLeft } = audiogram;
  const n = frequencies.length;
  const showRight = ear !== "left";
  const showLeft = ear !== "right";

  return (
    <figure className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img"
           aria-label={ear === "both"
             ? "Audiogram showing moderate hearing loss in both ears"
             : `Audiogram for the ${ear} ear showing moderate hearing loss`}>
        {/* dB gridlines */}
        {[0, 20, 40, 60, 80].map(db => (
          <g key={db}>
            <line x1={PAD_L} x2={W - PAD_R} y1={y(db)} y2={y(db)} stroke="#dfe9eb" />
            <text x={PAD_L - 6} y={y(db) + 3} textAnchor="end" fontSize="8" fill="#94a3b8">{db}</text>
          </g>
        ))}
        {/* Frequency gridlines */}
        {frequencies.map((f, i) => (
          <g key={f}>
            <line x1={x(i, n)} x2={x(i, n)} y1={PAD_T} y2={H - PAD_B} stroke="#eef4f5" />
            <text x={x(i, n)} y={H - PAD_B + 12} textAnchor="middle" fontSize="8" fill="#94a3b8">
              {f >= 1000 ? `${f / 1000}k` : f}
            </text>
          </g>
        ))}

        {/* Air conduction — right ear, circles */}
        {showRight && <>
          <motion.polyline
            initial={animate ? { pathLength: 0 } : false} animate={{ pathLength: 1 }} transition={{ duration: .8 }}
            points={right.map((db, i) => `${x(i, n)},${y(db)}`).join(" ")}
            fill="none" stroke="#ef6b6b" strokeWidth="2.5"
          />
          {right.map((db, i) => (
            <circle key={i} cx={x(i, n)} cy={y(db)} r="4.5" fill="none" stroke="#ef6b6b" strokeWidth="2" />
          ))}
        </>}

        {/* Air conduction — left ear, crosses */}
        {showLeft && <>
          <motion.polyline
            initial={animate ? { pathLength: 0 } : false} animate={{ pathLength: 1 }} transition={{ duration: .8, delay: .15 }}
            points={left.map((db, i) => `${x(i, n)},${y(db)}`).join(" ")}
            fill="none" stroke="#2788c8" strokeWidth="2.5"
          />
          {left.map((db, i) => (
            <g key={i} stroke="#2788c8" strokeWidth="2">
              <line x1={x(i, n) - 4} y1={y(db) - 4} x2={x(i, n) + 4} y2={y(db) + 4} />
              <line x1={x(i, n) - 4} y1={y(db) + 4} x2={x(i, n) + 4} y2={y(db) - 4} />
            </g>
          ))}
        </>}

        {/* Bone conduction — part of every exam since the 2026-08-31 corrections (item 6) */}
        {showBone && (
          <>
            {showRight && boneRight.map((db, i) => (
              <text key={`br${i}`} x={x(i, n)} y={y(db) + 4} textAnchor="middle" fontSize="11" fill="#ef6b6b">&lt;</text>
            ))}
            {showLeft && boneLeft.map((db, i) => (
              <text key={`bl${i}`} x={x(i, n)} y={y(db) + 4} textAnchor="middle" fontSize="11" fill="#2788c8">&gt;</text>
            ))}
          </>
        )}
      </svg>

      {/* Legend: shape + label, so colour is never the only cue. */}
      <figcaption className="mt-2 flex flex-wrap gap-4 text-[11px] font-semibold text-slate-500">
        {showRight && <span className="flex items-center gap-1.5"><span className="text-[#ef6b6b]">◯</span> Right ear (air)</span>}
        {showLeft && <span className="flex items-center gap-1.5"><span className="text-[#2788c8]">✕</span> Left ear (air)</span>}
        {showBone && <span className="flex items-center gap-1.5"><span>&lt; &gt;</span> Bone conduction</span>}
        <span className="text-slate-400">dB HL by frequency (Hz)</span>
      </figcaption>
    </figure>
  );
}
