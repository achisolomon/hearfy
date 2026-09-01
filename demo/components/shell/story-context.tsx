"use client";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import {
  BEATS,
  beatForRoleSwitch,
  beatForScreenNear,
  beatsForRole,
  firstBeatOfStage,
  isLastBeat,
  nextBeat,
  nextBeatForRole,
  prevBeat,
  prevBeatForRole,
  screenFor,
  soloHandoffAt,
  type AnyScreenId,
  type Role,
  type StageNumber,
} from "@/lib/story";

/** Cover → the journey → end-cap. */
export type Phase = "cover" | "journey" | "endcap";

/**
 * Guided = the beat script drives, switching roles at handoffs (the pitch).
 * Solo   = entered as one persona; Next walks only that role's beats and the
 *          role never switches out from under the viewer.
 */
export type Mode = "guided" | "solo";

interface StoryValue {
  beat: number;
  role: Role;
  phase: Phase;
  mode: Mode;
  /** Set when guided mode just switched roles, so the interstitial can announce it. */
  handoff: Role | null;
  /**
   * Solo mode only: this persona has no further beats. Their story is over,
   * but the demo is not — the viewer can still switch role or jump stages.
   */
  atWalkEnd: boolean;
  screen: AnyScreenId;
  stage: StageNumber;
  setRole: (r: Role) => void;
  goToStage: (s: StageNumber) => void;
  /** Guided "Next": advances one beat and follows the lead role at handoffs. */
  next: () => void;
  back: () => void;
  /**
   * In-screen forward: a button on the persona's OWN device.
   *
   * Moves along this role's own walk and never assigns `role`, in BOTH modes.
   * The chrome's `next()` owns handoffs; a click inside a device must not
   * change who the viewer is (owner, 2026-09-01: tapping "Simulate visit day"
   * on Alex's phone rendered Maya's tablet).
   */
  advanceInRole: () => void;
  /** Free navigation inside a role — moves the shared pointer to that screen's beat. */
  goToScreen: (screen: AnyScreenId) => void;
  start: () => void;
  /** Enter as one persona and stay there. */
  startAs: (r: Role) => void;
  restart: () => void;
  exploreFreely: () => void;
  clearHandoff: () => void;
}

const StoryContext = createContext<StoryValue | null>(null);

