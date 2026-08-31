import { useSyncExternalStore } from "react";

/**
 * The signing of the membership contract, held outside React and SHARED
 * between two roles (refined 2026-08-31): the PATIENT reviews the contract,
 * accepts the terms, authorizes the card and signs — on their own phone.
 * The CMA's screen only mirrors those inputs as they land; it can approve
 * nothing on the patient's behalf.
 *
 * Same store pattern as lib/selection: the story shell remounts screens on
 * every beat change, and this state must survive the patient→CMA handoff
 * that follows the signature.
 */
export interface SigningState {
  contract: boolean;
  terms: boolean;
  card: boolean;
  signed: boolean;
}

const UNSIGNED: SigningState = { contract: false, terms: false, card: false, signed: false };

let state: SigningState = UNSIGNED;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());

const get = () => state;
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};

/** Every approval the patient must give before the signature unlocks. */
export const SIGNING_ITEMS: [keyof Omit<SigningState, "signed">, string][] = [
  ["contract", "Membership contract reviewed"],
  ["terms", "Terms & agreement accepted"],
  ["card", "Card authorized for monthly billing"],
];

export function canSign(s: SigningState): boolean {
  return s.contract && s.terms && s.card;
}

/** The patient toggles one approval. Approvals reopen; a signature does not. */
export function toggleSigningItem(key: keyof Omit<SigningState, "signed">) {
  if (state.signed) return; // Nothing reopens under a signature.
  state = { ...state, [key]: !state[key] };
  emit();
}

/** The patient signs — only once every approval is given, and one-way. */
export function sign() {
  if (!canSign(state) || state.signed) return;
  state = { ...state, signed: true };
  emit();
}

/** A fresh walkthrough starts unsigned (called from the cover, like the latches). */
export function resetSigning() {
  state = UNSIGNED;
  emit();
}

/** Current state, without React — for tests and imperative reads. */
export function signingState(): SigningState {
  return state;
}

/** Read the signing state from a component, re-rendering it on change. */
export function useSigning(): SigningState {
  // The server render and the client's first paint must agree, and a fresh
  // page always starts unsigned.
  return useSyncExternalStore(subscribe, get, () => UNSIGNED);
}
