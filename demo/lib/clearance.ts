/**
 * The safety gate between the ear checks and the hearing test (owner,
 * 2026-09-02).
 *
 * The rule: if otoscopy or tympanometry FAILS, the visit stops. No hearing
 * test, no results, and above all no hearing device — the patient is referred
 * to a doctor. Selling a device over an unexamined middle ear problem is the
 * failure mode this gate exists to make structurally impossible, so the stop
 * is computed here from the findings rather than left to whoever is reading
 * the screen.
 *
 * Framework-free, like lib/exam.ts and lib/story.ts: no React import, so the
 * decision is trivially testable and can never depend on render order.
 *
 * WHY THREE STATES AND NOT A BOOLEAN
 * ----------------------------------
 * The hero patient's own left ear is the reason. It shows mild cerumen on
 * otoscopy and a Type As (stiff) tympanogram — both `amber`. Those are NOT
 * failures: they are noted findings the audiologist interprets, and the stiff
 * left trace is precisely what corroborates the left-ear air-bone gap the
 * exam goes on to find (see mock-data's `tympanometry`). A pass/fail boolean
 * would either stop the hero's own visit — killing the demo's main story — or
 * force amber to be silently scored as "pass", which would hide a finding the
 * clinician must still see. So a finding is `pass`, `noted`, or `fail`, and
 * only `fail` stops the visit.
 */

/** A single gate's verdict, worst-first when they are combined. */
export type Verdict = "fail" | "noted" | "pass";

/** The tones mock-data already carries per ear, mapped to a verdict. */
export type FindingTone = "green" | "amber" | "red";

export interface EarFinding {
  finding: string;
  tone: FindingTone;
}

/** One gated check, both ears. */
export interface GateResult {
  id: string;
  /** What the checklist calls it. */
  label: string;
  verdict: Verdict;
  /** Why, in the clinician's words — shown whenever the verdict is not `pass`. */
  detail: string;
}

const TONE_VERDICT: Record<FindingTone, Verdict> = {
  green: "pass",
  amber: "noted",
  red: "fail",
};

/** Worst of two ears: a failure in either ear fails the check. */
export function worst(a: Verdict, b: Verdict): Verdict {
  const rank: Verdict[] = ["fail", "noted", "pass"];
  return rank.indexOf(a) <= rank.indexOf(b) ? a : b;
}

export function verdictForTone(tone: FindingTone): Verdict {
  return TONE_VERDICT[tone];
}

/**
 * Score one check from its two ears. The detail names the ear that drove the
 * verdict, because "tympanometry failed" without an ear is not actionable.
 */
export function gateFor(
  id: string,
  label: string,
  ears: { left: EarFinding; right: EarFinding },
): GateResult {
  const left = verdictForTone(ears.left.tone);
  const right = verdictForTone(ears.right.tone);
  const verdict = worst(left, right);
  // The ear that set the verdict; left first when both are equally bad, which
  // matches the left-before-right reading order used everywhere else.
  const driver = left === verdict ? { side: "Left", f: ears.left } : { side: "Right", f: ears.right };
  return {
    id,
    label,
    verdict,
    detail: verdict === "pass"
      ? "Both ears clear."
      : `${driver.side} ear: ${driver.f.finding}.`,
  };
}

/**
 * The whole gate: every check that must clear before the hearing test starts.
 *
 * The pre-test questionnaire is one of the three (owner, 2026-09-02), even
 * though it is answered days earlier at intake — the audiologist's checklist
 * is a statement about THIS visit's readiness, and an unanswered medical
 * safety questionnaire is as much a reason not to proceed as a failed
 * tympanogram. It carries no ears, so it is scored from its own completion.
 */
export interface Clearance {
  gates: GateResult[];
  /** Every gate is `pass` or `noted` — the hearing test may begin. */
  cleared: boolean;
  /** At least one gate is `fail` — the visit stops and the patient is referred. */
  stopped: boolean;
  /** The gates that failed, for the referral message. */
  failed: GateResult[];
}

export function clearanceOf(gates: GateResult[]): Clearance {
  const failed = gates.filter(g => g.verdict === "fail");
  return {
    gates,
    cleared: failed.length === 0,
    stopped: failed.length > 0,
    failed,
  };
}

/**
 * What the patient and the CMA are told when a gate fails.
 *
 * Deliberately not a diagnosis: the CMA is not licensed to give one, and the
 * screen that shows this is hers. It says what was seen, that the visit is
 * stopping, and where to go — and it never mentions devices, because the whole
 * point is that no device conversation happens on a stopped visit.
 */
export function referralReason(c: Clearance): string {
  if (!c.stopped) return "";
  const names = c.failed.map(g => g.label.toLowerCase());
  const list = names.length === 1
    ? names[0]
    : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
  return `Today's ${list} finding needs a physician's assessment before any hearing test or device fitting can go ahead.`;
}

/* ------------------------------------------------------------------------ *
 * The visit's own clearance, built from the exam findings.
 * ------------------------------------------------------------------------ */

