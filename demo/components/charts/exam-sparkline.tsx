"use client";
import { audiogram } from "@/lib/mock-data";

/**
 * The supervision tile's chart (chart world). One exam, drawn at tile scale
 * on the same banded ground as the full audiogram, so the room reads as six
 * charts in progress rather than six text rows.
 *
 * `plotted` is how many of the frequencies have been measured so far: the
 * measured points draw solid, the rest sit as hollow pending marks. An exam
 * that has not reached the pure-tone step yet plots nothing and says so.
 */
const W = 220, H = 56;
const DB_MIN = -10, DB_MAX = 90;

const BANDS = [
  { from: DB_MIN, to: 25, fill: "#edf8f2" },
  { from: 25, to: 40, fill: "#fdf6e7" },
  { from: 40, to: 55, fill: "#fbeede" },
  { from: 55, to: DB_MAX, fill: "#f9e7e4" },
];

function y(db: number) {
  return ((db - DB_MIN) / (DB_MAX - DB_MIN)) * H;
}
function x(i: number, n: number) {
  return 6 + (i / (n - 1)) * (W - 12);
}

export function ExamSparkline({ plotted, label }: { plotted: number; label: string }) {
  const { frequencies, right } = audiogram;
  const n = frequencies.length;
  const done = right.slice(0, Math.max(0, Math.min(plotted, n)));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 w-full" role="img"
         aria-label={plotted > 0
           ? `${label}: ${plotted} of ${n} thresholds plotted`
           : `${label}: thresholds not started`}>
      {BANDS.map(b => (
        <rect key={b.from} x="0" y={y(b.from)} width={W} height={y(b.to) - y(b.from)} fill={b.fill} />
      ))}

      {/* Pending marks: the shape of what is still to come, so a tile mid-exam
         still reads as the same chart rather than an empty box. */}
      {frequencies.map((f, i) => i >= done.length && (
        <circle key={f} cx={x(i, n)} cy={y(right[i])} r="2.5" fill="none"
                stroke="#9db2c8" strokeWidth="1.2" strokeDasharray="2 2" />
      ))}

      {/* An exam that has not reached the hearing test yet says so. Pending
         marks alone read as a chart that failed to draw, not as one waiting
         to start — the tile has to state which it is. */}
      {done.length === 0 && (
        <text x={W / 2} y={H / 2 + 3} textAnchor="middle" fontSize="9"
              fontWeight="700" fill="#47586b">Hearing test not started</text>
      )}

      {done.length > 1 && (
        <polyline points={done.map((db, i) => `${x(i, n)},${y(db)}`).join(" ")}
                  fill="none" stroke="#c0392b" strokeWidth="2" />
      )}
      {done.map((db, i) => (
        <circle key={i} cx={x(i, n)} cy={y(db)} r="3.4" fill="#fff" stroke="#c0392b" strokeWidth="2" />
      ))}
    </svg>
  );
}
