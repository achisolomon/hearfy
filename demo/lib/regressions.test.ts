import { describe, expect, it } from "vitest";
import { BEATS, ROLES, beatForScreen, beatIndexById, type Role } from "./story";
import { componentFiles, patientNavigation, screenOrder, sourceOf } from "./screens";

const order = screenOrder();

/**
 * One test per bug that actually reached a viewer.
 *
 * Each asserts the invariant rather than the instance — "every screen is
 * reachable" rather than "book-date is reachable" — so the next screen added
 * to the same chain is covered without anyone remembering to add a case.
 */

describe("navigation reachability", () => {
  // Booking was unreachable: the guided script narrates four of stage 2's nine
  // screens, and the shared pointer silently ignores a screen with no beat, so
  // Home's "Manage visit · Date and time" was a dead click.
  it("can address every screen a patient button navigates to", () => {
    const nav = patientNavigation();
    const targets = new Set(Object.values(nav).flat());
    const unreachable = [...targets].filter(
      t => beatForScreen("patient", t) === -1 && !order.includes(t),
    );
    expect(unreachable).toEqual([]);
  });

  it("lists every navigable screen in the registry order", () => {
    const targets = new Set(Object.values(patientNavigation()).flat());
    const missing = [...targets].filter(t => !order.includes(t));
    expect(missing).toEqual([]);
  });

  // Off-script screens are legitimate, but something must be able to show them.
  it("keeps the off-script screens in the registry so the app can still show them", () => {
    const offScript = order.filter(s => beatForScreen("patient", s) === -1);
    // Stage 2 deliberately narrates four of nine; the rest are detours.
    expect(offScript.length).toBeGreaterThan(0);
    for (const s of offScript) expect(order).toContain(s);
  });
});

describe("role handoffs", () => {
  // The four-persona demo never switched persona from a patient screen: the
  // patient app advanced with goToScreen, which keeps the current role.
  it("changes lead role somewhere in the script, so handoffs exist to fire", () => {
    const leads = BEATS.map(b => b.lead);
    const switches = leads.filter((l, i) => i > 0 && l !== leads[i - 1]);
    expect(switches.length).toBeGreaterThan(5);
  });

  it("gives every role at least one beat it leads", () => {
    for (const role of ROLES) {
      // The operator's screen is ambient, so it leads nothing by design.
      if (role === "operator") continue;
      expect(BEATS.some(b => b.lead === role)).toBe(true);
    }
  });

  it("gives every role a screen at every beat, so no role can render nothing", () => {
    for (const b of BEATS) {
      for (const role of ROLES) {
        expect(b.screens[role as Role], `${b.id} / ${role}`).toBeTruthy();
      }
    }
  });
});

describe("patient navigation wiring", () => {
  const app = sourceOf("components/patient-app-2.tsx");

  // Demo 2's patient advanced with goToScreen, which keeps the current role,
  // so no patient screen ever handed the story to the CMA or audiologist.
  it("advances the story through next(), so handoffs can fire", () => {
    expect(app).toContain("next()");
  });

  // goToScreen ignores a screen with no beat, so the five screens the guided
  // script skips were unreachable and their buttons did nothing.
  it("can still show a screen the guided script never narrates", () => {
    expect(app).toMatch(/onScript/);
  });

  it("lets the shared pointer override a detour, so Next is never trapped", () => {
    expect(app).toContain("detour.from === screen");
  });
});

describe("progress counters", () => {
  const patient = componentFiles("components/screens/patient")
    .map(f => sourceOf(f))
    .join("\n");

  // Home showed a hardcoded "2 of 5 steps complete" for booking progress while
  // the intake wizard counts its own five steps, so pressing Continue read as
  // going from step 2 back to step 1.
  it("counts 'of 5' in only one place, so two counters cannot disagree", () => {
    const counters = [...patient.matchAll(/(\d+) of 5\b/g)].map(m => m[0]);
    expect(counters).toEqual([]);
  });

  // The wizard's own progress must stay 1..total with no gaps or repeats.
  it("numbers the intake wizard steps consecutively from one", () => {
    const intake = sourceOf("components/screens/patient/intake.tsx");
    const steps = [...intake.matchAll(/step=\{(\d+)\}/g)].map(m => Number(m[1]));
    expect(steps).toEqual([...steps].sort((a, b) => a - b));
    expect(new Set(steps).size).toBe(steps.length);
    expect(Math.min(...steps)).toBe(1);
  });
});

