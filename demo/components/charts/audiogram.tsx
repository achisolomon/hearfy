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

/**
 * Horizontal offset for the bone-conduction brackets, in chart units. Bone
 * marks sit beside their frequency, never on it, so they never occlude the
 * air symbol whose distance from them IS the finding.
 */
const BONE_DX = 7;

function x(i: number, n: number) {
  return PAD_L + (i / (n - 1)) * (W - PAD_L - PAD_R);
}
function y(db: number) {
  return PAD_T + ((db - DB_MIN) / (DB_MAX - DB_MIN)) * (H - PAD_T - PAD_B);
}

/**
 * Severity bands (chart world). The clinical ranges every audiogram is read
 * against, painted into the plot so a threshold lands somewhere NAMEABLE
 * instead of leaving the reader to measure against an axis. Bounds are the
 * standard dB HL classification; the top band starts at DB_MIN so the plot
 * area is fully covered.
 */
const BANDS = [
  { from: DB_MIN, to: 25, label: "Normal", fill: "#edf8f2", ink: "#3f7a5a" },
  { from: 25, to: 40, label: "Mild", fill: "#fdf6e7", ink: "#8c6a1d" },
  { from: 40, to: 55, label: "Moderate", fill: "#fbeede", ink: "#96521c" },
  { from: 55, to: DB_MAX, label: "Severe", fill: "#f9e7e4", ink: "#9c4038" },
];

/**
 * The dB gridlines the axis numbers sit on. A band label placed level with
 * one of these collides with its number across the axis, so labels are
 * nudged to the clear middle of their own band instead.
 */
const DB_GRIDLINES = [0, 20, 40, 60, 80];

/**
 * Vertical placement for a band's label: centered in the band, then pulled
 * off any gridline it would sit on. Bands are 15-30 dB tall and gridlines are
 * every 20 dB, so a centered label can still land on one (Mild spans 25-40,
 * centering at 32.5 — clear; Moderate spans 40-55, centering at 47.5 —
 * clear; but the arithmetic must hold if the bands are ever retuned).
 */
function bandLabelY(from: number, to: number) {
  const mid = (Math.max(from, DB_MIN) + Math.min(to, DB_MAX)) / 2;
  const onGridline = DB_GRIDLINES.some(g => Math.abs(y(g) - y(mid)) < 6);
  return y(onGridline ? mid + 6 : mid) + 3;
}

/**
 * Where everyday speech sounds sit on the audiogram — the "speech banana" in
 * its plainest form. Positioned by frequency and typical conversational
 * level, so the patient can see which of their own sounds fall below the
 * line. Patient copies only; the clinician's overlay stays uncluttered.
 */
const SPEECH_SOUNDS = [
  { sound: "m", hz: 300, db: 40 },
  { sound: "a", hz: 700, db: 47 },
  { sound: "r", hz: 1200, db: 42 },
  { sound: "sh", hz: 2300, db: 32 },
  { sound: "s", hz: 4200, db: 26 },
  { sound: "th", hz: 7000, db: 22 },
];

/** Frequency → x, interpolated on the same evenly-spaced octave scale. */
function xForHz(hz: number, frequencies: number[]) {
  const n = frequencies.length;
  const lo = Math.log2(frequencies[0]);
  const hi = Math.log2(frequencies[n - 1]);
  const t = (Math.log2(hz) - lo) / (hi - lo);
  return PAD_L + Math.min(1, Math.max(0, t)) * (W - PAD_L - PAD_R);
}

/**
 * `ear` narrows the chart to one side so a screen can present two results,
 * one per ear (corrections sheet 2026-08-31, item 4). "both" keeps the
 * combined clinical overlay for the audiologist's screens.
 */
