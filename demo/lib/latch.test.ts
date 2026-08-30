import { describe, expect, it } from "vitest";
import { createLatch, resetAllLatches } from "./latch";

/**
 * `use()` is the React binding and is exercised by the screens. What matters
 * here is the store underneath it: a latch stays raised across the remounts the
 * shell performs, and comes back down for a fresh walkthrough.
 */
describe("latch", () => {
  it("starts down", () => {
    expect(createLatch().get()).toBe(false);
  });

  it("stays raised once set, so a remount cannot un-sign the report", () => {
    const latch = createLatch();
    latch.set();
    latch.set();
    expect(latch.get()).toBe(true);
  });

  it("notifies subscribers when raised and when reset, and stops after unsubscribe", () => {
    const latch = createLatch();
    let notifications = 0;
    const unsubscribe = latch.subscribe(() => { notifications += 1; });

    latch.set();
    expect(notifications).toBe(1);

    latch.reset();
    expect(notifications).toBe(2);

    unsubscribe();
    latch.set();
    expect(notifications).toBe(2);
  });

  it("keeps latches independent — signing the report does not lock the prescription", () => {
    const signed = createLatch();
    const locked = createLatch();

    signed.set();

    expect(signed.get()).toBe(true);
    expect(locked.get()).toBe(false);
  });

  it("resets every latch, so a second walkthrough starts unsigned", () => {
    const signed = createLatch();
    const locked = createLatch();
    signed.set();
    locked.set();

    resetAllLatches();

    expect(signed.get()).toBe(false);
    expect(locked.get()).toBe(false);
  });
});
