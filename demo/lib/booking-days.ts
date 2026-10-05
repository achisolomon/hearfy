import { useSyncExternalStore } from "react";

/**
 * The visit days offered on "Choose a day", and the patient's pick.
 *
 * The picker used to be a frozen "Tue May 20 … Mon May 26", so the demo
 * offered dates months in the past (owner, 2026-10-05). It now always offers
 * the next six weekdays starting tomorrow — no Saturday or Sunday visits.
 *
 * The pick lives outside React for the same reason as lib/selection: each
 * booking screen remounts on navigation, and Choose a time, Payment and
 * Confirmed all have to show the day the patient actually chose.
 */
export const BOOKING_DAY_COUNT = 6;

export function bookingDays(today: Date = new Date(), count = BOOKING_DAY_COUNT): Date[] {
  const days: Date[] = [];
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  while (days.length < count) {
    d.setDate(d.getDate() + 1);
    const wd = d.getDay();
    if (wd !== 0 && wd !== 6) days.push(new Date(d));
  }
  return days;
}

const fmt = (d: Date, o: Intl.DateTimeFormatOptions) => d.toLocaleDateString("en-US", o);
/** "Tue\nOct 6" — the picker tile. */
export const dayLabel = (d: Date) => `${fmt(d, { weekday: "short" })}\n${fmt(d, { month: "short", day: "numeric" })}`;
/** "Tue, Oct 6" — the Payment summary line. */
export const dayShort = (d: Date) => fmt(d, { weekday: "short", month: "short", day: "numeric" });
/** "Tuesday, Oct 6" — screen headers. */
export const dayLong = (d: Date) => `${fmt(d, { weekday: "long" })}, ${fmt(d, { month: "short", day: "numeric" })}`;
/** "Oct 6, 2026" — the .ics fixture format lib/calendar parses. */
export const dayFull = (d: Date) => fmt(d, { month: "short", day: "numeric", year: "numeric" });

// Index into bookingDays(); 1 keeps the old default of the second tile.
let selected = 1;
const listeners = new Set<() => void>();
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
const get = () => selected;

export function selectBookingDay(i: number) {
  selected = i;
  listeners.forEach(l => l());
}

/** The chosen day's index, reactive. */
export function useBookingDayIndex() {
  return useSyncExternalStore(subscribe, get, get);
}

/** The chosen day as a Date, reactive. */
export function useBookingDay(): Date {
  return bookingDays()[useBookingDayIndex()];
}
