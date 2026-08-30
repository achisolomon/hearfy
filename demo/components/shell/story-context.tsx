"use client";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import {
  BEATS,
  beatForScreen,
  beatsForRole,
  firstBeatOfStage,
  isLastBeat,
  nextBeat,
  nextBeatForRole,
  prevBeat,
  prevBeatForRole,
  screenFor,
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
  screen: AnyScreenId;
  stage: StageNumber;
  setRole: (r: Role) => void;
  goToStage: (s: StageNumber) => void;
  /** Guided "Next": advances one beat and follows the lead role at handoffs. */
  next: () => void;
  back: () => void;
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

  const setRole = useCallback((r: Role) => {
    setRoleState(r);
    setHandoff(null);
  }, []);

  const goToStage = useCallback((s: StageNumber) => {
    const i = firstBeatOfStage(s);
    setBeat(i);
    setPhase("journey");
    // Follow the stage's lead role so the chip lands on a meaningful view.
    setRoleState(BEATS[i].lead);
  }, []);

  const next = useCallback(() => {
    setBeat(current => {
      // Solo: walk only this role's own beats; never switch role.
      if (mode === "solo") {
        const i = nextBeatForRole(current, role);
        if (i === current) setPhase("endcap");
        return i;
      }
      if (isLastBeat(current)) {
        setPhase("endcap");
        return current;
      }
      const i = nextBeat(current);
      const lead = BEATS[i].lead;
      // Guided mode auto-switches the viewer's role at handoffs.
      setRoleState(previous => {
        if (previous !== lead) setHandoff(lead);
        return lead;
      });
      return i;
    });
  }, [mode, role]);

  const back = useCallback(() => {
    setBeat(current => mode === "solo" ? prevBeatForRole(current, role) : prevBeat(current));
  }, [mode, role]);

  const goToScreen = useCallback((screen: AnyScreenId) => {
    setBeat(current => {
      const i = beatForScreen(role, screen);
      // A screen outside the script leaves the pointer where it is.
      return i === -1 ? current : i;
    });
  }, [role]);

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
    screen: screenFor(beat, role),
    stage: BEATS[beat].stage,
    setRole,
    goToStage,
    next,
    back,
    goToScreen,
    start,
    startAs,
    restart,
    exploreFreely,
    clearHandoff,
  }), [beat, role, phase, mode, handoff, setRole, goToStage, next, back, goToScreen, start, startAs, restart, exploreFreely, clearHandoff]);

  return <StoryContext.Provider value={value}>{children}</StoryContext.Provider>;
}

export function useStory(): StoryValue {
  const v = useContext(StoryContext);
  if (!v) throw new Error("useStory must be used inside <StoryProvider>");
  return v;
}
