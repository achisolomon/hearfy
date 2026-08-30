import { useSyncExternalStore } from "react";

/**
 * A one-way flag that outlives the component reading it.
 *
 * The clinical gates — signing the report, locking the prescription — assert
 * that they are irreversible. But the story shell unmounts and remounts a
 * screen whenever the viewer moves between beats, so a flag held in `useState`
 * would quietly reset, and a report the UI calls immutable would un-sign
 * itself. Holding it here instead keeps the claim honest.
 *
 * `reset` exists for the other end of that lifetime: the latch must NOT outlive
 * the walkthrough. The demo is walked repeatedly in front of an audience, and a
 * second run that started already-signed would skip the signing beat entirely.
 * The cover screen resets every latch as each fresh run begins.
 */
export interface Latch {
  /** Raise the flag. One-way for the life of a walkthrough. */
  set: () => void;
  /** Lower it again, for the start of a fresh walkthrough. */
  reset: () => void;
  /** Current value, without React. */
  get: () => boolean;
  /** Subscribe to changes; returns the unsubscribe. */
  subscribe: (listener: () => void) => () => void;
  /** Read the flag from a component, re-rendering it on change. */
  use: () => boolean;
}

const allLatches = new Set<Latch>();

export function createLatch(): Latch {
  let value = false;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach(l => l());

  const get = () => value;
  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  };

  const latch: Latch = {
    set: () => { value = true; emit(); },
    reset: () => { value = false; emit(); },
    get,
    subscribe,
    // The server render and the client's first paint must agree, and a fresh
    // page always starts un-latched.
    use: () => useSyncExternalStore(subscribe, get, () => false),
  };

  allLatches.add(latch);
  return latch;
}

/** Clear every latch, so a fresh walkthrough starts from an unsigned report. */
export function resetAllLatches() {
  allLatches.forEach(l => l.reset());
}
