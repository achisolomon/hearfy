/**
 * Whether the intake screen shows its "routed to review" diversion.
 *
 * Two facts decide it, and they pull in opposite directions:
 *
 *  - `everFlagged` — a red-flag symptom was selected at some point. Held in a
 *    latch so it survives the story shell's remount on every navigation, the
 *    same way consult.tsx keeps its lock outside useState.
 *  - `dismissed` — the viewer pressed "Go back and change my answer" on THIS
 *    mount, deliberately stepping out of a diversion the latch still remembers.
 *
 * The bug this module exists to prevent: `dismissed` used to be sticky for the
 * life of the mount, so after one back-out every later symptom click was a dead
 * button — the latch said "flagged", the dismissal said "no", and the dismissal
 * always won. Selecting a symptom is a NEW answer, so it clears the dismissal;
 * only a dismissal that is newer than the last selection suppresses the screen.
 */
export interface RedFlagState {
  /** A red-flag symptom was selected during this walkthrough. */
  everFlagged: boolean;
  /** The viewer backed out of the diversion since that selection. */
  dismissed: boolean;
}

export const NO_RED_FLAG: RedFlagState = { everFlagged: false, dismissed: false };

/** Show the diversion when a flag stands un-dismissed. */
export function showsDiversion(s: RedFlagState): boolean {
  return s.everFlagged && !s.dismissed;
}

/**
 * The viewer selected a red-flag symptom. This is a fresh answer, so it
 * outranks any earlier "go back" — otherwise the option becomes unclickable.
 */
export function selectRedFlag(s: RedFlagState): RedFlagState {
  return { ...s, everFlagged: true, dismissed: false };
}

/** The viewer backed out to change their answer. The flag itself is remembered. */
export function dismissDiversion(s: RedFlagState): RedFlagState {
  return { ...s, dismissed: true };
}
