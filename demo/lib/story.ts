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
  // Her queue gets a beat of its own, right after the kit passes and before
  // the first exam step (owner, 2026-09-02: "the six exam page should be the
  // first page of the audiologist... after the CMA checklist. And then first,
  // like, the overview, and then we are diving into first exam").
  //
  // `aud-panel` was already her screen through arrival, consent and setup —
  // but she LED none of those, so a guided walk never landed on it. Once the
  // ear check became hers, the first beat she led dropped the viewer straight
  // into one exam, having never seen that there are six. That is the 1:many
  // claim the whole model rests on, skipped.
  //
  // It is deliberately the LAST thing before the exam rather than the first
  // thing of the stage: the queue reads as "here is her whole afternoon, and
  // this is the one we are about to open", which only works if the visit it
  // zooms into is the very next beat.
  { id: "overview", stage: 4, lead: "audiologist",
    screens: { patient: "setup", cma: "cma-calibration", audiologist: "aud-panel", operator: "op-dashboard" } },
  // The audiologist leads these two (owner, 2026-09-02: "these pages are not
  // CMA, it is the audiologist"). What is hers is the JUDGMENT — whether a
  // capture is adequate or the ear must be shot again — not the scope: Maya
  // is still the hands in the room, which is why `cma` below is unchanged and
  // still carries Dr. Reed's feed. An audiologist holding an otoscope herself
  // would be 1:1, and the supervision panel two beats later cites the 2026 CMS
  // rule change to claim one clinician covers six visits.
  { id: "otoscopy", stage: 4, lead: "audiologist",
    screens: { patient: "otoscopy", cma: "cma-otoscopy", audiologist: "aud-otoscopy", operator: "op-dashboard" } },
  // Corrections sheet 2026-08-31, item 5: tympanometry runs on every exam,
  // between the ear health check and the hearing test.
  { id: "tympanometry", stage: 4, lead: "audiologist",
    screens: { patient: "tympanometry", cma: "cma-tympanometry", audiologist: "aud-tympanometry", operator: "op-dashboard" } },
  { id: "puretone", stage: 4, lead: "cma",
    screens: { patient: "testing", cma: "cma-puretone", audiologist: "aud-monitor", operator: "op-dashboard" } },

  // ---- Stage 5: Live supervision ----
  // The six-exam panel used to open this stage too. It now has its own beat in
  // stage 4 (`overview`), where it introduces her — showing the same screen
  // again here made the panel her SECOND appearance of the same content, three
  // beats after she had already been running exams. Stage 5 opens on the
  // intervention instead, which is what actually escalates.
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
  // Maya fits and activates the devices in Alex's home here, with Dr. Reed
  // on the call confirming the sound — Alex is present, not acting, so his
  // screen is his own view of the fitting (BUG 1, 2026-09-01), not an echo
  // of the contract he already signed one beat earlier.
  { id: "activate", stage: 8, lead: "cma",
    screens: { patient: "fitting", cma: "cma-activate", audiologist: "aud-prescription", operator: "op-dashboard" } },

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
 * Whether beat `i` is a screen a role should be treated as "on" in its own
 * right — either they lead it, or their screen there is a genuine one-beat
 * appearance: distinct from their screen at BOTH the beat immediately before
 * and immediately after. That second half matters because a screen can
 * legitimately echo without being meaningful HERE: the patient's "compare"
 * screen shows up one beat before the CMA-led "choose" where the patient
 * takes over — an early, shared appearance, not a beat of its own — and
 * symmetrically the patient's "order" screen already shows at the CMA-led
 * "closeout" one beat before the patient properly leads "order" themselves.
 * Checking only "differs from the previous beat" catches the second shape
 * (closeout's "order" differs from the prior beat's "signing") but wrongly
 * calls it meaningful; checking both neighbors rules it out, because "order"
 * is unchanged into the very next beat, where it is genuinely theirs.
 *
 * Mirrors the shape of `mirrorHandoffAt`'s own distinctness check (which
 * looks only forward, at `i + 1`, since it is deciding whether to reveal
 * something NEW): here the question is "is `i` already the right beat for
 * this role", so both directions matter — the same content already showing
 * one step earlier or about to show one step later both mean `i` is not the
 * beat's own distinct home for this role.
 */
function hasMeaningfulScreenAt(i: number, role: Role): boolean {
  const beat = BEATS[clamp(i)];
  if (beat.lead === role) return true;
  return screenFor(i, role) !== screenFor(i - 1, role) && screenFor(i, role) !== screenFor(i + 1, role);
}

/**
 * The beat to land on when the CHROME switches the viewer to a role (a role
 * tab or the mobile sheet — the one legitimate cross-persona control besides
 * guided Next/Back).
 *
 * `setRole` used to leave the shared beat pointer untouched. That is fine
 * while walking forward together, but a role can also get AHEAD of another:
 * solo-walking the CMA with the chrome's own Next reaches "closeout" without
 * ever landing on "signing" (her own screen is unchanged across
 * choose/checkout, both patient-led — see `nextBeatForRole`). Switching to
 * the patient's tab from there left the pointer at "closeout", so the
 * patient's "Sign & authorize" — the one beat the spec is explicit Alex signs
 * on his own phone — was never shown for either persona (owner, 2026-09-01).
 *
 * A first fix landed on the LATEST beat this role LEADS at-or-before the
 * current position. That solved the case above, but "leads" is too strict a
 * test: the CMA has a perfectly good screen of her own at the patient-led
 * "signing" beat (the contract mirror) — she just does not lead it. Rewinding
 * past a beat where the new role already has a meaningful screen overshoots:
 * clicking the CMA tab while sitting on "signing" landed on "tryon", three
 * beats back, hiding the very mirror she was just shown (owner, 2026-09-01).
 *
 * The corrected rule: land on the LATEST beat at-or-before `from` where this
 * role has a MEANINGFUL screen (`hasMeaningfulScreenAt`) — they lead it, or
 * their own screen there is a genuine one-beat appearance, not shared/early
 * content they own themselves elsewhere. This still only ever moves the
 * pointer BACKWARD (or leaves it put): before this role has anything
 * meaningful yet, there is nothing to catch up on, so the pointer stays at
 * `from` rather than jumping ahead — jumping forward would spoil beats the
 * guided story has not reached yet (e.g. switching to the CMA at the very
 * first beat must show her day as it is now, not fast-forward to
 * "cma-enroute"). A role with nothing meaningful anywhere (the operator, by
 * design — his one dashboard screen never counts as distinct from its
 * neighbors) also leaves the pointer where it is.
 */
