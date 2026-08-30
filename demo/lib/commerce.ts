/**
 * The commercial model (spec §9a).
 *
 * The $99 visit fee is a DEPOSIT against the first month of membership:
 * buy a device and the fee becomes month 1, so the visit was effectively free.
 * Decline and the $99 stays what it was — the fee for the visit.
 */
import { tiers, visitFee } from "./mock-data";

export const VISIT_FEE = visitFee;

export interface Tier {
  id: string;
  name: string;
  monthly: number;
  care: string;
}

/** The tier for an id, falling back to the entry tier rather than throwing. */
export function tierFor(id: string): Tier {
  return tiers.find(t => t.id === id) ?? tiers[0];
}

export function monthlyFor(id: string): number {
  return tierFor(id).monthly;
}

export interface FirstMonth {
  monthly: number;
  credit: number;
  /** What the patient actually pays today, never below zero. */
  dueNow: number;
}

/**
 * Month 1 with the visit fee credited. The credit is the fee, not the tier
 * price, so a VIP patient sees $99 off $299 rather than a free month.
 */
export function creditedFirstMonth(tierId: string): FirstMonth {
  const monthly = monthlyFor(tierId);
  const credit = Math.min(VISIT_FEE, monthly);
  return { monthly, credit, dueNow: Math.max(0, monthly - credit) };
}
