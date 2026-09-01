/**
 * The demo's single source of truth for "when we are" (spec §8).
 *
 * Framework-free on purpose: no React imports, so the pointer maths is
 * trivially testable and can never depend on render order.
 */
import type { ScreenId } from "@/components/screens/registry";

export const ROLES = ["patient", "cma", "audiologist", "operator"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  patient: "Patient",
  cma: "CMA",
  audiologist: "Cloud Audiologist",
  operator: "Operator",
};

/** The nine lifecycle stages (spec §7). */
export const STAGES = [
  { n: 1, name: "Awareness" },
  { n: 2, name: "Booking & intake" },
  { n: 3, name: "Dispatch" },
  { n: 4, name: "Home visit" },
  { n: 5, name: "Live supervision" },
  { n: 6, name: "Result" },
  { n: 7, name: "Consult & prescription" },
  { n: 8, name: "Sale" },
  { n: 9, name: "Fulfilment & follow-up" },
] as const;

export type StageNumber = (typeof STAGES)[number]["n"];

/**
 * A screen id for any role. Patient screens use the existing ScreenId union;
 * the other roles' screens are added by later plans, so their ids are plain
 * strings until those screens exist.
 */
export type AnyScreenId = ScreenId | string;

export interface Beat {
  /** Stable identifier, unique across the script. */
  id: string;
  stage: StageNumber;
  /** Whose perspective leads this beat — guided mode switches to this role. */
  lead: Role;
  /** Every role has a screen at every beat. No "waiting…" placeholders (spec §8). */
  screens: Record<Role, AnyScreenId>;
}

/**
 * Non-patient screen ids referenced below are placeholders until later plans
 * build them; `role-view.tsx` falls back to a labelled stub for any id it
 * cannot resolve, so the shell works before those screens exist.
 */
