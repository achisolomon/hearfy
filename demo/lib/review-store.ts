"use client";
import { useSyncExternalStore } from "react";
import { NO_REVIEW, markReview, type ReviewMark, type ReviewState, type ReviewableId } from "./clearance";

/**
 * Dr. Reed's pre-test review, held where every role can see it.
 *
 * The decision is hers, but the CONSEQUENCE is everyone's: when she flags a
 * critical issue, Maya must be told to stop and Alex must be told he is being
 * referred. Held in `useState` on her screen, the flag would die the moment the
 * viewer switched personas — the story shell unmounts and remounts a screen on
 * every navigation — so the CMA and patient screens would cheerfully carry on
 * into the hearing test she had just stopped. That is precisely the failure
 * this whole gate exists to prevent, so the state cannot live in a component.
 *
 * Same shape and lifetime rules as `lib/latch.ts` (see its doc): a module-level
 * store read through `useSyncExternalStore`, with an SSR snapshot that matches
 * a fresh page, and a reset so a second walkthrough in front of an audience
 * does not begin already-decided. It is not a `Latch` only because a latch is
 * one-way and boolean, while this carries three states per check and she is
 * allowed to revise a mark before she signs.
 */
let state: ReviewState = NO_REVIEW;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());

export const reviewStore = {
  get: () => state,
  set: (id: ReviewableId, mark: ReviewMark) => { state = markReview(state, id, mark); emit(); },
  /** Back to undecided, for the start of a fresh walkthrough. */
  reset: () => { state = NO_REVIEW; emit(); },
  subscribe: (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; },
};

/** Read the review from a component, re-rendering it on change. */
export function useReview(): ReviewState {
  return useSyncExternalStore(reviewStore.subscribe, reviewStore.get, () => NO_REVIEW);
}
