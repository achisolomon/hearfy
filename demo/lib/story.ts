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
  // Collapsed from nine beats to four (decided 2026-08-30). The guided story
  // hits the fork, the safety gate, the money and the confirmation; the five
  // skipped screens (intake-needs, intake-coverage, intake-plan, book-date,
  // book-time) stay fully reachable by free navigation and in solo patient
  // mode. Nothing is deleted — the guided path just stops narrating all nine
  // before the four-role story starts.
  { id: "intake-for", stage: 2, lead: "patient",
    screens: { patient: "intake-for", cma: "cma-day", audiologist: "aud-panel", operator: "op-dashboard" } },
  { id: "intake-medical", stage: 2, lead: "patient",
    screens: { patient: "intake-medical", cma: "cma-day", audiologist: "aud-panel", operator: "op-dashboard" } },
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
  { id: "stock", stage: 8, lead: "cma",
    screens: { patient: "compare", cma: "cma-stock", audiologist: "aud-prescription", operator: "op-dashboard" } },
  { id: "tryon", stage: 8, lead: "cma",
    screens: { patient: "compare", cma: "cma-tryon", audiologist: "aud-prescription", operator: "op-dashboard" } },
  { id: "checkout", stage: 8, lead: "patient",
    screens: { patient: "checkout", cma: "cma-tryon", audiologist: "aud-prescription", operator: "op-dashboard" } },
  { id: "activate", stage: 8, lead: "cma",
    screens: { patient: "checkout", cma: "cma-activate", audiologist: "aud-prescription", operator: "op-dashboard" } },

  // ---- Stage 9: Fulfilment & follow-up ----
  { id: "closeout", stage: 9, lead: "cma",
    screens: { patient: "order", cma: "cma-closeout", audiologist: "aud-panel", operator: "op-dashboard" } },
  { id: "order", stage: 9, lead: "patient",
    screens: { patient: "order", cma: "cma-day", audiologist: "aud-panel", operator: "op-dashboard" } },
  { id: "support", stage: 9, lead: "patient",
    screens: { patient: "support", cma: "cma-day", audiologist: "aud-panel", operator: "op-dashboard" } },
];
