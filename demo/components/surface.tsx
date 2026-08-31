"use client";
import { createContext, useContext } from "react";

/**
 * Which ground the current screen sits on.
 *
 * `Shell` has always had a `dark` prop (the navy dispatch and call screens:
 * assigned, driving, arrived, live), but nothing downstream could see it.
 * PageHeader hardcoded `text-brand-navy` for its title and PrimaryButton
 * hardcoded a navy fill, so on those four screens the title rendered navy on
 * navy — invisible — and the primary action was a navy button on a navy
 * ground. Found by walking the journey at 390px on 2026-08-31.
 *
 * Passing a `dark` prop down through every call site would mean touching each
 * screen and trusting each to remember. The ground is a property of the
 * surface, not of each component's call site, so `Shell` publishes it once
 * and the shared components read it. A screen rendered outside any Shell
 * (the demo shell's own chrome) gets "light", which is what it had before.
 */
export type Surface = "light" | "dark";

const SurfaceContext = createContext<Surface>("light");

export const SurfaceProvider = SurfaceContext.Provider;

/** The ground the calling component is rendering on. */
export function useSurface(): Surface {
  return useContext(SurfaceContext);
}

/** True when the calling component sits on the navy ground. */
export function useOnDark(): boolean {
  return useContext(SurfaceContext) === "dark";
}
