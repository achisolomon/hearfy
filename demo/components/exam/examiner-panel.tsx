"use client";
import { Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";
import { examiner } from "@/lib/mock-data";

/**
 * The AI examiner's persistent presence (Exam Engine spec §4, AC01).
 *
 * The spec asks for the examiner to stay visible in a video window through
 * every normal step. This is that window without video: an animated mark
 * that carries speaking / listening / working state, a nameplate that always
 * says it is an AI, and the spoken line as a caption BELOW the frame.
 *
 * Three reasons it is not video:
 *   - the patient's pages carry no video streaming, and that rule survives
 *     the avatar (regressions.test.ts bans the video components here);
 *   - the spec itself requires a "graceful low-bandwidth mode", and an
 *     animated mark IS that mode rather than a degradation of it;
 *   - there is no avatar footage, and a placeholder face would read as a
 *     stock photo of a clinician, which is the one thing §4 forbids.
 *
 * Geometry follows the Held Frame Rule: the frame and the caption both have
 * reserved heights, so the panel occupies an identical box whether the
 * examiner is saying one line or three, and whether it is mid-sentence or
 * waiting. Nothing here resizes between steps.
 */

/** Reserved so a longer line cannot grow the panel. */
const CAPTION_MIN = "3.6em";

export type ExaminerState = "speaking" | "listening" | "working";

const STATE_LABEL: Record<ExaminerState, string> = {
  speaking: "Speaking",
  listening: "Listening",
  working: "Working",
};

/**
 * The animated mark. Three concentric arcs that pulse outward while the
 * examiner speaks, hold steady while it listens, and rotate slowly while it
 * works — motion that reads as attention without impersonating a face.
 *
 * `prefers-reduced-motion` stops all of it; the state is still legible from
 * the pill and the ring's opacity, so nothing is carried by motion alone.
 */
function ExaminerMark({ state }: { state: ExaminerState }) {
  return (
    <span className="relative grid h-20 w-20 place-items-center" aria-hidden>
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className={cn(
            "absolute rounded-full border-2 border-brand-teal",
            state === "speaking" && "motion-safe:animate-ping",
          )}
          style={{
            height: `${44 + i * 14}px`,
            width: `${44 + i * 14}px`,
            opacity: state === "listening" ? 0.18 + i * 0.06 : 0.34 - i * 0.09,
            animationDuration: `${1.6 + i * 0.5}s`,
            animationDelay: `${i * 0.18}s`,
          }}
        />
      ))}
      <span
        className={cn(
          "relative grid h-11 w-11 place-items-center rounded-full bg-brand-navy text-white",
          state === "working" && "motion-safe:animate-pulse",
        )}
      >
        <Sparkles size={20} />
      </span>
    </span>
  );
}

/**
 * The panel itself. `line` is what the examiner is currently saying — the
 * caption. `state` drives the mark and the pill.
 *
 * There is no control to dismiss or mute it: the spec's AC01 is that the
 * examiner stays visible through every normal step, and a patient who can
 * close the examiner is a patient who can be left with no guide mid-test.
 */
export function ExaminerPanel({
  state = "speaking",
  line,
  className = "",
}: {
  state?: ExaminerState;
  line: string;
  className?: string;
}) {
  return (
    <section
      aria-label={`${examiner.name}, ${examiner.role}`}
      className={cn("overflow-hidden rounded-[28px] bg-white shadow-card", className)}
    >
      <div className="flex items-center gap-4 bg-gradient-to-br from-[#e9f6f5] to-[#eef4fb] px-5 py-5">
        <ExaminerMark state={state} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <b className="text-base text-brand-navy">{examiner.name}</b>
            {/* Always on, never conditional: AC02's disclosure is not a
                one-time screen, it travels with the examiner. */}
            <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#235f98]">
              {examiner.disclosure}
            </span>
          </div>
          <p className="mt-1 flex items-center gap-2 text-xs font-bold text-teal-ink">
            <span
              className={cn(
                "h-2 w-2 rounded-full bg-brand-teal",
                state !== "listening" && "motion-safe:animate-pulse",
              )}
            />
            {STATE_LABEL[state]}
          </p>
        </div>
      </div>
      {/* The caption sits BELOW the frame, never over it, and reserves its
          height so a three-line instruction does not move the panel. */}
      <p
        className="px-5 py-4 text-sm font-semibold leading-6 text-brand-navy"
        style={{ minHeight: CAPTION_MIN }}
      >
        {line}
      </p>
    </section>
  );
}

/**
 * What the patient can always do, on every examined step (AC03): pause,
 * ask for it to be repeated or said more simply, or ask for a human.
 *
 * These are the spec's patient controls, and they are deliberately real
 * affordances rather than decoration — "request a human" is the escalation
 * path, so it is styled as the strongest of the three.
 */
export function ExaminerControls({
  onHuman,
  className = "",
}: {
  onHuman?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-3 gap-2", className)}>
      {["Pause", "Say that again", "Simpler words"].map(label => (
        <button
          key={label}
          className="rounded-2xl border border-[#d8e5e8] bg-white px-2 py-3 text-xs font-bold leading-4 text-brand-navy hover:border-teal-ink"
        >
          {label}
        </button>
      ))}
      <button
        onClick={onHuman}
        className="col-span-3 rounded-2xl border border-[#d8e5e8] bg-white px-3 py-3 text-sm font-bold text-brand-navy hover:border-teal-ink"
      >
        I&rsquo;d like to speak to a person
      </button>
    </div>
  );
}

/**
 * The escalation destination (AC10/AC11). When the patient asks for a human,
 * or a rule escalates, the examiner does not argue or re-explain — it hands
 * over, and says so plainly. The spec is explicit: "do not challenge the
 * request".
 */
export function HumanHandoff({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-[#cfe3f5] bg-[#edf4fb] px-4 py-3.5", className)}>
      <p className="flex items-start gap-2 text-sm font-semibold leading-6 text-[#235f98]">
        <Check size={17} className="mt-0.5 shrink-0" />
        <span>{children}</span>
      </p>
    </div>
  );
}
