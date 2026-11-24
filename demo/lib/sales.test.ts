import { describe, expect, it } from "vitest";
import { BRAND_NAME } from "./mock-data";
import { CONTACT, SLIDES } from "./sales";

/**
 * The public /sales page must not carry what the community deck keeps private:
 * prices, staffing ratios, "trained" or "certified" claims tied to the company,
 * hype words, and unfinished placeholders.
 *
 * Every guard checks the strings a reader sees (the whole content module,
 * walked recursively), not the current wording. Each regex has a positive case
 * below, because a guard that matches nothing passes silently.
 */

function collectStrings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(collectStrings);
  if (value && typeof value === "object") return Object.values(value).flatMap(collectStrings);
  return [];
}

const RENDERED = [...collectStrings(SLIDES), ...collectStrings(CONTACT)].join("\n");

const GUARDS: Record<string, RegExp> = {
  "dollar prices": /\$\s?\d/,
  "per-month prices": /\d\s*\/\s*mo\b/i,
  "certified claims": /certified/i,
  "company-trained claims": new RegExp(`${BRAND_NAME}[^\\n]{0,20}trained|trained[^\\n]{0,20}${BRAND_NAME}`, "i"),
  "supervision ratio": /1\s*:\s*(many|\d)|six homes/i,
  "hype words": /innovation|AI-powered|revolutionary|cutting-edge/i,
  "capitalised company name": new RegExp(BRAND_NAME.toUpperCase()),
  "confidential marking": /confidential/i,
  "placeholder brackets": /\[/,
};

describe("public /sales page carries nothing private", () => {
  for (const [name, pattern] of Object.entries(GUARDS)) {
    it(`has no ${name}`, () => {
      expect(RENDERED).not.toMatch(pattern);
    });
  }

  it.each([
    ["dollar prices", "Only $99 today"],
    ["per-month prices", "99/mo"],
    ["certified claims", "Certified staff"],
    ["company-trained claims", `${BRAND_NAME}-trained staff`],
    ["company-trained claims", `trained by ${BRAND_NAME}`],
    ["supervision ratio", "a 1:6 ratio"],
    ["supervision ratio", "1:many"],
    ["supervision ratio", "six homes a day"],
    ["hype words", "AI-powered care"],
    ["hype words", "cutting-edge"],
    ["capitalised company name", BRAND_NAME.toUpperCase()],
    ["confidential marking", "Confidential"],
    ["placeholder brackets", "[Name]"],
  ])("guard for %s catches %j", (name, bad) => {
    expect(bad).toMatch(GUARDS[name]);
  });

  it("writes the company name in mixed case where it appears", () => {
    const slideText = collectStrings(SLIDES).join("\n");
    const spellings = [...slideText.matchAll(/\bhearfy\b/gi)].map((m) => m[0]);
    expect(spellings.length).toBeGreaterThan(0);
    expect(spellings.every((s) => s === BRAND_NAME)).toBe(true);
  });

  it("spells the contact name exactly", () => {
    expect(CONTACT.name).toBe("Isaac Greszes, CRO");
  });

  it("gives every slide a unique id for deep links", () => {
    const ids = SLIDES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