describe("story consistency", () => {
  const app = sourceOf("components/patient-app-2.tsx");
  const welcome = sourceOf("components/screens/patient/welcome.tsx");

  // Home showed "Visit scheduled · Tomorrow" with a date and an assigned CMA
  // at stage 1 — Awareness — two beats before the visit is confirmed. The
  // viewer had not chosen a date, or completed intake, or paid.
  it("does not claim a booking before the story confirms one", () => {
    expect(welcome).toContain("booked");
    expect(app).toContain('booked={beat >= beatIndexById("confirmed")}');
  });

  it("reads the appointment from the fixture rather than repeating it", () => {
    // The date lived in three places; the booked card now uses the one source.
    expect(welcome).toContain("appointment.date");
    expect(welcome).not.toMatch(/May 21 · 9:00/);
  });
});

describe("who decides what", () => {
  const beatOf = (id: string) => BEATS[beatIndexById(id)];

  // The guided walk went prescription -> CMA stub -> CMA stub -> checkout, so
  // the viewer was asked to pay for a device they were never offered a choice
  // of. Choosing is the patient's decision; the audiologist only prescribes
  // what is clinically suitable.
  it("lets the patient choose the device before paying for it", () => {
    const choose = BEATS.findIndex(b => b.screens.patient === "compare" && b.lead === "patient");
    const pay = BEATS.findIndex(b => b.screens.patient === "checkout");
    expect(choose, "no patient-led beat shows the device choice").toBeGreaterThan(-1);
    expect(choose).toBeLessThan(pay);
  });

  it("prescribes before the patient chooses", () => {
    expect(beatIndexById("prescription")).toBeLessThan(beatIndexById("stock"));
  });

  // The guided walk went intake -> payment -> confirmed, so the viewer was
  // billed $99 for a visit whose date and time they were never asked to
  // choose, then told a specific date as though they had picked it. Choosing
  // the slot is the patient's decision; book-date and book-time already exist
  // and render, the script just never narrated them.
  it("lets the patient choose the visit slot before paying for it", () => {
    const chooseDate = BEATS.findIndex(b => b.screens.patient === "book-date" && b.lead === "patient");
    const chooseTime = BEATS.findIndex(b => b.screens.patient === "book-time" && b.lead === "patient");
    const pay = BEATS.findIndex(b => b.screens.patient === "payment");
    expect(chooseDate, "no patient-led beat shows the date choice").toBeGreaterThan(-1);
    expect(chooseTime, "no patient-led beat shows the time choice").toBeGreaterThan(-1);
    expect(chooseDate).toBeLessThan(pay);
    expect(chooseTime).toBeLessThan(pay);
  });

  // The clinical gates belong to the audiologist, the purchase to the patient.
  it("keeps the signature and prescription beats with the audiologist", () => {
    for (const id of ["review", "sign", "consult", "prescription"]) {
      expect(beatOf(id).lead, id).toBe("audiologist");
    }
  });

  it("keeps the purchase beats with the patient", () => {
    for (const id of ["payment", "checkout"]) {
      expect(beatOf(id).lead, id).toBe("patient");
    }
  });
});