export function Audiogram({ animate = false, showBone = false, ear = "both",
  bands = false, speech = false }:
  { animate?: boolean; showBone?: boolean; ear?: "both" | "right" | "left";
    /** Paint the named severity bands behind the plot (chart world). */
    bands?: boolean;
    /** Place everyday speech sounds on the plot — patient copies only. */
    speech?: boolean }) {
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
        {/* Severity bands sit under everything: they are the ground, not a layer.
           Labels hug the LEFT edge: hearing loss slopes down to the right, so
           the right edge is where the curve sits lowest and a right-anchored
           label collides with the plot line (it did — "SEVERE" was struck
           through by the 8k threshold). At 250 Hz the curve is always at its
           highest, so the left edge stays clear across the severity range. */}
        {bands && BANDS.map(b => (
          <g key={b.label}>
            <rect x={PAD_L} y={y(b.from)} width={W - PAD_L - PAD_R} height={y(b.to) - y(b.from)} fill={b.fill} />
            <text x={PAD_L + 4} y={bandLabelY(b.from, b.to)} textAnchor="start" fontSize="7.5"
                  fontWeight="700" fill={b.ink}>{b.label.toUpperCase()}</text>
          </g>
        ))}

        {/* Everyday speech sounds, where they actually live on the plot. */}
        {speech && SPEECH_SOUNDS.map(s => (
          <text key={s.sound} x={xForHz(s.hz, frequencies)} y={y(s.db)} textAnchor="middle"
                fontSize="10" fontStyle="italic" fill="#6d8291">{s.sound}</text>
        ))}

        {/* dB gridlines */}
        {DB_GRIDLINES.map(db => (
          <g key={db}>
            <line x1={PAD_L} x2={W - PAD_R} y1={y(db)} y2={y(db)} stroke={bands ? "#cfdde1" : "#dfe9eb"} />
            <text x={PAD_L - 6} y={y(db) + 3} textAnchor="end" fontSize="8" fill={bands ? "#47586b" : "#94a3b8"}>{db}</text>
          </g>
        ))}
        {/* Frequency gridlines */}
        {frequencies.map((f, i) => (
          <g key={f}>
            <line x1={x(i, n)} x2={x(i, n)} y1={PAD_T} y2={H - PAD_B} stroke={bands ? "#dbe7ea" : "#eef4f5"} />
            <text x={x(i, n)} y={H - PAD_B + 12} textAnchor="middle" fontSize="8" fill={bands ? "#47586b" : "#94a3b8"}>
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
            <circle key={i} cx={x(i, n)} cy={y(db)} r="4.5" fill={bands ? "#fff" : "none"} stroke="#ef6b6b" strokeWidth="2" />
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
            {/* Bone marks are OFFSET off the gridline, the clinical convention:
               right bracket sits left of the frequency, left bracket right of
               it. Both ears share a bone threshold at four of six frequencies
               in this exam, so drawn on the line the two glyphs land on the
               same point and read as one smudge — and where a bone threshold
               equals its own air threshold, the bracket disappears inside the
               O or X. The offset is what makes the air-bone gap countable. */}
            {showRight && boneRight.map((db, i) => (
              <text key={`br${i}`} x={x(i, n) - BONE_DX} y={y(db) + 4} textAnchor="middle"
                    fontSize="12" fontWeight="700" fill="#ef6b6b">&lt;</text>
            ))}
            {showLeft && boneLeft.map((db, i) => (
              <text key={`bl${i}`} x={x(i, n) + BONE_DX} y={y(db) + 4} textAnchor="middle"
                    fontSize="12" fontWeight="700" fill="#2788c8">&gt;</text>
            ))}
          </>
        )}
      </svg>

      {/* Legend: shape + label, so colour is never the only cue. */}
      <figcaption className="mt-2 flex flex-wrap gap-4 text-[11px] font-semibold text-slate-500">
        {showLeft && <span className="flex items-center gap-1.5"><span className="text-[#2788c8]">✕</span> Left ear (air)</span>}
        {showRight && <span className="flex items-center gap-1.5"><span className="text-[#ef6b6b]">◯</span> Right ear (air)</span>}
        {showBone && <span className="flex items-center gap-1.5"><span>&lt; &gt;</span> Bone conduction</span>}
        {speech && <span className="flex items-center gap-1.5"><span className="italic text-[#6d8291]">s</span> Everyday speech sounds</span>}
        <span className="text-slate-500">dB HL by frequency (Hz)</span>
      </figcaption>
    </figure>
  );
}