export function StoryProvider({ children }: { children: React.ReactNode }) {
  const [beat, setBeat] = useState(0);
  const [role, setRoleState] = useState<Role>("patient");
  const [phase, setPhase] = useState<Phase>("cover");
  const [mode, setMode] = useState<Mode>("guided");
  const [handoff, setHandoff] = useState<Role | null>(null);

  /**
   * Picking a role by hand leaves solo mode. Someone who entered as one
   * persona and then deliberately switched is browsing, not walking that
   * persona's story — staying in solo would strand them in a mode whose
   * Next walks a different role's beats than the one on screen.
   *
   * The beat pointer moves too, via `beatForRoleSwitch`: a role's own solo
   * walk can get ahead of another role's story (e.g. the CMA's own beats
   * skip straight past the patient-led "signing" beat — see that function's
   * doc comment), so switching to a role must never leave the pointer past a
   * beat that role has not been shown yet. Guided mode walking forward
   * together is unaffected — the pointer is already at a beat this role
   * leads whenever guided `next()`/`back()` hand off, so the switch is a
   * no-op then.
   */
  const setRole = useCallback((r: Role) => {
    setRoleState(r);
    setBeat(b => beatForRoleSwitch(r, b));
    setMode("guided");
    setHandoff(null);
  }, []);

  const goToStage = useCallback((s: StageNumber) => {
    const i = firstBeatOfStage(s);
    setBeat(i);
    setPhase("journey");
    // In solo mode the viewer chose a persona: jumping stages moves time, not
    // identity. Only guided mode follows the stage's lead role.
    if (mode !== "solo") setRoleState(BEATS[i].lead);
  }, [mode]);

  /**
   * Every branch computes the target beat first, then dispatches. Calling a
   * setter from inside another setter's updater would fire twice under
   * StrictMode's double-invocation — harmless only while every such call
   * happens to be idempotent, which is not a property worth depending on.
   */
  const next = useCallback(() => {
    // Solo: walk only this role's own beats; never switch role — EXCEPT at a
    // beat whose entire purpose is another persona acting while the current
    // persona is explicitly a passive mirror (soloHandoffAt, lib/story.ts).
    // There, the chrome's Next follows the story like guided mode does: hand
    // over to that beat's lead so their own screen for THIS beat is actually
    // shown, and announce the switch via `handoff` rather than let it happen
    // silently. This is the chrome's call to make, not an in-screen button's
    // — `advanceInRole` below still never reassigns role.
    //
    // Reaching the end of one persona's walk is NOT the end of the demo —
    // the operator's dashboard is ambient, so their walk is a single beat,
    // and ending the whole demo on one click would read as broken.
    if (mode === "solo") {
      const handoffTo = soloHandoffAt(beat, role);
      if (handoffTo) {
        setHandoff(handoffTo);
        setRoleState(handoffTo);
        return;
      }
      setBeat(nextBeatForRole(beat, role));
      return;
    }
    if (isLastBeat(beat)) {
      setPhase("endcap");
      return;
    }
    const i = nextBeat(beat);
    const lead = BEATS[i].lead;
    // Guided mode auto-switches the viewer's role at handoffs.
    if (role !== lead) setHandoff(lead);
    setRoleState(lead);
    setBeat(i);
  }, [beat, mode, role]);

  /**
   * The mirror of `next`. The screen is `screenFor(beat, role)`, so moving the
   * pointer alone does not undo a step that also switched role: the earlier
   * beat would render through the persona adopted at the handoff, showing a
   * screen the viewer was never on. Guided Back therefore restores the landing
   * beat's lead, exactly as Next adopts the departing beat's.
   *
   * Solo mode keeps the chosen persona on purpose — there the role is the
   * viewer's identity, not the script's, and `prevBeatForRole` already walks
   * only that role's own beats.
   */
  const back = useCallback(() => {
    if (mode === "solo") {
      setBeat(prevBeatForRole(beat, role));
      return;
    }
    const i = prevBeat(beat);
    const lead = BEATS[i].lead;
    // Stepping back into another persona's stretch is a handoff too; announcing
    // it keeps the role change from happening silently under the viewer.
    if (role !== lead) setHandoff(lead);
    setRoleState(lead);
    setBeat(i);
  }, [beat, mode, role]);

  const advanceInRole = useCallback(() => {
    setBeat(nextBeatForRole(beat, role));
  }, [beat, role]);

  const goToScreen = useCallback((screen: AnyScreenId) => {
    // Nearest role-led occurrence, not first-in-script: Back from the
    // patient's Support screen must land on the order beat, not the CMA-led
    // close-out that happens to show the same screen (see lib/story.ts).
    const i = beatForScreenNear(role, screen, beat);
    // A screen outside the script leaves the pointer where it is.
    if (i !== -1) setBeat(i);
  }, [role, beat]);

  const start = useCallback(() => {
    setBeat(0);
    setRoleState(BEATS[0].lead);
    setMode("guided");
    setPhase("journey");
  }, []);

  /** Per-persona entry: start at that role's first beat and stay in role. */
  const startAs = useCallback((r: Role) => {
    const beats = beatsForRole(r);
    setBeat(beats[0] ?? 0);
    setRoleState(r);
    setMode("solo");
    setPhase("journey");
    setHandoff(null);
  }, []);

  const restart = useCallback(() => {
    setBeat(0);
    setRoleState(BEATS[0].lead);
    setMode("guided");
    setPhase("cover");
  }, []);

  const exploreFreely = useCallback(() => setPhase("journey"), []);
  const clearHandoff = useCallback(() => setHandoff(null), []);

  const value = useMemo<StoryValue>(() => ({
    beat,
    role,
    phase,
    mode,
    handoff,
    atWalkEnd: mode === "solo" && nextBeatForRole(beat, role) === beat,
    screen: screenFor(beat, role),
    stage: BEATS[beat].stage,
    setRole,
    goToStage,
    next,
    back,
    advanceInRole,
    goToScreen,
    start,
    startAs,
    restart,
    exploreFreely,
    clearHandoff,
  }), [beat, role, phase, mode, handoff, setRole, goToStage, next, back, advanceInRole, goToScreen, start, startAs, restart, exploreFreely, clearHandoff]);

  return <StoryContext.Provider value={value}>{children}</StoryContext.Provider>;
}

export function useStory(): StoryValue {
  const v = useContext(StoryContext);
  if (!v) throw new Error("useStory must be used inside <StoryProvider>");
  return v;
}

/**
 * Non-throwing variant of `useStory`, for components mounted on trees that
 * are not always beneath `<StoryProvider>` (e.g. `Shell`). Returns `null`
 * instead of throwing when there is no provider above.
 */
export function useStoryOptional(): StoryValue | null {
  return useContext(StoryContext);
}