export const BEATS: Beat[] = [
  // ---- Stage 1: Awareness ----
  { id: "welcome", stage: 1, lead: "patient",
    screens: { patient: "welcome", cma: "cma-day", audiologist: "aud-panel", operator: "op-dashboard" } },
  { id: "signin", stage: 1, lead: "patient",
    screens: { patient: "signin", cma: "cma-day", audiologist: "aud-panel", operator: "op-dashboard" } },
  { id: "home", stage: 1, lead: "patient",
    screens: { patient: "home", cma: "cma-day", audiologist: "aud-panel", operator: "op-dashboard" } },

  // ---- Stage 2: Booking & intake ----
  // Collapsed from nine beats to six (decided 2026-08-30), then back to seven
  // (2026-09-01). The guided story hits the fork, the SYMPTOMS, the safety
  // gate, the visit slot, the money and the confirmation; the two still-
  // skipped screens (intake-coverage, intake-plan) stay fully reachable by
  // free navigation and in solo patient mode.
  { id: "intake-for", stage: 2, lead: "patient",
    screens: { patient: "intake-for", cma: "cma-day", audiologist: "aud-panel", operator: "op-dashboard" } },
  // The pre-visit questionnaire earned a beat back (owner, 2026-09-01: "I have
  // to click on 'who is the visit for' Continue... if I click Next, I don't
  // see the screen"). Two ways forward disagreed: the screen's own Continue
  // walked to it, while the walkthrough's Next jumped straight past it to the
  // safety gate — so the one beat that shows WHAT THE PATIENT NOTICES, the
  // reason for the whole visit, was invisible to anyone driving the demo the
  // way it is meant to be driven.
  //
  // It sits BETWEEN the fork and the safety gate deliberately: "who is this
  // for" then "what are you noticing" then "any red flags" is the clinical
  // order, and the safety gate reads as a response to the symptoms rather
  // than an unprompted interrogation.
  { id: "intake-needs", stage: 2, lead: "patient",
    screens: { patient: "intake-needs", cma: "cma-day", audiologist: "aud-panel", operator: "op-dashboard" } },
  { id: "intake-medical", stage: 2, lead: "patient",
    screens: { patient: "intake-medical", cma: "cma-day", audiologist: "aud-panel", operator: "op-dashboard" } },
  // Choosing the visit slot is the patient's decision. The guided walk went
  // straight from intake to payment, so the viewer was billed $99 for a visit
  // whose date and time they were never asked to pick, then told a specific
  // date on the confirmation as though they had chosen it.
  { id: "book-date", stage: 2, lead: "patient",
    screens: { patient: "book-date", cma: "cma-day", audiologist: "aud-panel", operator: "op-dashboard" } },
  { id: "book-time", stage: 2, lead: "patient",
    screens: { patient: "book-time", cma: "cma-day", audiologist: "aud-panel", operator: "op-dashboard" } },
  { id: "payment", stage: 2, lead: "patient",
    screens: { patient: "payment", cma: "cma-day", audiologist: "aud-panel", operator: "op-dashboard" } },
  { id: "confirmed", stage: 2, lead: "patient",
    screens: { patient: "confirmed", cma: "cma-day", audiologist: "aud-panel", operator: "op-dashboard" } },

  // ---- Stage 3: Dispatch ----
  { id: "assigned", stage: 3, lead: "patient",
    screens: { patient: "assigned", cma: "cma-day", audiologist: "aud-panel", operator: "op-dashboard" } },
  { id: "cma-enroute", stage: 3, lead: "cma",
    screens: { patient: "driving", cma: "cma-enroute", audiologist: "aud-panel", operator: "op-dashboard" } },
  { id: "driving", stage: 3, lead: "patient",
    screens: { patient: "driving", cma: "cma-enroute", audiologist: "aud-panel", operator: "op-dashboard" } },

  // ---- Stage 4: Home visit ----
  { id: "arrived", stage: 4, lead: "cma",
    screens: { patient: "arrived", cma: "cma-arrival", audiologist: "aud-panel", operator: "op-dashboard" } },
  { id: "consent", stage: 4, lead: "cma",
    screens: { patient: "consent", cma: "cma-consent", audiologist: "aud-panel", operator: "op-dashboard" } },
  { id: "setup", stage: 4, lead: "cma",
    screens: { patient: "setup", cma: "cma-calibration", audiologist: "aud-panel", operator: "op-dashboard" } },
  { id: "otoscopy", stage: 4, lead: "cma",
    screens: { patient: "otoscopy", cma: "cma-otoscopy", audiologist: "aud-panel", operator: "op-dashboard" } },
  // Corrections sheet 2026-08-31, item 5: tympanometry runs on every exam,
  // between the ear health check and the hearing test.
  { id: "tympanometry", stage: 4, lead: "cma",
    screens: { patient: "tympanometry", cma: "cma-tympanometry", audiologist: "aud-panel", operator: "op-dashboard" } },
  { id: "puretone", stage: 4, lead: "cma",
    screens: { patient: "testing", cma: "cma-puretone", audiologist: "aud-monitor", operator: "op-dashboard" } },

  // ---- Stage 5: Live supervision ----
  { id: "supervision", stage: 5, lead: "audiologist",
    screens: { patient: "testing", cma: "cma-puretone", audiologist: "aud-panel", operator: "op-dashboard" } },
  { id: "intervention", stage: 5, lead: "audiologist",
    screens: { patient: "live", cma: "cma-puretone", audiologist: "aud-monitor", operator: "op-dashboard" } },
  { id: "speech", stage: 5, lead: "cma",
    screens: { patient: "testing", cma: "cma-speech", audiologist: "aud-monitor", operator: "op-dashboard" } },
  { id: "bone", stage: 5, lead: "cma",
    screens: { patient: "testing", cma: "cma-bone", audiologist: "aud-monitor", operator: "op-dashboard" } },

  // ---- Stage 6: Result ----
  { id: "review", stage: 6, lead: "audiologist",
    screens: { patient: "review", cma: "cma-handoff", audiologist: "aud-review", operator: "op-dashboard" } },
  { id: "sign", stage: 6, lead: "audiologist",
    screens: { patient: "review", cma: "cma-handoff", audiologist: "aud-sign", operator: "op-dashboard" } },
  { id: "results", stage: 6, lead: "patient",
    screens: { patient: "results", cma: "cma-handoff", audiologist: "aud-sign", operator: "op-dashboard" } },

  // ---- Stage 7: Consult & prescription ----
  { id: "consult", stage: 7, lead: "audiologist",
    screens: { patient: "recommendation", cma: "cma-handoff", audiologist: "aud-consult", operator: "op-dashboard" } },
  { id: "prescription", stage: 7, lead: "audiologist",
    screens: { patient: "recommendation", cma: "cma-stock", audiologist: "aud-prescription", operator: "op-dashboard" } },

  // ---- Stage 8: Sale ----
  // Choosing the device is the patient's decision — the audiologist prescribes
  // what is clinically suitable, the patient picks from it. Led by the CMA, the
  // guided walk went from the prescription straight to checkout, so the viewer
  // was billed for a device nobody had let them choose.
  //
  // The sale runs in three moves (2026-08-31), and the lead follows whoever is
  // actually driving:
  //   1. `stock`  — CMA's tablet: the full comparison, Dr. Reed presenting it
  //                 over video. She recommends; nobody has chosen yet.
  //   2. `tryon`  — CMA's tablet: the patient wears each device and talks to
  //                 her about how it feels and what they hear.
  //   3. `choose` — the patient's own phone: they make the decision, having
  //                 heard her and worn the devices.
  //   4. `checkout` — they pay for what they chose.
  // `stock` led with the patient, which jumped the walkthrough to a phone
  // showing packages while the conversation was happening on the tablet.
  { id: "stock", stage: 8, lead: "cma",
    screens: { patient: "compare", cma: "cma-stock", audiologist: "aud-prescription", operator: "op-dashboard" } },
  { id: "tryon", stage: 8, lead: "cma",
    screens: { patient: "compare", cma: "cma-tryon", audiologist: "aud-prescription", operator: "op-dashboard" } },
  { id: "choose", stage: 8, lead: "patient",
    screens: { patient: "compare", cma: "cma-tryon", audiologist: "aud-prescription", operator: "op-dashboard" } },
  { id: "checkout", stage: 8, lead: "patient",
    screens: { patient: "checkout", cma: "cma-tryon", audiologist: "aud-prescription", operator: "op-dashboard" } },
  // Corrections sheet 2026-08-31, item 12 (refined): the PATIENT reviews the
  // contract, accepts the terms, authorizes the card and signs — on their own
  // phone. The CMA's screen mirrors those inputs as they land.
  { id: "signing", stage: 8, lead: "patient",
    screens: { patient: "signing", cma: "cma-signing", audiologist: "aud-prescription", operator: "op-dashboard" } },
  { id: "activate", stage: 8, lead: "cma",
    screens: { patient: "signing", cma: "cma-activate", audiologist: "aud-prescription", operator: "op-dashboard" } },

  // ---- Stage 9: Fulfilment & follow-up ----
  { id: "closeout", stage: 9, lead: "cma",
    screens: { patient: "order", cma: "cma-closeout", audiologist: "aud-panel", operator: "op-dashboard" } },
  { id: "order", stage: 9, lead: "patient",
    screens: { patient: "order", cma: "cma-day", audiologist: "aud-panel", operator: "op-dashboard" } },
  { id: "support", stage: 9, lead: "patient",
    screens: { patient: "support", cma: "cma-day", audiologist: "aud-panel", operator: "op-dashboard" } },
];

