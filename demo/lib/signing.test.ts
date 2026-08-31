import { beforeEach, describe, expect, it } from "vitest";
import { SIGNING_ITEMS, canSign, resetSigning, sign, signingState, toggleSigningItem } from "./signing";

// The store is module-level on purpose (it must survive screen remounts and
// the patient→CMA handoff), so every test starts from a fresh walkthrough.
beforeEach(resetSigning);

describe("signing store (item 12, refined: the patient signs)", () => {
  it("starts a walkthrough fully unapproved and unsigned", () => {
    expect(signingState()).toEqual({ contract: false, terms: false, card: false, signed: false });
  });

  it("names exactly the three approvals the sheet requires", () => {
    expect(SIGNING_ITEMS.map(([k]) => k)).toEqual(["contract", "terms", "card"]);
  });

  it("refuses the signature until every approval is given", () => {
    sign();
    expect(signingState().signed).toBe(false);
    toggleSigningItem("contract");
    toggleSigningItem("terms");
    sign(); // card still missing
    expect(signingState().signed).toBe(false);
    toggleSigningItem("card");
    expect(canSign(signingState())).toBe(true);
    sign();
    expect(signingState().signed).toBe(true);
  });

  it("lets the patient change their mind before signing", () => {
    toggleSigningItem("terms");
    expect(signingState().terms).toBe(true);
    toggleSigningItem("terms");
    expect(signingState().terms).toBe(false);
  });

  it("freezes every approval once signed", () => {
    for (const [k] of SIGNING_ITEMS) toggleSigningItem(k);
    sign();
    toggleSigningItem("card");
    expect(signingState().card, "nothing reopens under a signature").toBe(true);
    expect(signingState().signed).toBe(true);
  });

  it("resets to unsigned for the next walkthrough", () => {
    for (const [k] of SIGNING_ITEMS) toggleSigningItem(k);
    sign();
    resetSigning();
    expect(signingState()).toEqual({ contract: false, terms: false, card: false, signed: false });
  });
});
