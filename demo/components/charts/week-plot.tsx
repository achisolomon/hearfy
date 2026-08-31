"use client";

/**
 * The booking week as a plot (chart world). Choosing a day is placing a point
 * on a grid rather than pressing one of six tiles: the same axes-and-marks
 * grammar the results screen uses, applied to the first choice the patient
 * makes. The chosen day plots as the audiogram's own O mark.
 *
 * Interaction stays a real radio group — the plot is the presentation, never
 * a replacement for the affordance (product register: expression may not
 * obscure the task).
 */
/**
 * PAD_L must clear the longest row label at its rendered size, or the label
 * is clipped by the viewBox's left edge ("Afternoon" → "ernoon"). "Afternoon"
 * is 9 characters at fontSize 7.5; ~0.5em per character in this face plus the
 * 5-unit gap to the axis needs ~39 units, so 44 leaves a small margin.
 */
const W = 300, H = 128, PAD_L = 44, PAD_B = 22, PAD_T = 10;

export interface Slot { day: string; date: string; }

export function WeekPlot({ slots, selected, onSelect }:
  { slots: Slot[]; selected: number; onSelect: (i: number) => void }) {
  const n = slots.length;
  const x = (i: number) => PAD_L + ((i + 0.5) / n) * (W - PAD_L - 8);
  const rows = ["Morning", "Midday", "Afternoon"];
  const y = (r: number) => PAD_T + ((r + 0.5) / rows.length) * (H - PAD_T - PAD_B);

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-hidden="true">
        {rows.map((r, ri) => (
          <g key={r}>
            <line x1={PAD_L} x2={W - 8} y1={y(ri)} y2={y(ri)} stroke="#dbe7ea" />
            <text x={PAD_L - 5} y={y(ri) + 3} textAnchor="end" fontSize="7.5" fill="#47586b">{r}</text>
          </g>
        ))}
        {slots.map((s, i) => (
          <g key={s.date}>
            <line x1={x(i)} x2={x(i)} y1={PAD_T} y2={H - PAD_B} stroke="#eef4f5" />
            <text x={x(i)} y={H - PAD_B + 11} textAnchor="middle" fontSize="8"
                  fontWeight={i === selected ? 700 : 400}
                  fill={i === selected ? "#0b2340" : "#47586b"}>{s.day}</text>
            <text x={x(i)} y={H - PAD_B + 20} textAnchor="middle" fontSize="7" fill="#64748b">{s.date}</text>
          </g>
        ))}
        {/* Availability, plotted as faint pending marks: the shape of the week. */}
        {slots.map((s, i) => rows.map((r, ri) => (
          <circle key={`${s.date}-${r}`} cx={x(i)} cy={y(ri)} r="2.5" fill="none"
                  stroke="#b7c9cc" strokeWidth="1.2" />
        )))}
        {/* The choice, plotted as the audiogram's own mark. */}
        <line x1={x(selected)} x2={x(selected)} y1={PAD_T} y2={H - PAD_B}
              stroke="#12aaa5" strokeWidth="1.5" strokeDasharray="3 3" />
        <circle cx={x(selected)} cy={y(0)} r="6.5" fill="#fff" stroke="#c0392b" strokeWidth="2.5" />
      </svg>

      {/* The real control. Visible, labelled, keyboard-operable. */}
      <div role="radiogroup" aria-label="Choose a day" className="mt-3 grid grid-cols-3 gap-2">
        {slots.map((s, i) => (
          <button key={s.date} role="radio" aria-checked={i === selected}
                  onClick={() => onSelect(i)}
                  className={`min-h-14 rounded-2xl border p-3 text-sm font-bold transition ${
                    i === selected
                      ? "border-brand-navy bg-brand-navy text-white"
                      : "border-[#dfe9eb] bg-white text-brand-navy"}`}>
            <span className="block">{s.day}</span>
            <span className={`block text-xs font-semibold ${i === selected ? "text-white/75" : "text-slate-600"}`}>
              {s.date}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
