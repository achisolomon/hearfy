import { describe, expect, it } from "vitest";
import { DARK_GROUND, LIGHT_GROUNDS, contrastRatio, worstOnLight } from "./contrast";
import { componentFiles, sourceOf } from "./screens";

/**
 * The contrast floor, held by arithmetic instead of by eye.
 *
 * Walking the patient journey at 390px on 2026-08-31 found every muted string
 * in the app under the 4.5:1 floor PRODUCT.md sets, and four screens whose
 * heading did not render at all. One test per fault, each asserting the
 * invariant rather than the instance.
 */

/** The floor PRODUCT.md sets for body text. */
const BODY = 4.5;
/** WCAG's large-text floor (>=24px, or >=18.66px bold). */
const LARGE = 3;

/**
 * Source with comments removed.
 *
 * These tests assert what the components *render*, and several of the fixes
 * they cover are explained in a comment that necessarily quotes the class it
 * replaced ("`min-h-[730px]` was a fixed pixel height..."). Scanning raw text
 * would read that prose as if it were live code and fail on its own
 * documentation, so the comments come out first.
 */
function codeOf(...parts: string[]): string {
  return sourceOf(...parts)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

/** Ratios the checker itself must agree on, so it cannot silently invert. */
describe("contrast arithmetic", () => {
  it("computes the reference ratios WCAG defines", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 1);
    expect(contrastRatio("#FFFFFF", "#FFFFFF")).toBeCloseTo(1, 5);
  });

  it("is symmetric, so argument order cannot change a verdict", () => {
    expect(contrastRatio("#556575", "#F4F8F8")).toBeCloseTo(contrastRatio("#F4F8F8", "#556575"), 10);
  });

  // The exact trap this suite exists to prevent: the old muted ink passed on
  // white and failed on the ground the app actually uses.
  it("catches the shipped bug — slate-500 #64748B passed on white but failed on Harbor Ground", () => {
    expect(contrastRatio("#64748B", "#FFFFFF")).toBeGreaterThanOrEqual(BODY);
    expect(contrastRatio("#64748B", "#F4F8F8")).toBeLessThan(BODY);
  });
});