export function beatForRoleSwitch(role: Role, from: number): number {
  for (let i = from; i >= 0; i--) {
    if (hasMeaningfulScreenAt(i, role)) return i;
  }
  return from;
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

/**
 * Whether beat `i` is a passive-mirror hand-over point for `role`: `role`
 * does not lead it, but the beat is worth pausing on because `role`'s own
 * screen there is a genuine one-beat appearance of someone else's act — not
 * a beat `role` merely passes through unchanged. Two conditions, and BOTH
 * must hold:
 *
 *   1. `role` does not lead beat `i` — someone else does, so `role`'s own
 *      screen there is necessarily a mirror of their act, not `role`'s own.
 *   2. `role`'s own screen at `i` differs from `role`'s own screen at the
 *      very next FULL beat (`i + 1`). This is what separates a genuinely
 *      distinct, one-beat-only mirror (the contract signing: `cma-signing`
 *      appears at exactly this beat, then moves on to `cma-activate`) from a
 *      beat whose screen for `role` is really just an early, shared
 *      appearance of the SAME screen `role` properly owns one beat later
 *      (e.g. the CMA's device shortlist screen already shows while the
 *      audiologist nominally still leads, then stays on screen, unchanged,
 *      once the CMA's own lead beat begins) — firing on the shared-screen
 *      case would hand off before `role` ever reaches their own later beats.
 *
 * This is a fact about the SCRIPT at a beat, for any viewer sitting on it —
 * nothing here depends on solo-walk membership or which mode the viewer is
 * in, so it is the one shared primitive both `soloHandoffAt` (below, which
 * layers two more solo-walk-specific conditions on top) and guided mode's
 * own `next()` (`story-context.tsx`) consult, rather than each re-deriving
 * an equivalent check.
 *
 * Returns the beat's lead role to hand over to, landing on the SAME beat
 * index `i`, or `null` when there is nothing to hand over.
 */
export function mirrorHandoffAt(i: number, role: Role): Role | null {
  const beat = BEATS[clamp(i)];
  const lead = beat.lead;
  if (lead === role) return null;
  if (screenFor(i, role) === screenFor(i + 1, role)) return null;
  return lead;
}

/**
 * Whether the chrome's solo-mode Next should HAND OVER to another persona
 * at beat `i`, rather than continue walking `role`'s own beats.
 *
 * Two rules are in tension at a beat like this (owner, 2026-09-01): an
 * IN-SCREEN button must never switch persona (`advanceInRole` — untouched by
 * this function), but the chrome's Next is explicitly allowed to, because
 * that is how a cross-persona handoff gets demonstrated at all. The bug this
 * resolves: solo-walking the CMA past the beat where her own screen is a
 * read-only mirror of a patient-led act skipped straight to her NEXT beat,
 * so the patient's own screen for that act — the whole point of the beat —
 * was never shown to either persona (`nextBeatForRole` alone cannot know
 * this; it only ever walks `role`'s own screen changes).
 *
 * `i` is a hand-over point for `role` when `mirrorHandoffAt(i, role)` fires
 * (role does not lead `i`, and their screen there is a genuine one-beat
 * appearance — see that function), AND, specific to a SOLO walk:
 *   3. `i` is not `role`'s walk-start (`beatsForRole(role)[0]`, always beat
 *      0). At the very start `role` has not begun their story yet, so there
 *      is nothing of theirs to "resume" — firing here would eject a viewer
 *      who just chose to enter as this persona before their walk even
 *      begins, breaking the per-persona solo walk entirely.
 *   4. `role`'s OWN next walk-stop after `i` is led by `role` again. This is
 *      what separates a single sandwiched aside (hand over: role has
 *      nothing further to do right here, and is about to resume leading
 *      right after) from an extended passive stretch where role legitimately
 *      keeps watching several more beats led by others in a row — e.g. the
 *      patient watching the CMA's whole home-visit exam unfold on his own
 *      phone, beat after beat. That must stay a normal, uninterrupted solo
 *      walk: a cascade of handoffs there would eject the viewer from the
 *      persona they chose after a single press.
 *
 * Returns the beat's lead role to hand over to, landing on the SAME beat
 * index `i` — the lead's own screen for the beat already on display, not a
 * beat further along — or `null` when solo Next should proceed normally via
 * `nextBeatForRole`. Pure and framework-free like the rest of this file, so
 * `story-context.tsx`'s `next()` can call it directly and set `handoff` from
 * the result, the same mechanism guided mode already uses to announce a role
 * change rather than let it happen silently.
 */
export function soloHandoffAt(i: number, role: Role): Role | null {
  const lead = mirrorHandoffAt(i, role);
  if (!lead) return null;
  const walk = beatsForRole(role);
  if (walk[0] === i || !walk.includes(i)) return null;
  const resumed = nextBeatForRole(i, role);
  if (resumed === i || BEATS[resumed].lead !== role) return null;
  return lead;
}
