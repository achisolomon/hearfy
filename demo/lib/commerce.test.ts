import { describe, expect, it } from "vitest";
import { creditedFirstMonth, monthlyFor, tierFor, VISIT_FEE } from "./commerce";

describe("visit-fee credit", () => {
  it("credits the full visit fee against the first month", () => {
    // Essential is exactly the visit fee, so month 1 costs nothing more.
    expect(creditedFirstMonth("essential")).toEqual({ monthly: 99, credit: 99, dueNow: 0 });
  });

  it("credits the same $99 against a more expensive tier", () => {
    // A VIP patient gets $99 off $299 — not a free month.
    expect(creditedFirstMonth("vip")).toEqual({ monthly: 299, credit: 99, dueNow: 200 });
  });

  it("credits the middle tier correctly", () => {
    expect(creditedFirstMonth("premium")).toEqual({ monthly: 149, credit: 99, dueNow: 50 });
  });

  it("never returns a negative amount due", () => {
    expect(creditedFirstMonth("essential").dueNow).toBeGreaterThanOrEqual(0);
  });

  it("looks up monthly price by tier id", () => {
    expect(monthlyFor("premium")).toBe(149);
  });

  it("falls back to the entry tier for an unknown id", () => {
    expect(tierFor("nope").id).toBe("essential");
    expect(monthlyFor("nope")).toBe(VISIT_FEE);
  });
});