describe("muted ink clears the body floor on every ground it sits on", () => {
  // Read the values out of the Tailwind config rather than repeating them, so
  // a future edit to the token is what this test checks.
  const config = sourceOf("tailwind.config.ts");
  const tokenOf = (name: string) => {
    const m = new RegExp(`${name}\\s*:\\s*"(#[0-9A-Fa-f]{6})"`).exec(config);
    if (!m) throw new Error(`could not read ${name} from tailwind.config.ts`);
    return m[1];
  };

  it("reads both muted tokens from the config", () => {
    expect(tokenOf("400")).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(tokenOf("500")).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  for (const step of ["400", "500"]) {
    it(`keeps slate-${step} at or above ${BODY}:1 on all four light grounds`, () => {
      const color = tokenOf(step);
      for (const ground of LIGHT_GROUNDS) {
        expect(
          contrastRatio(color, ground),
          `slate-${step} ${color} on ${ground}`,
        ).toBeGreaterThanOrEqual(BODY);
      }
    });
  }

  // slate-400 is the meta step: it must still be lighter than slate-500, or
  // the hierarchy the two express collapses into one colour.
  it("keeps slate-400 visibly lighter than slate-500 while both clear the floor", () => {
    expect(worstOnLight(tokenOf("400"))).toBeLessThan(worstOnLight(tokenOf("500")));
  });
});

describe("teal is only used as text where it can be read", () => {
  // DESIGN.md: "Don't use Vital Teal #12AAA5 for text below 18px on white —
  // use Teal Ink #087D7A." The rule was documented but not enforced.
  it("keeps Vital Teal below the body floor, which is why Teal Ink exists", () => {
    expect(worstOnLight("#12AAA5")).toBeLessThan(BODY);
  });

  it("keeps Teal Ink at or above the body floor on every light ground", () => {
    expect(worstOnLight("#087D7A")).toBeGreaterThanOrEqual(BODY);
  });

  // The patient journey's own screens, not the whole codebase: these are the
  // files this pass walked and fixed.
  const journey = [
    ...componentFiles("components/screens/patient"),
    "components/screens/shared.tsx",
    "components/ui.tsx",
  ];

  it("finds the journey's source files, so this test is not vacuous", () => {
    expect(journey.length).toBeGreaterThan(5);
  });

  /**
   * Vital Teal is legitimate on an icon (a shape, not text) and on the navy
   * ground (5.51:1). It is not legitimate as small text on a light ground.
   * Text elements are the ones that carry a text-* size class alongside it.
   */
  it("never sets Vital Teal on a sized text element in the patient journey", () => {
    const offenders: string[] = [];
    for (const file of journey) {
      for (const line of codeOf(file).split("\n")) {
        // A className that sizes text AND paints it Vital Teal.
        const classAttrs = line.match(/className=(?:"[^"]*"|\{`[^`]*`\}|\{cn\([^)]*\))/g) ?? [];
        for (const attr of classAttrs) {
          if (!/text-brand-teal/.test(attr)) continue;
          if (!/text-(?:xs|sm|base|\[\d+px\])/.test(attr)) continue;
          // Vital Teal reaches 5.51:1 on the navy ground, so a class list that
          // only applies it on the dark branch (`dark?"text-brand-teal":…`) is
          // correct. Only an unconditional light-ground use is a fault.
          if (/dark\s*\?\s*"[^"]*text-brand-teal/.test(attr)) continue;
          offenders.push(`${file}: ${attr.slice(0, 90)}`);
        }
      }
    }
    expect(offenders, `Vital Teal on sized text (use text-teal-ink):\n${offenders.join("\n")}`).toEqual([]);
  });
});

describe("the navy Shell publishes its surface, so shared components can adapt", () => {
  const ui = sourceOf("components/ui.tsx");
  const shared = sourceOf("components/screens/shared.tsx");

  // The bug: PageHeader hardcoded text-brand-navy, so on `<Shell dark>` the
  // title of assigned / driving / arrived / live rendered navy on navy.
  it("wraps Shell's children in a SurfaceProvider carrying the dark flag", () => {
    expect(shared).toContain("SurfaceProvider");
    expect(shared).toMatch(/SurfaceProvider value=\{dark\s*\?\s*"dark"\s*:\s*"light"\}/);
  });

  it("makes PageHeader choose its title ink from the surface, not a constant", () => {
    const header = ui.split("export function PageHeader")[1]?.split("export function")[0] ?? "";
    expect(header).toContain("useOnDark()");
    // The title must have a light-ground and a dark-ground ink, not one colour.
    expect(header).toMatch(/dark\s*\?\s*"text-white"\s*:\s*"text-brand-navy"/);
  });

  it("makes PrimaryButton choose its fill from the surface", () => {
    const button = ui.split("export function PrimaryButton")[1]?.split("export function")[0] ?? "";
    expect(button).toContain("useOnDark()");
    expect(button).toMatch(/bg-brand-navy/);
    expect(button).toMatch(/bg-\[#087d7a\]/);
  });

  it("gives the dark-ground button a label that clears the body floor", () => {
    expect(contrastRatio("#FFFFFF", "#087D7A")).toBeGreaterThanOrEqual(BODY);
  });

  // "Hover deepens, never lightens" (DESIGN.md). The first fix lightened it,
  // which dropped the white label to 3.95:1.
  it("deepens the dark-ground button on hover rather than lightening it", () => {
    const button = ui.split("export function PrimaryButton")[1]?.split("export function")[0] ?? "";
    const hover = /hover:bg-\[(#[0-9a-fA-F]{6})\][^"]*"\s*:\s*"bg-brand-navy/.exec(button)
      ?? /dark\?"bg-\[#087d7a\] hover:bg-\[(#[0-9a-fA-F]{6})\]/.exec(button);
    expect(hover, "could not read the dark hover fill").toBeTruthy();
    const hovered = hover![1];
    // Deeper than the resting fill means a HIGHER ratio against white.
    expect(contrastRatio("#FFFFFF", hovered)).toBeGreaterThan(contrastRatio("#FFFFFF", "#087D7A"));
  });

  // The four screens that were broken. Named here so that if one stops using
  // the dark Shell, the test says so rather than passing vacuously.
  it("still renders the four dark screens through Shell dark", () => {
    const dispatch = sourceOf("components/screens/patient/dispatch.tsx");
    const exam = sourceOf("components/screens/patient/exam.tsx");
    expect(dispatch.match(/<Shell dark>/g)?.length).toBe(3); // assigned, driving, arrived
    expect(exam).toContain("<Shell dark>"); // live
  });

  // Those screens used to force `className="bg-brand-teal"` to escape the
  // invisible navy button. That override is white-on-#12AAA5 at 2.87:1, so it
  // must not come back now that the surface picks an accessible fill.
  it("leaves the dark screens' primary buttons unstyled, so they inherit the accessible fill", () => {
    for (const file of ["components/screens/patient/dispatch.tsx", "components/screens/patient/exam.tsx"]) {
      expect(codeOf(file), file).not.toMatch(/PrimaryButton[^>]*className="bg-brand-teal"/);
    }
  });

  it("keeps Vital Teal legible on the navy ground, where it is still used", () => {
    expect(contrastRatio("#12AAA5", DARK_GROUND)).toBeGreaterThanOrEqual(LARGE);
  });
});

describe("touch targets on the controls that appear on every screen", () => {
  // The patient persona's standard is a floor, not a feature: the two
  // controls present on every screen were both under 44px (36px and 40px).
  it("gives the text-size buttons a 44px target", () => {
    const textSize = sourceOf("components/a11y/text-size.tsx");
    expect(textSize).toMatch(/grid h-11 w-11 place-items-center rounded-full/);
    expect(textSize).not.toMatch(/grid h-8 w-8 place-items-center rounded-full font-bold/);
  });

  it("gives every BottomNav tab a 44px target", () => {
    const shared = sourceOf("components/screens/shared.tsx");
    const nav = shared.split("export function BottomNav")[1] ?? "";
    expect(nav).toContain("min-h-11");
  });

  it("marks the active BottomNav tab for assistive tech, not by colour alone", () => {
    const nav = sourceOf("components/screens/shared.tsx").split("export function BottomNav")[1] ?? "";
    expect(nav).toContain("aria-current");
    // Weight carries the state too, so it survives a colour-blind read.
    expect(nav).toMatch(/font-extrabold/);
  });
});

describe("the first screen's primary action is not cut off", () => {
  // `min-h-[730px]` on a 844px phone pushed "Get started" under the docked
  // demo bar, and could not scale with the text-size control.
  it("sizes the Welcome column to the viewport rather than a fixed pixel height", () => {
    const welcome = codeOf("components/screens/patient/welcome.tsx").split("export function SignIn")[0];
    // No fixed pixel height, and no viewport minimum either: both push the
    // actions below Shell's own bottom padding and under the docked bar.
    expect(welcome).not.toContain("min-h-[730px]");
    expect(welcome).not.toMatch(/min-h-\[\d+px\]/);
    expect(welcome).not.toMatch(/min-h-\[100[sd]?vh\]/);
  });

  it("gives Welcome's secondary action real bounds instead of bare text", () => {
    const welcome = codeOf("components/screens/patient/welcome.tsx").split("export function SignIn")[0];
    expect(welcome).toContain("SecondaryButton");
  });
});

describe("the sign-in field is a real, labelled phone input", () => {
  const signin = codeOf("components/screens/patient/welcome.tsx").split("export function SignIn")[1]?.split("export function")[0] ?? "";

  it("ties the visible label to the input", () => {
    expect(signin).toContain('htmlFor="mobile"');
    expect(signin).toContain('id="mobile"');
  });

  it("asks for a phone keypad rather than a text keyboard", () => {
    expect(signin).toContain('type="tel"');
    expect(signin).toContain('inputMode="numeric"');
  });

  // A focus ring is not optional: the field had `outline-none` and nothing
  // replacing it, so keyboard focus was invisible.
  it("replaces the removed outline with a visible focus treatment", () => {
    expect(signin).toContain("outline-none");
    expect(signin).toContain("focus-within:");
  });

  it("keeps the placeholder readable, not the default light grey", () => {
    expect(signin).toContain("placeholder:text-slate-500");
  });
});

describe("the desktop bar fits the viewport it turns on at", () => {
  const shell = codeOf("components/shell/demo-shell.tsx");

  // The bar is `hidden md:block`, so it appears at 768px — but its row
  // (logo + four role tabs + nine timeline dots + Back + Next) measured
  // 1078px, scrolling the whole PAGE sideways on every screen from 768px up.
  it("lets the role tabs shrink instead of forcing the row wider than the bar", () => {
    expect(shell).toMatch(/min-w-0 shrink[^"]*"><RoleTabs/);
  });

  it("holds the stage timeline back until there is room for all nine dots", () => {
    expect(shell).toMatch(/hidden xl:block"><Timeline/);
  });

  // Back and Next are the only way to move the story once the timeline is
  // hidden, so neither may be the thing that shrinks.
  it("keeps both story controls at full size", () => {
    const bar = shell.split("Desktop")[1]?.split("<RoleView")[0] ?? shell;
    expect((bar.match(/shrink-0/g) ?? []).length).toBeGreaterThanOrEqual(2);
  });
});

describe("Compare's device selector is a real touch target", () => {
  // The desktop table's select control measured 30px tall.
  it("gives the select control a 44px minimum height", () => {
    const compare = codeOf("components/screens/patient/commerce.tsx").split("export function Checkout")[0];
    expect(compare).toContain("min-h-11");
  });
});