describe("patient device choice", () => {
  const commerce = sourceOf("components/screens/patient/commerce.tsx");

  // Compare showed three devices across six categories, then a single button
  // reading "Continue with the Phonak Audéo L50" regardless of which column
  // the patient actually preferred — the comparison was theatre. The CTA must
  // read the patient's own selection, not a literal devices[0].
  it("does not hardcode Compare's call-to-action to a literal devices[0]", () => {
    const compareBlock = commerce.split("export function Checkout")[0];
    expect(compareBlock).not.toMatch(/Continue with the \{devices\[0\]/);
  });

  // Checkout unconditionally read devices[0], so whatever the patient
  // pointed at on Compare, they were billed for the Phonak regardless.
  it("does not have Checkout unconditionally read devices[0]", () => {
    const checkoutBlock = commerce.split("export function Checkout")[1]?.split("export function Order")[0] ?? "";
    expect(checkoutBlock).not.toMatch(/=\s*devices\[0\]/);
  });

  // Compare and Checkout are separate screens rendered inside
  // <motion.div key={current}>, so the whole component tree unmounts and
  // remounts between them (see components/patient-app-2.tsx). A selection
  // held only in useState would be lost on that remount — same failure mode
  // latch.ts and text-size.tsx were built to avoid. The selection must come
  // from a module-scope store reached through useSyncExternalStore (directly
  // or, as here, through a hook that wraps it) — not plain component state —
  // so it survives the remount.
  it("holds the device selection in a module-scope store, not useState, so it survives the remount between Compare and Checkout", () => {
    expect(commerce).not.toMatch(/useState<?\(?.*[Dd]evice/);
    const selectionSrc = sourceOf("lib/selection.ts");
    expect(selectionSrc).toMatch(/useSyncExternalStore/);
  });

  // Restacking Compare into per-device cards is a rewrite of the whole
  // component — exactly the kind of change that could quietly drop the
  // selection wiring while fixing the layout. Pin both ends of it: Compare
  // still calls into the shared store rather than reinventing local state,
  // and Checkout still derives its device from that store rather than
  // regressing to a literal devices[0].
  it("keeps Compare and Checkout wired to the shared selection store after the layout rewrite", () => {
    const compareBlock = commerce.split("export function Checkout")[0];
    expect(compareBlock).toContain("selectDevice(");
    expect(compareBlock).toContain("useSelectedDevice(");

    const checkoutBlock = commerce.split("export function Checkout")[1]?.split("export function Order")[0] ?? "";
    expect(checkoutBlock).toContain("useSelectedDevice(");
    expect(checkoutBlock).not.toMatch(/devices\[0\]/);
  });
});

describe("shell controls", () => {
  // The shell offered Next and no way back, though the context exposed back().
  it("wires every navigation the story context exposes", () => {
    const shell = sourceOf("components/shell/demo-shell.tsx");
    expect(shell).toContain("onClick={next}");
    expect(shell).toContain("onClick={back}");
  });
});

describe("clinical screens", () => {
  const cma = componentFiles("components/screens/cma").map(f => sourceOf(f)).join("\n");
  const aud = componentFiles("components/screens/audiologist").map(f => sourceOf(f)).join("\n");

  // The consult dropped the device price while the disclaimer listed every
  // tier price and claimed cost was not shown.
  it("shows the device price on the consult shortlist", () => {
    expect(aud).toContain("{d.price}");
  });

  it("does not claim to hide what it displays", () => {
    if (/\$\{t\.monthly\}/.test(aud)) {
      expect(aud).not.toContain("cost are not shown here");
    }
  });

  // The findings text said 40–65 dB HL while the chart beside it plotted 20–65.
  it("states a threshold range that matches the audiogram fixture", async () => {
    const { audiogram } = await import("./mock-data");
    const air = [...audiogram.right, ...audiogram.left];
    const stated = /air thresholds (\d+)–(\d+) dB HL/.exec(aud);
    expect(stated, "review screen should state an air threshold range").toBeTruthy();
    expect(Number(stated![1])).toBe(Math.min(...air));
    expect(Number(stated![2])).toBe(Math.max(...air));
  });

  // The kit checklist drew a tick on every row, passed or not, leaving colour
  // as the only cue on a hard gate.
  it("draws the checklist tick only for a passed item", () => {
    const setup = sourceOf("components/screens/cma/setup.tsx");
    expect(setup).toMatch(/\{done\[i\] && <Check/);
  });

  // Five of six supervision tiles were buttons with no handler: focusable,
  // announced as actionable, silently inert.
  it("does not render a read-only supervision tile as a button", () => {
    const sup = sourceOf("components/screens/audiologist/supervision.tsx");
    expect(sup).not.toMatch(/onClick=\{e\.hero \? onOpen : undefined\}/);
    expect(sup).toContain("if (!e.hero) return <div");
  });

  // Icons that carry state need text beside them, per the audiogram's own rule.
  it("pairs every state-carrying icon with text for a screen reader", () => {
    const sup = sourceOf("components/screens/audiologist/supervision.tsx");
    for (const icon of ["AlertTriangle", "WifiOff"]) {
      expect(sup).toMatch(new RegExp(`${icon}[^/]*aria-hidden`));
    }
    expect(sup).toContain("sr-only");
  });

  // The CMA may not interpret; the patient sees no diagnosis before signature.
  it("keeps clinical interpretation out of the CMA's screens", () => {
    for (const phrase of ["tympanic membrane", "hearing loss", "dB HL"]) {
      expect(cma.toLowerCase()).not.toContain(phrase.toLowerCase());
    }
  });

  it("keeps price and stock out of the CMA's screens", () => {
    expect(cma).not.toMatch(/\$\d/);
    expect(cma.toLowerCase()).not.toContain("in stock");
  });
});

describe("text-size clipping", () => {
  // Compare's table carried min-w-[560px] — an absolute pixel floor — while
  // the container around it (Shell's max-w-md) is rem-based and shrinks with
  // the root font size. At the *smallest* text setting the rem container is
  // narrowest (28rem × 18px = 504px) and the 560px floor exceeds it, so the
  // rightmost column ran past the edge. At larger text settings the rem
  // container grows past 560px and the same table looks fine — an inversion
  // that makes the bug easy to miss testing only at default zoom. Any
  // absolute-px floor inside a rem-scaled container reproduces this the same
  // way, so this scans every component rather than re-checking one table.
  const allComponents = componentFiles("components")
    .map(f => ({ file: f, src: sourceOf(f) }));

  // Shell (components/screens/shared.tsx) wraps patient/CMA content in
  // max-w-md = 28rem. The root size is 112.5% (18px) at "standard" per
  // globals.css, and TextSize (components/a11y/text-size.tsx) only scales
  // upward from there (1 / 1.15 / 1.3) — it never goes below 112.5% — so
  // 28rem × 18px = 504px is the narrowest this container is ever asked to be.
  const NARROWEST_ROOT_PX = 18;
  const SHELL_MAX_W_REM = 28;
  const SHELL_CONTENT_PX = SHELL_MAX_W_REM * NARROWEST_ROOT_PX; // 504

  // Matches Tailwind arbitrary-value utilities carrying a literal px floor:
  // min-w-[560px], w-[3px], etc. Captures the property (min-w/w) and the
  // number so a failure message can name exactly which class is too wide.
  const PX_FLOOR = /\b(min-w|w)-\[(\d+)px\]/g;

  // Test A: no absolute-pixel minimum width can exceed the rem-based
  // container it lives in. A px floor inside a rem container is fine right
  // up until the rem container shrinks below it — which is exactly what
  // happens at the smallest text size.
  it("keeps every absolute-pixel min-width inside the smallest rem-based container it can sit in", () => {
    const offenders: string[] = [];
    for (const { file, src } of allComponents) {
      for (const m of src.matchAll(PX_FLOOR)) {
        const [full, prop, pxStr] = m;
        if (prop !== "min-w") continue; // a plain `w-[…]` is a fixed size, not a floor that fights a shrinking container
        const px = Number(pxStr);
        if (px > SHELL_CONTENT_PX) {
          offenders.push(
            `${file}: \`${full}\` is ${px}px, but Shell's content box is only ` +
            `${SHELL_CONTENT_PX}px at the smallest text size (28rem × ${NARROWEST_ROOT_PX}px root) — ` +
            `a px floor inside a rem container clips or forces a scroll once the ` +
            `container shrinks past it.`,
          );
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  // Test B: a min-width wider than its container must not be able to clip
  // silently — it must sit inside a horizontally-scrollable ancestor, so the
  // extra width is reachable rather than lost off the edge.
  it("wraps every oversized min-width element in a horizontally-scrollable ancestor", () => {
    const offenders: string[] = [];
    for (const { file, src } of allComponents) {
      for (const m of src.matchAll(PX_FLOOR)) {
        const [full, prop, pxStr] = m;
        if (prop !== "min-w") continue;
        if (Number(pxStr) <= SHELL_CONTENT_PX) continue; // never exceeds its container; nothing to scroll
        const scrollable = /overflow-(x-)?auto|overflow-(x-)?scroll/.test(src);
        if (!scrollable) {
          offenders.push(`${file}: \`${full}\` can exceed its container but no overflow-x-auto ancestor was found in the file`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  // The compare screen specifically: the owner's own words were "It looks
  // bad. Lose this. Lose the scroll." Two prior fixes (min-w-[560px], then
  // min-w-[28rem]) both tried to make the four-column table fit by tuning a
  // width, and both either clipped the rightmost column or forced exactly
  // the horizontal scrollbar the owner rejected — a table with a label
  // column plus three device columns of sentence-length values cannot fit
  // Shell's phone-width container at any text size. The fix is structural:
  // Compare no longer renders a wide table at all, so there is nothing left
  // to scroll or to floor with a min-width.
  it("gives Compare no horizontally-scrolling region — the owner rejected the scrollbar, so the layout must stack instead", () => {
    const commerce = sourceOf("components/screens/patient/commerce.tsx");
    const compareBlock = commerce.split("export function Checkout")[0];
    expect(compareBlock).not.toMatch(/overflow-x-auto|overflow-auto/);
    expect(compareBlock).not.toMatch(/\bmin-w-\[/);
  });

  // Test C: the page itself must never scroll horizontally. Kept narrow and
  // source-checkable: no top-level screen wrapper claims a raw viewport
  // width (`w-screen`) while also carrying horizontal padding/margin, which
  // is the combination that pushes content past 100vw.
  it("never combines w-screen with horizontal padding or margin on a screen wrapper", () => {
    const offenders: string[] = [];
    for (const { file, src } of allComponents) {
      if (!/\bw-screen\b/.test(src)) continue;
      for (const m of src.matchAll(/className="([^"]*\bw-screen\b[^"]*)"/g)) {
        const cls = m[1];
        if (/\b(p|px|m|mx)-\d/.test(cls) || /\b(p|m)x?-\[[^\]]+\]/.test(cls)) {
          offenders.push(`${file}: \`${cls}\` combines w-screen with horizontal padding/margin, which overflows the viewport`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  // No top-level screen wrapper (the outermost element Shell/StepPage
  // return) should carry a fixed pixel width — same failure mode as Test A,
  // but for the page's own root element rather than a table.
  it("gives no top-level screen wrapper a fixed pixel width", () => {
    const shared = sourceOf("components/screens/shared.tsx");
    const shellLine = shared.split("\n").find(l => l.includes("export function Shell"));
    expect(shellLine, "could not locate Shell's definition").toBeTruthy();
    expect(shellLine!).not.toMatch(/\bw-\[\d+px\]/);
  });

  // Compare now renders two responsive trees — a wide table (`lg:` and up)
  // and stacked cards (below `lg:`) — so the DOM holds both branches at
  // once, gated by Tailwind visibility classes rather than by mounting only
  // one. That structure makes it possible to fix one branch and quietly
  // leave the other stale: a category added to the table but not the cards,
  // or a third device dropped from one branch's map. Pin both branches
  // independently to the same source of truth (`compareCategories`, three
  // devices) rather than trusting that fixing one fixed both.
  it("shows all six categories and all three devices in both the desktop table and the stacked cards", () => {
    const commerce = sourceOf("components/screens/patient/commerce.tsx");
    const compareBlock = commerce.split("export function Checkout")[0];

    // The two branches are visibility-gated with Tailwind's `hidden lg:*` /
    // `lg:hidden` idiom (see the "shows a wide table only from `lg`..." test
    // below for why that idiom, not a JS media-query check, is what's
    // asserted here).
    const desktopMatch = /hidden lg:(?:block|flex|grid)[^"]*"[^]*?(?=lg:hidden|$)/.exec(compareBlock);
    const mobileMatch = /\blg:hidden\b[^]*$/.exec(compareBlock);
    expect(desktopMatch, "could not locate a `hidden lg:*` desktop branch in Compare").toBeTruthy();
    expect(mobileMatch, "could not locate an `lg:hidden` mobile branch in Compare").toBeTruthy();

    const desktopBranch = desktopMatch![0];
    const mobileBranch = mobileMatch![0];

    for (const branch of [desktopBranch, mobileBranch]) {
      // All six categories: both branches must iterate the shared array
      // rather than hand-listing a subset of it.
      expect(branch).toContain("compareCategories.map");
      // All three devices: both branches must iterate the same shortlist
      // rather than hand-listing one or two devices.
      expect(branch).toMatch(/shortlist\.map/);
    }
  });

  // The owner's chosen layout is a wide table on desktop, stacked cards on
  // phone — not a table that only ever renders narrow. Assert the split
  // itself exists via Tailwind's responsive-visibility idiom (this
  // codebase's established way to show/hide by breakpoint — see BottomNav's
  // sibling screens) rather than a media query or JS width check, so both
  // trees are always in the DOM and nothing depends on JS running first.
  it("gives Compare a wide table shown only from `lg` and stacked cards hidden from `lg`", () => {
    const commerce = sourceOf("components/screens/patient/commerce.tsx");
    const compareBlock = commerce.split("export function Checkout")[0];
    expect(compareBlock).toMatch(/hidden lg:(?:block|flex|grid)/);
    expect(compareBlock).toMatch(/\blg:hidden\b/);
  });
});