import { otoscopy, tympanometry, preTestQuestionnaire } from "./mock-data";

/**
 * The three checks, in the order the audiologist's checklist lists them
 * (owner, 2026-09-02): pre-test questionnaire, otoscopy, tympanometry. That is
 * also the order they happen in — the questionnaire at intake, then the two
 * physical checks at the visit — so the list reads as a timeline.
 */
export const GATE_ORDER = ["questionnaire", "otoscopy", "tympanometry"] as const;
export type GateId = (typeof GATE_ORDER)[number];

/**
 * The questionnaire gate. It has no ears, so it is scored from its own
 * answers: any red-flag answer fails it outright — that is the whole reason
 * `intake-medical` asks — and an incomplete questionnaire is not a pass
 * either, because the checklist's claim is that the check was DONE.
 */
export function questionnaireGate(q = preTestQuestionnaire): GateResult {
  const verdict: Verdict = q.redFlagAnswers > 0 ? "fail" : q.completedOn ? "pass" : "fail";
  return {
    id: "questionnaire",
    label: "Pre-test questionnaire",
    verdict,
    detail: verdict === "fail"
      ? (q.redFlagAnswers > 0
          ? `${q.redFlagAnswers} red-flag answer${q.redFlagAnswers === 1 ? "" : "s"} needs a physician's review.`
          : "Not completed. It must be answered before any testing.")
      : `${q.finding}, ${q.completedOn}.`,
  };
}

/** Every gate for this visit, in checklist order. */
export function visitGates(): GateResult[] {
  return [
    questionnaireGate(),
    gateFor("otoscopy", "Otoscopy", otoscopy),
    gateFor("tympanometry", "Tympanometry", tympanometry),
  ];
}

/** The visit's clearance — the one call both the CMA and audiologist screens make. */
export function visitClearance(): Clearance {
  return clearanceOf(visitGates());
}

/* ------------------------------------------------------------------------ *
 * The audiologist's REVIEW (owner, 2026-09-02, refined).
 *
 * Everything above scores what the instruments recorded. That is the input to
 * a decision, not the decision — and as first built, the checklist WAS the
 * decision: the app read the tones and told Dr. Reed the answer. Nobody on
 * screen could ever say "I see a problem", so the referral path could only be
 * reached by editing mock data.
 *
 * This is the correction. Dr. Reed rules on the two physical checks herself,
 * one at a time. The questionnaire is not hers to rule on — it was answered at
 * intake, so it stays a read-only row (owner: "only otoscopy and
 * tympanometry"). Her verdict, not the tone, decides whether the visit
 * proceeds.
 * ------------------------------------------------------------------------ */

/** What the reviewing clinician has said about one check. */
export type ReviewMark = "pending" | "clear" | "critical";

/** The two checks she rules on. The questionnaire is deliberately absent. */
export const REVIEWABLE = ["otoscopy", "tympanometry"] as const;
export type ReviewableId = (typeof REVIEWABLE)[number];

export type ReviewState = Record<ReviewableId, ReviewMark>;

export const NO_REVIEW: ReviewState = { otoscopy: "pending", tympanometry: "pending" };

export function markReview(s: ReviewState, id: ReviewableId, mark: ReviewMark): ReviewState {
  return { ...s, [id]: mark };
}

/**
 * The visit's state under her review. Three outcomes, and the middle one is
 * the reason this is not a boolean: before she has ruled on both checks the
 * visit is neither cleared NOR stopped — it is waiting on her. A screen that
 * treats "not yet stopped" as "cleared" would let the hearing test start
 * before anyone looked, which is the whole failure this gate exists to
 * prevent.
 */
export type ReviewOutcome = "pending" | "cleared" | "stopped";

export function reviewOutcome(s: ReviewState): ReviewOutcome {
  // A critical finding stops the visit the moment she marks it — she does not
  // have to finish the checklist to stop something she has already seen.
  if (REVIEWABLE.some(id => s[id] === "critical")) return "stopped";
  return REVIEWABLE.every(id => s[id] === "clear") ? "cleared" : "pending";
}

/** The checks she has marked critical, for the referral message. */
export function criticalGates(s: ReviewState, gates: GateResult[]): GateResult[] {
  return gates.filter(g => REVIEWABLE.includes(g.id as ReviewableId)
    && s[g.id as ReviewableId] === "critical");
}

/**
 * The referral wording for HER decision, phrased from the checks she flagged.
 * Same constraints as `referralReason`: no diagnosis, no device talk.
 */
export function reviewReferralReason(s: ReviewState, gates: GateResult[]): string {
  const flagged = criticalGates(s, gates);
  if (flagged.length === 0) return "";
  const names = flagged.map(g => g.label.toLowerCase());
  const list = names.length === 1
    ? names[0]
    : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
  return `Dr. Reed flagged today's ${list} finding as needing a physician's assessment before any hearing test or device fitting can go ahead.`;
}
