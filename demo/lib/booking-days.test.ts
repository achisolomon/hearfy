import { describe, expect, it } from "vitest";
import { bookingDays, dayLabel, dayLong, dayFull } from "./booking-days";

// Local-time constructor: month is 0-indexed. 2026-10-05 is a Monday.
const on = (y: number, m: number, d: number) => new Date(y, m - 1, d, 16, 49);
const iso = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

describe("bookingDays", () => {
  // Owner, 2026-10-05: "Choose a day" showed a frozen Tue May 20 – Mon May 26.
  // It must always offer the next six weekdays, starting tomorrow.
  it("starts tomorrow and offers six weekdays", () => {
    expect(bookingDays(on(2026, 10, 5)).map(iso)).toEqual([
      "2026-10-6", "2026-10-7", "2026-10-8", "2026-10-9", "2026-10-12", "2026-10-13",
    ]);
  });

  it("never offers a Saturday or Sunday, whatever today is", () => {
    for (let d = 1; d <= 14; d++) {
      const days = bookingDays(on(2026, 10, d));
      expect(days).toHaveLength(6);
      for (const day of days) expect([0, 6]).not.toContain(day.getDay());
      expect(days[0].getTime()).toBeGreaterThan(on(2026, 10, d).getTime());
    }
  });

  it("skips the weekend when today is Friday, Saturday or Sunday", () => {
    expect(iso(bookingDays(on(2026, 10, 9))[0])).toBe("2026-10-12");
    expect(iso(bookingDays(on(2026, 10, 10))[0])).toBe("2026-10-12");
    expect(iso(bookingDays(on(2026, 10, 11))[0])).toBe("2026-10-12");
  });

  it("crosses month and year boundaries", () => {
    expect(bookingDays(on(2026, 12, 30)).map(iso)).toEqual([
      "2026-12-31", "2027-1-1", "2027-1-4", "2027-1-5", "2027-1-6", "2027-1-7",
    ]);
  });
});

describe("day formats", () => {
  const tue = on(2026, 10, 6);
  it("renders the picker, header and calendar forms", () => {
    expect(dayLabel(tue)).toBe("Tue\nOct 6");
    expect(dayLong(tue)).toBe("Tuesday, Oct 6");
    expect(dayFull(tue)).toBe("Oct 6, 2026");
  });
});

describe("booking screens", () => {
  // The bug was literal dates in the screen source. Pin that none return.
  it("hardcode no calendar date — every day comes from bookingDays()", async () => {
    const { readFileSync } = await import("node:fs");
    const src = readFileSync(new URL("../components/screens/patient/booking.tsx", import.meta.url), "utf8");
    expect(src).not.toMatch(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.? \d{1,2}\b/);
  });
});