/** Clamp an index into the valid beat range. */
function clamp(i: number): number {
  if (i < 0) return 0;
  if (i > BEATS.length - 1) return BEATS.length - 1;
  return i;
}

export function beatIndexById(id: string): number {
  return BEATS.findIndex(b => b.id === id);
}

/** Index of the first beat of a stage; 0 if the stage has no beats. */
export function firstBeatOfStage(stage: StageNumber): number {
  const i = BEATS.findIndex(b => b.stage === stage);
  return i === -1 ? 0 : i;
}

export function nextBeat(i: number): number {
  return clamp(i + 1);
}

export function prevBeat(i: number): number {
  return clamp(i - 1);
}

export function isLastBeat(i: number): boolean {
  return i >= BEATS.length - 1;
}

/** The screen a role shows at a beat. Out-of-range indices clamp. */
export function screenFor(i: number, role: Role): AnyScreenId {
  return BEATS[clamp(i)].screens[role];
}

/**
 * Reverse lookup: the beat a role's screen belongs to, so free navigation
 * inside a role moves the shared pointer (no detached browsing).
 * Returns the FIRST matching beat, or -1 when the screen is not in the script.
 */
export function beatForScreen(role: Role, screen: AnyScreenId): number {
  return BEATS.findIndex(b => b.screens[role] === screen);
}

/**
 * The beat to LAND on when a role navigates to a screen: prefer beats this
 * role leads, then the one nearest `from` (ties to the earlier beat).
 *
 * First-match was not enough: Back on the patient's "We're here after
 * delivery" targets "order", whose first beat is the CMA-led close-out. The
 * pointer parked a beat early, so the next forward press advanced close-out
 * → order and repainted the SAME screen — a dead click a viewer hit
 * (2026-08-31).
 */
export function beatForScreenNear(role: Role, screen: AnyScreenId, from: number): number {
  const matches = BEATS.map((b, i) => ({ b, i })).filter(x => x.b.screens[role] === screen);
  if (matches.length === 0) return -1;
  const led = matches.filter(x => x.b.lead === role);
  const pool = led.length ? led : matches;
  return pool.reduce((best, x) => Math.abs(x.i - from) < Math.abs(best.i - from) ? x : best).i;
}

/**
 * SOLO MODE — per-persona entry.
 *
 * Beats where this role's screen actually changes. Walking these lets a viewer
 * enter as one persona and stay there: `Next` moves through that role's own
 * story without ever switching roles. Consecutive beats showing the same screen
 * collapse to one, so a CMA does not press Next three times on one screen while
 * the patient's side advances.
 */
export function beatsForRole(role: Role): number[] {
  // The operator watches rather than acts: one screen id for the entire
  // script, whose CONTENT changes with the stage (pipeline, metrics,
  // exceptions). Keyed on screen changes he had a one-beat walk, so the
  // chrome's Next was dead and his first screen said "End of this persona's
  // day". His day is the nine stages.
  if (role === "operator") {
    return STAGES.map(s => firstBeatOfStage(s.n));
  }
  const out: number[] = [];
  let last: AnyScreenId | null = null;
  BEATS.forEach((b, i) => {
    const s = b.screens[role];
    if (s !== last) { out.push(i); last = s; }
  });
  return out;
}

/**
 * The next beat in a role's solo walk; stays put at the end.
 *
 * `i` need not itself be in the walk. When it sits inside a stretch where this
 * role's screen never changes, the next stop is the first walk beat strictly
 * after it — not the one after that.
 */
export function nextBeatForRole(i: number, role: Role): number {
  const beats = beatsForRole(role);
  const nextIdx = beats.find(b => b > i);
  return nextIdx ?? beats[beats.length - 1] ?? i;
}

/** The previous beat in a role's solo walk; stays put at the start. */
export function prevBeatForRole(i: number, role: Role): number {
  const beats = beatsForRole(role);
  const earlier = beats.filter(b => b < i);
  return earlier.length ? earlier[earlier.length - 1] : (beats[0] ?? i);
}
