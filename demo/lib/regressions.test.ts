import { describe, expect, it } from "vitest";
import { BEATS, ROLES, beatForScreen, beatForScreenNear, beatIndexById, nextBeat, prevBeat, screenFor, type Role } from "./story";
import { componentFiles, patientNavigation, screenOrder, sourceOf } from "./screens";
import { audiogram, supervisionQueue } from "./mock-data";
import { SPACING_UNIT_REM, TAILWIND_SPACING_SCALE, isOnSpacingScale, spacingUtilitiesIn } from "./tailwind-scale";

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

describe("mobile persona indicator", () => {
  // On a real phone the desktop top bar (which carries RoleTabs) is
  // `md:hidden`, so RoleTabs only ever renders inside the slide-up sheet.
  // Nothing on screen said which of the four personas was active — the
  // owner's own words: "I don't see which one I'm on right now." The docked
  // phone bar (bottom-0, md:hidden) is the only persistent phone chrome, so
  // the indicator has to live there. Isolate that bar's block the same way
  // the "docked controls clearance" tests do, then assert it shows a
  // role-driven persona avatar and that tapping it opens the role switcher.
  const demoShell = sourceOf("components/shell/demo-shell.tsx");
  const controlBarMatch = /fixed inset-x-0 bottom-(\d+) z-40[^"]*md:hidden/.exec(demoShell);
  if (!controlBarMatch) throw new Error("could not locate the docked phone control bar in demo-shell.tsx");
  // The clearance tests' `indexOf("</div>", ...)` stops at the FIRST closing
  // div, which only spans the bar's first child — fine for finding a max
  // button height, but it would silently drop a middle child (the persona
  // indicator) from this block. Slice up to the next top-level section
  // (the sheet's AnimatePresence) instead, so the whole bar is covered.
  const barStart = controlBarMatch.index;
  const barEnd = demoShell.indexOf("<AnimatePresence>", barStart);
  const controlBarBlock = demoShell.slice(barStart, barEnd);

  // A future rewrite could still show *a* role affordance without showing
  // *which* role is current — e.g. a plain, unlabelled grid icon. Require
  // the bar to actually reference the live `role` from useStory, not just
  // some avatar component name, so a hardcoded/static avatar doesn't pass.
  it("renders a persona avatar driven by the current role inside the phone bar", () => {
    expect(controlBarBlock).toMatch(/<PersonaAvatar\b[^>]*\brole=\{role\}/);
  });

  // The owner's actual complaint: the bar showed a job title ("CMA",
  // "Patient") — SHORT_ROLE[role] — not a person. The demo's premise is
  // following four PEOPLE through one story, and personas.ts already has
  // names (Alex Rivera, Maya Lewis, Dr. Susan Reed, Jordan Pike). The label
  // must be driven by `personaFor(role).name` (or a first-name derivative of
  // it), not the old static role-label map, and the old map must be gone —
  // otherwise a future edit could reintroduce it as an unused decoy while a
  // name-shaped string sits elsewhere and still pass a looser assertion.
  it("labels the indicator with the persona's name, not a role/job title", () => {
    expect(
      controlBarBlock,
      "the phone bar's label must read from personaFor(role) (e.g. `.name` or a first-name split of it), not a static role-label lookup",
    ).toMatch(/personaFor\(role\)\.name/);
    expect(
      demoShell,
      "SHORT_ROLE was the role-label map this bug reported ('CMA', 'Patient', ...) — it must no longer exist now the bar shows the person's name",
    ).not.toMatch(/SHORT_ROLE/);
  });

  // Round two: the owner confirmed the name reads well, then asked for the
  // role back too — "I would keep the circle of the avatar... and I will
  // also bring back the role that you showed me before." Both, not one or
  // the other. The full title (personaFor(role).title, e.g. "Certified
  // Medical Assistant" or "Cloud Audiologist, Au.D.") does not fit the
  // owner's measured text budget at any root size, so this must read from
  // role-tabs.tsx's short label map (Patient/CMA/Audiologist/Operator), not
  // the long title — and the long title must not appear in the bar at all,
  // so a future edit can't silently swap in the title and blow the budget.
  it("shows a short role label alongside the persona name, not the long title", async () => {
    expect(
      controlBarBlock,
      "the phone bar must show a role label (e.g. the SHORT map from role-tabs.tsx) beside the persona name",
    ).toMatch(/\{SHORT\[role\]\}/);
    // Read the real long titles from personas.ts — the actual source of
    // truth — rather than regex-scanning demoShell for a `title:` pattern,
    // which would also match unrelated prose. Strip JSX comments first: the
    // surrounding code legitimately quotes a title in prose as an example of
    // what does NOT fit (documentation, not rendered output), so the check
    // must only look at what actually renders.
    const withoutComments = controlBarBlock.replace(/\{\/\*[\s\S]*?\*\/\}/g, "");
    const { PERSONAS } = await import("./personas");
    for (const { title } of Object.values(PERSONAS)) {
      expect(
        withoutComments,
        `the phone bar must not render the long title "${title}" literally — it does not fit the measured width budget`,
      ).not.toContain(title);
    }
    expect(
      withoutComments,
      "must not use personaFor(role).title — the full title is too wide for the phone bar's measured budget",
    ).not.toMatch(/personaFor\(role\)\.title/);
  });

  // The role line sits directly beneath the name in the same fixed-width
  // column; if either wraps or overflows it will push the Next pill or break
  // the bar's single-row layout. Both lines truncate to a single line with
  // an ellipsis instead.
  it("truncates the role label instead of wrapping or overflowing", () => {
    // The bar's aria-label also reads SHORT[role] (inside a `${...}`
    // template-literal interpolation, e.g. `${SHORT[role]}`), which is not
    // the rendered text this test cares about — the JSX-content usage is
    // `{SHORT[role]}` with no leading `$`, so require that the char right
    // before `{` isn't `$`.
    const shortMatch = /(?<!\$)\{SHORT\[role\]\}/.exec(controlBarBlock);
    expect(shortMatch, "no rendered {SHORT[role]} usage found to check for truncation").toBeTruthy();
    const before = controlBarBlock.slice(0, shortMatch!.index);
    const openTag = /<span\b[^>]*>\s*$/.exec(before);
    expect(openTag, "expected {SHORT[role]} to be rendered as the direct content of a <span> whose opening tag immediately precedes it").toBeTruthy();
    expect(openTag![0]).toMatch(/\btruncate\b/);
  });

  it("opens the same sheet used for role switching when the indicator is tapped", () => {
    // Whatever element wraps the avatar, it must be a control (not inert
    // decoration) that calls setSheet(true) — the same call the grid button
    // already uses, so it lands on the sheet that renders <RoleTabs full />.
    const avatarIdx = controlBarBlock.search(/<PersonaAvatar\b[^>]*\brole=\{role\}/);
    expect(avatarIdx, "no role-driven PersonaAvatar found to check for a tap handler").toBeGreaterThan(-1);
    const nearby = controlBarBlock.slice(Math.max(0, avatarIdx - 400), avatarIdx + 100);
    expect(nearby).toMatch(/onClick=\{[^}]*setSheet\(true\)[^}]*\}/);
  });

  // PersonaAvatar already renders role="img" + its own aria-label, so a
  // labelled wrapper button must silence the inner SVG rather than doubling
  // the announcement — the sheet trigger still needs an accessible name.
  it("gives the indicator button its own accessible name without a doubled announcement", () => {
    const avatarIdx = controlBarBlock.search(/<PersonaAvatar\b[^>]*\brole=\{role\}/);
    expect(avatarIdx).toBeGreaterThan(-1);
    // An aria-labelled <button> must open somewhere before the avatar, with
    // no OTHER <button> opening in between (i.e. this is the avatar's own
    // enclosing button, not an unrelated one earlier in the bar).
    // Arrow-function attributes (onClick={() => ...}) contain a literal `>`,
    // which would make a naive tag-matching regex stop early. This codebase
    // consistently closes a multi-line opening tag with `>` immediately
    // followed by a newline (see every button above), which `=>` never is —
    // so drop arrows first and the remaining `>` is always a real tag close.
    const before = controlBarBlock.slice(0, avatarIdx).replace(/=>/g, "==");
    const buttonOpens = [...before.matchAll(/<button\b([^>]*)>/g)];
    const last = buttonOpens.at(-1);
    expect(last, "expected a <button> to open somewhere before the role-driven PersonaAvatar").toBeTruthy();
    // aria-label may be a plain string ("Demo controls") or, since the
    // active role's name belongs in it, a JS expression such as a template
    // literal ({`Viewing as ${name} — change role`}) — accept either.
    expect(last![1], "the button wrapping the persona indicator must carry its own aria-label").toMatch(/aria-label=(?:"[^"]+"|\{[^}]+\})/);
    // Something between that button opening and the avatar tag must mark the
    // inner SVG decorative, so its own role="img"/aria-label doesn't also
    // get announced — doubling the label.
    const between = controlBarBlock.slice(before.lastIndexOf(last![0]), avatarIdx + 40);
    expect(between).toMatch(/aria-hidden/);
  });
});

describe("cover persona cards", () => {
  // On a real phone the owner saw "Certifie…", "Cloud A…", "Operati…" — the
  // "Or enter as one persona" cards on Cover (components/shell/cover.tsx)
  // truncated every title. Two causes: `grid-cols-2` was unconditional, so
  // each card only ever had ~half the row (measured ~75px/58px/41px of text
  // width across the three TextSize root sizes), and the title carried
  // `truncate`, which clips instead of wrapping once it doesn't fit. Isolate
  // just the persona-card block (the `ROLES.map` inside the "Or enter as one
  // persona" grid) so this doesn't false-positive on truncate/grid-cols-2
  // usage elsewhere on the page (e.g. the stats row).
  const cover = sourceOf("components/shell/cover.tsx");
  const sectionStart = cover.indexOf("Or enter as one persona");
  if (sectionStart === -1) throw new Error("could not locate the 'Or enter as one persona' section in cover.tsx");
  const gridStart = cover.indexOf("<div", sectionStart);
  const mapEnd = cover.indexOf("})}", gridStart);
  const cardBlock = cover.slice(gridStart, mapEnd === -1 ? undefined : mapEnd + 3);

  // The grid itself must not force two-up at the base (phone) breakpoint —
  // it must stack to one column there and only go two-up from a `sm:`/`md:`
  // breakpoint up, where there is room. A bare `grid-cols-2` with no
  // responsive prefix anywhere in the block means every breakpoint —
  // including phone — is two-up.
  it("does not force the persona-card grid to two columns unconditionally on phone", () => {
    expect(
      cardBlock,
      "found a bare `grid-cols-2` with no sm:/md: prefix — that forces two cards per row even at " +
      "375px, where the owner measured only ~75px/58px/41px of text width per column across the " +
      "three TextSize root sizes. 'Certified Medical Assistant' (~229-298px) can never fit that, " +
      "which is exactly the 'Certifie…' clipping the owner saw on a real phone. The grid should " +
      "stack one-per-row at the base breakpoint and go two-up only from sm:/md: up.",
    ).not.toMatch(/(?<!sm:|md:|lg:|xl:)\bgrid-cols-2\b/);
  });

  // The title line must not truncate: once the grid gives each card enough
  // width the title still needs to be allowed to wrap onto a second line
  // rather than clip with an ellipsis, or a long title at a wide TextSize
  // step could still clip. Locate whichever element renders `{p.title}` —
  // the fix leads with the persona's name (matching PersonaChip and the
  // phone bar), so the title moves out of the `<b>` into a plain `<span>` —
  // rather than assuming which tag it lives in.
  it("does not truncate the persona card's title, so a long title wraps instead of clipping", () => {
    const titleLine = /<(b|span)\b[^>]*>\s*\{p\.title\}/.exec(cardBlock);
    expect(titleLine, "could not find the title (`{p.title}`) rendered in the persona card block").toBeTruthy();
    const openTag = titleLine![0];
    expect(
      openTag,
      "the persona card's title element carries `truncate`, which clips long titles " +
      "('Certified Medical Assistant' -> 'Certifie…') instead of letting them wrap onto a second line.",
    ).not.toMatch(/\btruncate\b/);
  });

  // Round two of the fix: the title led and the muted name was secondary,
  // which inverted the identity — the person's name is who they are, the
  // title is the qualifier. PersonaChip (components/persona-avatar.tsx) and
  // the phone demo bar (demo-shell.tsx) both lead with the name; this card
  // must match so all three places describe a persona the same way.
  it("leads with the persona's name and shows the title beneath it, matching PersonaChip", () => {
    const nameIdx = cardBlock.search(/\{p\.name\}/);
    const titleIdx = cardBlock.search(/\{p\.title\}/);
    expect(nameIdx, "could not find {p.name} rendered in the persona card block").toBeGreaterThan(-1);
    expect(titleIdx, "could not find {p.title} rendered in the persona card block").toBeGreaterThan(-1);
    expect(nameIdx, "the persona's name must render before the title, not after it").toBeLessThan(titleIdx);
  });
});

describe("phone Back control visibility", () => {
  // Owner, round one: "there is no back button." The bar DOES contain a Back
  // <button> with <ArrowLeft>, but its only styling was `text-brand-navy
  // disabled:text-slate-300` — a bare icon with no border, fill, or outline
  // at all, enabled or disabled. Against the white/95 backdrop-blur bar that
  // read as decoration, not a control, even before disabling kicked in.
  //
  // Owner, round two, on a real phone after the outline-ring fix: "there's
  // also something on the back button, which I'm not sure what it is." An
  // unfilled ring floating on a near-white (white/95 backdrop-blur) bar
  // photographs as an unexplained empty circle, not a control — the fix
  // traded invisibility for ambiguity. `PageHeader` (components/ui.tsx)
  // already establishes this codebase's treatment for a circular back
  // control: a border PLUS a white background fill
  // (`border border-[#e1ebed] bg-white`), which gives the circle a real
  // surface distinct from the backdrop instead of just a hairline. This bar
  // follows that precedent rather than inventing a third treatment.
  //
  // `atStart` itself was checked separately (lib/story.test.ts — Back is
  // never falsely disabled mid-walk), so the fix here is purely visual: the
  // control must carry a filled, bounded surface so a disabled Back still
  // reads as "present but unavailable" rather than absent, the same way the
  // enabled Next pill is unmistakably a button.
  const demoShell = sourceOf("components/shell/demo-shell.tsx");
  const controlBarMatch = /fixed inset-x-0 bottom-(\d+) z-40[^"]*md:hidden/.exec(demoShell);
  if (!controlBarMatch) throw new Error("could not locate the docked phone control bar in demo-shell.tsx");
  const barStart = controlBarMatch.index;
  const barEnd = demoShell.indexOf("<AnimatePresence>", barStart);
  const controlBarBlock = demoShell.slice(barStart, barEnd);

  // Isolate the phone bar's own Back button specifically — `aria-label="Previous beat"`
  // is unique to it (the desktop bar's equivalent button lives in a
  // different, md:hidden-excluded block entirely, so controlBarBlock never
  // contains it).
  const backButtonMatch = /<button\b[^>]*aria-label="Previous beat"[^>]*>/.exec(controlBarBlock);
  const classAttr = backButtonMatch && /className="([^"]*)"/.exec(backButtonMatch[0]);
  const classes = classAttr?.[1] ?? "";

  it("gives the phone Back button a visible boundary, not just enabled/disabled text colour", () => {
    expect(backButtonMatch, "expected a Back button (aria-label=\"Previous beat\") inside the phone control bar").toBeTruthy();
    expect(classAttr, "Back button has no className to inspect").toBeTruthy();
    // A visible boundary independent of the disabled text-colour swap: a
    // border, a background fill, or a ring — any one is enough to keep the
    // control's outline present when its icon colour goes pale.
    const hasBoundary = /\bborder(?:-|\b)/.test(classes) || /\bbg-(?!\[)/.test(classes) || /\bring-/.test(classes);
    expect(
      hasBoundary,
      `Back button className "${classes}" relies only on icon text colour (disabled:text-slate-300) with no border/background/ring — a disabled state this faint reads as absent, not present-but-unavailable`,
    ).toBe(true);
  });

  // The specific fix for round two: a bare `border` with no background reads
  // as an empty ring on the near-white bar. Require an actual background
  // fill (not an arbitrary transparent one) so the circle has a surface,
  // matching PageHeader's `bg-white` precedent for the same control shape.
  it("fills the Back button with a background, not just an outline ring", () => {
    expect(backButtonMatch).toBeTruthy();
    expect(
      classes,
      `Back button className "${classes}" has no plain bg- fill — an unfilled border alone is the exact "empty ring" the owner flagged as ambiguous on a real phone`,
    ).toMatch(/\bbg-(?!\[)/);
  });

  // The fill must still be present (paled, not removed) once disabled, so
  // the disabled state reads as "present but unavailable" rather than
  // reverting to the original invisible-icon bug.
  it("keeps a background fill on the Back button in its disabled state too", () => {
    expect(backButtonMatch).toBeTruthy();
    expect(
      classes,
      `Back button className "${classes}" must pair its disabled: text-colour swap with a disabled: background too, so the control keeps a visible surface once unavailable`,
    ).toMatch(/disabled:bg-/);
  });
});

describe("full-height screen wrapper clearance", () => {
  // Shell (components/screens/shared.tsx) gives its callers pb-40/md:pb-24,
  // proven safe by "docked controls clearance" above. But four screens never
  // call Shell at all — they roll their own full-height root
  // (`min-h-[100dvh] ... p-6 ...`) with only p-6 (1.5rem) of bottom padding
  // at every breakpoint, including phone, where the docked demo control bar
  // (demo-shell.tsx, `fixed inset-x-0 bottom-0 z-40 ... h-14 ... md:hidden`)
  // reaches 3.5rem up from the viewport bottom. The owner hit this on the
  // audiologist consult screen — "Continue to prescription" was cut in half
  // — but the same wrapper string appears verbatim in review.tsx,
  // supervision.tsx, and operator/dashboard.tsx, so all four are affected.
  //
  // These roles (CMA/audiologist/operator) render no BottomNav (that is
  // patient-only, see shared.tsx), so they only need to clear the control
  // bar itself, not the taller patient stack "docked controls clearance"
  // proves Shell clears.
  //
  // This scans every screen component generically — any file matching the
  // same "full-height root that isn't Shell" shape is checked, not just the
  // four files known today — so a new screen added later with the same
  // pattern fails here too instead of shipping the same bug again.
  //
  // SPACING_UNIT_REM and TAILWIND_SPACING_SCALE come from ./tailwind-scale —
  // the one place that scale is defined, so this test and "docked controls
  // clearance" below can never disagree about what's on it. See that
  // module's own "tailwind spacing scale" describe block for coverage of
  // the scale/validator itself.
  const demoShell = sourceOf("components/shell/demo-shell.tsx");
  const controlBarMatch = /fixed inset-x-0 bottom-(\d+) z-40[^"]*md:hidden/.exec(demoShell);
  if (!controlBarMatch) throw new Error("could not locate the docked phone control bar in demo-shell.tsx");
  const controlBarBlock = demoShell.slice(controlBarMatch.index, demoShell.indexOf("</div>", controlBarMatch.index));
  const controlBarBottomRem = Number(controlBarMatch[1]) * SPACING_UNIT_REM;
  const controlHeightsRem = [...controlBarBlock.matchAll(/\bh-(\d+)\b/g)].map(m => Number(m[1]) * SPACING_UNIT_REM);
  if (controlHeightsRem.length === 0) throw new Error("found no h-* button height inside the docked phone control bar");
  const controlBarHeightRem = Math.max(...controlHeightsRem);
  const controlBarTopEdgeRem = controlBarBottomRem + controlBarHeightRem;

  // Every full-height, non-Shell screen root in the app: `min-h-[100dvh]`
  // (with or without a leading `grid`/other utility) that is not itself
  // Shell's own definition (Shell already proved safe above; scanning it
  // here too would just retest the same line for no reason).
  const screenFiles = componentFiles("components/screens").filter(f => f !== "components/screens/shared.tsx");
  const FULL_HEIGHT_ROOT = /className="([^"]*\bmin-h-\[100dvh\][^"]*)"/g;

  type Wrapper = { file: string; classes: string };
  const wrappers: Wrapper[] = [];
  for (const file of screenFiles) {
    const src = sourceOf(file);
    for (const m of src.matchAll(FULL_HEIGHT_ROOT)) {
      wrappers.push({ file, classes: m[1] });
    }
  }

  it("finds at least one full-height screen wrapper to check (so this test is not vacuous)", () => {
    expect(wrappers.length).toBeGreaterThan(0);
  });

  // Parse each wrapper's *base* (phone) bottom padding — `p-<n>` or
  // `pb-<n>` with no responsive prefix — the value active below `md:`,
  // where the docked control bar is not `md:hidden`'s opposite (it IS
  // shown). A responsive override (`md:p-*`/`md:pb-*`) does not count: it
  // never applies on phone, which is exactly the viewport the owner hit
  // the bug on.
  const basePaddingRem = (classes: string): { raw: number; className: string } | null => {
    // Prefer a bare pb- (more specific than p-) if present; otherwise fall
    // back to p-. Both matched only when NOT preceded by a responsive
    // prefix like md:/sm:/lg:.
    const pb = /(?<!\S)pb-(\d+)\b/.exec(classes);
    if (pb) return { raw: Number(pb[1]), className: pb[0] };
    const p = /(?<!\S)p-(\d+)\b/.exec(classes);
    if (p) return { raw: Number(p[1]), className: p[0] };
    return null;
  };

  it("gives every non-Shell full-height screen wrapper a parseable base bottom padding", () => {
    const unparseable = wrappers
      .filter(w => basePaddingRem(w.classes) === null)
      .map(w => `${w.file}: \`${w.classes}\` has no bare p-*/pb-* to check`);
    expect(unparseable).toEqual([]);
  });

  it("keeps every full-height wrapper's padding class on Tailwind's real spacing scale", () => {
    const offenders: string[] = [];
    for (const w of wrappers) {
      const parsed = basePaddingRem(w.classes);
      if (!parsed) continue;
      if (!TAILWIND_SPACING_SCALE.has(parsed.raw)) {
        offenders.push(
          `${w.file}: \`${parsed.className}\` (${parsed.raw}) is not on Tailwind's default spacing ` +
          `scale — it compiles to NO CSS at all, silently leaving zero padding on phone.`,
        );
      }
    }
    expect(offenders).toEqual([]);
  });

  // The actual bug: base (phone) bottom padding must clear the docked
  // control bar's top edge, the same relationship "docked controls
  // clearance" proves for Shell — with room to spare, not a flush fit.
  it("gives every non-Shell full-height screen wrapper enough base bottom padding to clear the docked phone control bar", () => {
    const offenders: string[] = [];
    for (const w of wrappers) {
      const parsed = basePaddingRem(w.classes);
      if (!parsed) continue;
      const paddingRem = parsed.raw * SPACING_UNIT_REM;
      if (paddingRem <= controlBarTopEdgeRem) {
        offenders.push(
          `${w.file}: \`${parsed.className}\` gives only ${paddingRem}rem of bottom padding on phone, but ` +
          `the docked control bar (demo-shell.tsx) reaches ${controlBarTopEdgeRem}rem above the viewport ` +
          `bottom (bottom-${controlBarBottomRem / SPACING_UNIT_REM} + h-${controlBarHeightRem / SPACING_UNIT_REM}). ` +
          `Content at the bottom of this screen sits behind the bar on a real phone.`,
        );
      }
    }
    expect(
      offenders,
      `found ${offenders.length} full-height screen wrapper(s) whose content the docked phone control bar overlaps:\n` +
      offenders.join("\n"),
    ).toEqual([]);
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

  // The header row was a bare `{shortlist.map(...)}` with no leading cell,
  // while every `grid-cols-[9rem_repeat(3,1fr)]` row below it opens with a
  // label cell before the same `shortlist.map`. A four-column grid fed only
  // three children packs each device header one column left of its own
  // values — the label slot swallows the first header, and the row grows an
  // empty column on the right. Every row on this grid template must place
  // something in the leading (label) slot before it maps the three devices,
  // so the declared column count always matches the rendered cell count.
  it("gives every grid-cols-[9rem_repeat(3,1fr)] row in Compare a leading cell before it maps the three devices", () => {
    const commerce = sourceOf("components/screens/patient/commerce.tsx");
    const compareBlock = commerce.split("export function Checkout")[0];
    const GRID_ROW_OPEN = /grid-cols-\[9rem_repeat\(3,1fr\)\][^>]*>/g;
    const bareRows: string[] = [];
    let match: RegExpExecArray | null;
    let rowCount = 0;
    while ((match = GRID_ROW_OPEN.exec(compareBlock))) {
      rowCount++;
      const afterOpenTag = compareBlock.slice(match.index + match[0].length);
      const mapIdx = afterOpenTag.indexOf("shortlist.map(");
      const beforeMap = mapIdx === -1 ? afterOpenTag : afterOpenTag.slice(0, mapIdx);
      // A real leading cell is a JSX element, not just the `{` that opens
      // the map expression — so require an opening tag before shortlist.map.
      if (!/<\w/.test(beforeMap)) {
        bareRows.push(`row ${rowCount}: nothing before shortlist.map() — "${beforeMap.trim()}"`);
      }
    }
    expect(rowCount, "expected to find at least one grid-cols-[9rem_repeat(3,1fr)] row").toBeGreaterThan(0);
    expect(bareRows).toEqual([]);
  });
});

describe("docked controls clearance", () => {
  // On a real phone the owner rejected the floating controls (grid/sheet
  // button, Back circle, Next pill) hovering above a separate BottomNav —
  // "it doesn't look good" — and chose Option C: one bar docked flush to the
  // viewport bottom (demo-shell.tsx's Back/Next/sheet row at bottom-0)
  // with the patient app's BottomNav stacked directly above it, flush, no
  // gap, on phone. Everything here is still rem-based, and rem sizes scale
  // together: the root is 112.5% (18px) at "standard" per globals.css and
  // TextSize (components/a11y/text-size.tsx) only scales upward from there
  // (×1.15, ×1.3), so whatever clearance exists in rem is the same
  // clearance at every text size.
  //
  // The guarantee this test encodes did not change: Shell's content must
  // never sit behind the tallest fixed bottom element on phone. What changed
  // is the shape of that element from "a floating row with a gap beneath
  // it" to "a docked stack with zero gap" — so the source markers this test
  // parses changed (bottom-24 -> bottom-0, a floating md:hidden row -> a
  // docked one, plus BottomNav's own stacked offset), but the assertion is
  // the same relationship: Shell's bottom padding > the stack's top edge.
  //
  // Tailwind's spacing scale is 0.25rem per step, which is how every value
  // below is converted from the class name rather than hand-copied as a
  // number that could drift from the source.
  //
  // SPACING_UNIT_REM and TAILWIND_SPACING_SCALE come from ./tailwind-scale —
  // the one place that scale is defined, so this test and "full-height
  // screen wrapper clearance" above can never disagree about what's on it.
  // A bare number NOT in this set compiles to NOTHING: Tailwind's JIT only
  // emits CSS for class names it recognizes, so an off-scale utility like
  // `pb-38` (there is no 38 — the scale jumps 36 -> 40) is silently dropped,
  // the element gets zero padding, and nothing in the DOM or a
  // screenshot-free test run tells you the rule never existed. This is
  // exactly the bug that shipped: the old version of this test parsed the
  // integer out of `pb-38` and did correct arithmetic on it, which made the
  // class *look* covered while the browser applied none of it. See the
  // "tailwind spacing scale" describe block below for coverage of
  // isOnSpacingScale itself.
  const assertOnScale = (raw: number, context: string) => {
    expect(
      isOnSpacingScale(raw),
      `"${raw}" is not on Tailwind's default spacing scale (${context}). ` +
      `Tailwind's JIT compiler only emits CSS for class names on its ` +
      `recognized scale (…, 36, 40, 44, …) or using arbitrary-value syntax ` +
      `(e.g. pb-[9.5rem]); a bare off-scale number like this generates NO ` +
      `CSS AT ALL — the utility is silently dropped, so the element falls ` +
      `back to zero for that property. Fix: use a real scale step, or wrap ` +
      `the value in square brackets for an arbitrary value.`,
    ).toBe(true);
  };
  const classValueRem = (src: string, pattern: RegExp): number => {
    const m = pattern.exec(src);
    if (!m) throw new Error(`could not find a class matching ${pattern} in source`);
    const raw = Number(m[1]);
    assertOnScale(raw, `parsed from ${pattern}`);
    return raw * SPACING_UNIT_REM;
  };

  const shared = sourceOf("components/screens/shared.tsx");
  const shellLine = shared.split("\n").find(l => l.includes("export function Shell"));
  if (!shellLine) throw new Error("could not locate Shell's definition in shared.tsx");

  const demoShell = sourceOf("components/shell/demo-shell.tsx");
  // The docked phone control bar: `fixed inset-x-0 bottom-0 z-40 ... md:hidden`.
  const controlBarMatch = /fixed inset-x-0 bottom-(\d+) z-40[^"]*md:hidden/.exec(demoShell);
  if (!controlBarMatch) throw new Error("could not locate the docked phone control bar in demo-shell.tsx");
  const controlBarBlock = demoShell.slice(controlBarMatch.index, demoShell.indexOf("</div>", controlBarMatch.index));

  const shellPaddingRem = classValueRem(shellLine, /\bpb-(\d+)\b/);
  const controlBarBottomRem = classValueRem(demoShell, /fixed inset-x-0 bottom-(\d+) z-40/);
  // The docked bar must actually sit flush at the viewport bottom now, not
  // floating above it — Option C's entire premise.
  it("docks the phone control bar flush to the viewport bottom", () => {
    expect(controlBarBottomRem, "the phone control bar's bottom-* offset should be 0 (flush), not floating above the viewport bottom").toBe(0);
  });

  // Every button in the docked bar shares a height; take the tallest h-*
  // found in the bar so the assertion holds even if one button is changed
  // to be taller than its siblings.
  const controlHeightsRem = [...controlBarBlock.matchAll(/\bh-(\d+)\b/g)].map(m => Number(m[1]) * SPACING_UNIT_REM);
  if (controlHeightsRem.length === 0) throw new Error("found no h-* button height inside the docked phone control bar");
  const controlBarHeightRem = Math.max(...controlHeightsRem);
  const controlBarTopEdgeRem = controlBarBottomRem + controlBarHeightRem;

  // BottomNav (components/screens/shared.tsx) stacks directly above the
  // docked control bar on phone when a story is present (patient role,
  // Demo 2) — its phone bottom-* offset (`bottom-N md:bottom-0`, reverting
  // to flush on desktop where the demo control bar is md:hidden) must equal
  // the control bar's height so the two sit flush with no gap and no overlap.
  const sharedSrc = sourceOf("components/screens/shared.tsx");
  if (!sharedSrc.includes("export function BottomNav")) throw new Error("could not locate BottomNav's definition in shared.tsx");
  const bottomNavStackedOffsetRem = classValueRem(sharedSrc, /bottom-(\d+) md:bottom-0/);
  const bottomNavHeightRem = classValueRem(sharedSrc, /BottomNav[\s\S]{0,600}?\bh-(\d+)\b/);

  it("stacks BottomNav flush above the docked control bar on phone, with no gap", () => {
    expect(
      bottomNavStackedOffsetRem,
      `BottomNav's phone-stacked bottom-* offset is ${bottomNavStackedOffsetRem}rem, but the docked ` +
      `control bar (demo-shell.tsx) is ${controlBarHeightRem}rem tall. For the two to read as one ` +
      `continuous docked stack with no gap and no overlap, BottomNav's offset must equal the control ` +
      `bar's height.`,
    ).toBe(controlBarHeightRem);
  });

  const stackTopEdgeRem = controlBarBottomRem + controlBarHeightRem + bottomNavHeightRem;

  // The relationship, not the instance: Shell's bottom padding must clear
  // the tallest stack's top edge (patient role: control bar + BottomNav) with
  // room to spare, whatever the exact numbers are on either side. A future
  // change to any value (a taller button, a shell padding "cleanup") that
  // closes this gap should fail here rather than surface on a phone again.
  it("gives Shell enough bottom padding to clear the docked stack's top edge on phone", () => {
    expect(
      shellPaddingRem,
      `Shell's bottom padding is ${shellPaddingRem}rem, but the docked phone stack (control bar ` +
      `bottom-${controlBarBottomRem / SPACING_UNIT_REM} to ${controlBarTopEdgeRem}rem, plus BottomNav ` +
      `stacked on top up to ${stackTopEdgeRem}rem) reaches ${stackTopEdgeRem}rem above the viewport ` +
      `bottom in the worst case (patient role, where both bars stack). Because all values are rem-based ` +
      `they scale together at every TextSize step, so if padding does not clear the stack's top edge ` +
      `here, it never does — content sits behind the docked bar at every text size, not just one.`,
    ).toBeGreaterThan(stackTopEdgeRem);
  });

  // A role with no BottomNav (CMA, audiologist, operator) only has the
  // control bar itself reaching up from the viewport bottom — confirm that
  // shorter case is also covered by the same padding value, so the shared
  // Shell padding is proven safe for every role, not just the patient's.
  it("also clears the control bar alone, for roles that render no BottomNav", () => {
    expect(shellPaddingRem).toBeGreaterThan(controlBarTopEdgeRem);
  });
});

describe("flex row shrinkage at large text", () => {
  // The owner, on a real phone at the largest TextSize step (root 112.5% *
  // 1.3 = 23.4px): "Maya L." wrapped mid-name, "Certified Medical Assistant"
  // stacked one word per line, and the green "Confirmed" StatusPill overflowed
  // the card and was clipped by the viewport. Root cause, in dispatch.tsx's
  // Assigned card:
  //
  //   <div className="flex items-center gap-3">
  //     <Avatar/>                          (shrink-0 — fine)
  //     <div className="flex-1">...name/title/rating...</div>   <-- no min-w-0
  //     <StatusPill tone="green">Confirmed</StatusPill>          <-- no shrink guard
  //   </div>
  //
  // A flex child with flex-1 (or any flex-grow) defaults to min-width:auto,
  // NOT 0. That default means the browser will not let the flex-1 child
  // shrink below its own content's intrinsic width to make room for a
  // sibling — so as the root font grows and the pill's intrinsic width grows
  // with it, the pill wins the fight for space and pushes past the card/
  // viewport edge instead of the text column giving way. `min-w-0` overrides
  // that default and lets the column actually shrink and wrap.
  //
  // Deliberately keyed on flex-1 (this codebase's only flex-grow idiom — no
  // bare `grow`/`flex-grow` appears anywhere in components/), not on every
  // `flex items-center`/`justify-between` row: a plain row of two
  // auto-sized, non-growing children (e.g. consult.tsx's price row, or
  // supervision.tsx's "Live" pill beside a heading) has no forced-shrink
  // fight to lose — neither child is told to fill remaining space, so
  // there's no `min-width:auto` collapse to guard against. Flagging those
  // too would be a false positive that teaches contributors to ignore this
  // test. The actual failure mode needs a growing child AND a sibling that
  // must hold its own size (a StatusPill, or anything marked shrink-0)
  // fighting it for the same row.
  const allComponents = componentFiles("components").map(f => ({ file: f, src: sourceOf(f) }));

  // A `<tag className="...flex-1...">` opening tag that lacks `min-w-0` in
  // the same class string.
  const FLEX_1_OPEN_TAG = /<\w+\s+className="([^"]*\bflex-1\b[^"]*)"[^>]*>/g;

  // How far past the flexible child's own opening tag to look for the
  // dangerous sibling (StatusPill, or an explicit shrink-0 element) sharing
  // its row. Source analysis has no real DOM tree to walk, so this is a
  // bounded window rather than an exact sibling lookup — the same trade-off
  // the "accessible name" test above makes with its own ±400 char slice.
  const SIBLING_WINDOW = 500;
  // How far back to look for the row's own opening tag, to check whether the
  // row already opts into `flex-wrap` — a row that wraps has already solved
  // the crush-vs-overflow fight some other way, so it doesn't need min-w-0
  // on top of that.
  const ROW_LOOKBEHIND = 300;

  type Offender = { file: string; snippet: string; reason: string };
  const offenders: Offender[] = [];

  for (const { file, src } of allComponents) {
    for (const m of src.matchAll(FLEX_1_OPEN_TAG)) {
      const classes = m[1];
      if (/\bmin-w-0\b/.test(classes)) continue; // already guarded

      const tagEnd = m.index! + m[0].length;
      const after = src.slice(tagEnd, tagEnd + SIBLING_WINDOW);
      const before = src.slice(Math.max(0, m.index! - ROW_LOOKBEHIND), m.index!);

      // The nearest preceding row-opening tag that establishes the flex
      // container this child sits in. If it already carries flex-wrap, the
      // row degrades by wrapping instead of crushing this child, so skip it.
      const rowOpen = /<\w+\s+className="([^"]*\bflex\b[^"]*)"[^>]*>(?![\s\S]*<\w+\s+className="[^"]*\bflex\b[^"]*>[\s\S]*$)/.exec(before);
      if (rowOpen && /\bflex-wrap\b/.test(rowOpen[1])) continue;

      const hasStatusPill = /<StatusPill\b/.test(after);
      const hasShrink0Sibling = /<\w+\s+className="[^"]*\bshrink-0\b[^"]*"/.test(after);
      if (!hasStatusPill && !hasShrink0Sibling) continue;

      const reason = hasStatusPill
        ? "a StatusPill sibling follows within the row"
        : "a shrink-0 sibling follows within the row";
      offenders.push({
        file,
        snippet: src.slice(m.index!, Math.min(src.length, tagEnd + 120)),
        reason,
      });
    }
  }

  it("finds at least one flex-1 element to check (so this test is not vacuous)", () => {
    const anyFlex1 = allComponents.some(({ src }) => /\bflex-1\b/.test(src));
    expect(anyFlex1).toBe(true);
  });

  it("gives every flex-1 text column min-w-0 when a StatusPill or shrink-0 sibling shares its row", () => {
    const report = offenders.map(o =>
      `${o.file}: \`${o.snippet.replace(/\s+/g, " ").trim()}\` — ${o.reason} but the flex-1 element ` +
      `has no min-w-0, so its min-width defaults to auto. At the largest TextSize step the sibling's ` +
      `intrinsic width grows and this column cannot shrink to make room for it, so the sibling gets ` +
      `pushed past the card/viewport edge and clipped instead. Add min-w-0 to the flex-1 element (and ` +
      `shrink-0 to whichever sibling must hold its size) so the row degrades by shrinking/wrapping text ` +
      `instead of overflowing.`
    );
    expect(offenders, `\n${report.join("\n")}`).toEqual([]);
  });
});

describe("phone bar Next control at largest text size", () => {
  // Measured at 375px: the phone bar (Back circle + persona text column +
  // Next pill) fits the persona name/role at "standard" and "large" text,
  // but at "larger" (root 112.5% * 1.3 = 23.4px) the text column shrinks to
  // ~56.9px while the longest name+role needs ~102.6px — the pill clips.
  // TextSize (components/a11y/text-size.tsx) holds the chosen step in a
  // module-scope store read via useSyncExternalStore, not a CSS breakpoint,
  // so the bar cannot express "only at the largest step" with a Tailwind
  // responsive prefix — it has to branch on that store's live value. The
  // owner's fix: render Next as an icon-only circle (matching Back's shape)
  // only at that step, which recovers ~72px and lets the text column fit at
  // all three text sizes without ever dropping the name or role.
  const demoShell = sourceOf("components/shell/demo-shell.tsx");
  const controlBarMatch = /fixed inset-x-0 bottom-(\d+) z-40[^"]*md:hidden/.exec(demoShell);
  if (!controlBarMatch) throw new Error("could not locate the docked phone control bar in demo-shell.tsx");
  const barStart = controlBarMatch.index;
  const barEnd = demoShell.indexOf("<AnimatePresence>", barStart);
  const controlBarBlock = demoShell.slice(barStart, barEnd);

  // The bar must read the live text-size step from a11y/text-size.tsx's
  // module-scope store (directly or through a hook wrapping it), not just
  // reference the module by name — otherwise a decoy import that never
  // actually branches rendering would still pass a looser check.
  it("imports the text-size step from the a11y text-size store", () => {
    expect(
      demoShell,
      "demo-shell.tsx must import something from a11y/text-size.tsx (e.g. a hook exposing the " +
      "current index or an `isLargestText` boolean) to know when to collapse Next to an icon",
    ).toMatch(/from ["']\.\.\/a11y\/text-size["']/);
  });

  // The Next control inside the phone bar specifically (not the desktop
  // bar's separate Next, which must keep its label at every size per the
  // "do not change the desktop top bar" constraint). A conditional render
  // (icon-only at the largest step, labelled pill otherwise) produces TWO
  // `onClick={next}` buttons in the JSX source, both inside whatever wraps
  // them (e.g. `{isLargestText ? (...) : (...)}`) — so capture from the
  // FIRST `onClick={next}` through the LAST matching `</button>` among a run
  // of consecutive onClick={next} buttons, which spans both branches plus
  // the condition wrapping them, rather than stopping at the first `</button>`
  // (which would only ever see one branch and miss the gate around them).
  const NEXT_BUTTON_OPEN = /<button\b[^>]*onClick=\{next\}/g;
  const nextButtonOpens = [...controlBarBlock.matchAll(NEXT_BUTTON_OPEN)];

  it("finds the phone bar's Next button to check", () => {
    expect(nextButtonOpens.length, "expected at least one onClick={next} button inside the docked phone control bar").toBeGreaterThan(0);
  });

  // From the first onClick={next} button's start, extend through however
  // many consecutive `<button ... onClick={next} ...>...</button>` runs
  // follow with only whitespace/JSX-conditional glue between them (a `? (`
  // / `) : (` / `)}` from the ternary), so both branches of a conditional
  // render are included as one block.
  const firstOpenIdx = nextButtonOpens[0]?.index ?? -1;
  let nextBlock = "";
  if (firstOpenIdx > -1) {
    // Walk forward from the first opening tag, matching complete
    // `<button ...>...</button>` runs (via a lazy .*? on <button ... > up to
    // its own </button>) plus JSX glue between them, until no further
    // onClick={next} button follows immediately after.
    let cursor = firstOpenIdx;
    let end = firstOpenIdx;
    const BUTTON_RUN = /<button\b[^>]*onClick=\{next\}[\s\S]*?<\/button>/g;
    BUTTON_RUN.lastIndex = cursor;
    let m: RegExpExecArray | null;
    while ((m = BUTTON_RUN.exec(controlBarBlock))) {
      if (m.index !== cursor && controlBarBlock.slice(cursor, m.index).replace(/[\s)}:?(]|isLargestText/g, "") !== "") break;
      end = m.index + m[0].length;
      cursor = end;
      BUTTON_RUN.lastIndex = cursor;
    }
    nextBlock = controlBarBlock.slice(Math.max(0, firstOpenIdx - 40), end);
  }

  it("branches the phone Next control on the text-size store rather than always rendering the labelled pill", () => {
    // The labelled form ("Next" + arrow) must not be unconditional — some
    // conditional keyed on the text-size step must gate it, so at the
    // largest step something other than the px-4 labelled pill renders.
    expect(
      nextBlock,
      `the phone bar's Next button must conditionally render an icon-only form at the largest text ` +
      `step instead of always showing the labelled "Next" pill:\n${nextBlock}`,
    ).toMatch(/isLargestText|textSizeIndex|SIZES\.length\s*-\s*1/);
  });

  it("keeps an accessible name on the phone Next control in its icon-only form", () => {
    // Whether rendered as a labelled pill (accessible name from its text
    // content) or collapsed to an icon-only circle, the control must carry
    // an explicit aria-label somewhere so an icon-only render is never
    // silently unlabelled.
    expect(
      nextBlock,
      `icon-only Next must carry an aria-label (e.g. "Next beat") so collapsing away the visible ` +
      `"Next" text does not also remove its accessible name:\n${nextBlock}`,
    ).toMatch(/aria-label=(?:"[^"]+"|\{[^}]+\})/);
  });

  it("still conveys the atWalkEnd state when Next is collapsed to an icon", () => {
    // atWalkEnd already disables the button (disabled={atWalkEnd}); the
    // icon-only form must not silently drop that, since it can no longer
    // rely on the "End of this persona's day" text label to convey it.
    expect(nextBlock).toContain("disabled={atWalkEnd}");
  });

  // The persona text column (name over role) must not be able to overflow
  // the row even if the 375px budget above is wrong for a narrower phone
  // (360px, 320px devices exist) — it must degrade by truncating instead.
  it("keeps the persona text column shrinkable and truncating, so it cannot overflow the row on narrower phones", () => {
    const personaButtonMatch = /<button\b[^>]*onClick=\{\(\) => setSheet\(true\)\}[\s\S]*?<\/button>/.exec(controlBarBlock);
    expect(personaButtonMatch, "could not find the persona indicator button in the phone control bar").toBeTruthy();
    const personaBlock = personaButtonMatch![0];
    expect(
      personaBlock,
      "the persona button's flex-1 text column must carry min-w-0, or a flex-1 sibling's default " +
      "min-width:auto stops it from shrinking to make room for Next",
    ).toMatch(/\bmin-w-0\b/);
    expect(
      personaBlock,
      "the persona name and role lines must keep `truncate` so they clip with an ellipsis instead " +
      "of overflowing the row on a narrower phone (360px/320px) where the measured 375px budget " +
      "no longer holds",
    ).toMatch(/\btruncate\b/);
  });
});

describe("tailwind spacing scale", () => {
  // "docked controls clearance" and "full-height screen wrapper clearance"
  // (above) both depend on ./tailwind-scale to catch an off-scale class like
  // `pb-38` before it ships as silently-zero padding. Neither of those tests
  // actually proves the scale itself is right, though — they only prove
  // Shell's own numbers happen to be on it. A wrong or incomplete scale
  // (missing a real step, or wrongly admitting a fake one) would make both
  // tests pass or fail for the wrong reason. This proves the scale and its
  // validator directly, independent of any one component.

  // Tailwind's default scale is not consecutive integers — it has a run of
  // half-steps at the bottom (0.5, 1.5, 2.5, 3.5) and then starts skipping
  // whole integers once it passes 12 (13 is missing, then 15, 17..19, 21..23,
  // ...). A validator built from `Number.isInteger` or `raw <= 96` would
  // wrongly accept a fair number of these gaps, which is exactly how `pb-38`
  // could have looked plausible if nobody had enumerated the real scale.
  it("rejects a sample of the actual gaps in Tailwind's scale, not just implausibly large numbers", () => {
    // 38 is the bug that shipped; 13, 15, and 21 are unrelated gaps nearby
    // that a naive "must be a multiple of 4" or "must be even" rule would
    // handle differently — picked to stress different wrong heuristics.
    for (const gap of [13, 15, 17, 21, 38, 45, 100]) {
      expect(isOnSpacingScale(gap), `${gap} should not be on the scale`).toBe(false);
    }
  });

  it("accepts every real step on Tailwind's default scale, including the sub-1 half-steps", () => {
    // The half-steps are the easiest real values for an integer-only
    // validator to wrongly reject — pin them by name, not just via the
    // shared set, so a validator rewrite that drops half-step support fails
    // here even if someone also "fixes" TAILWIND_SPACING_SCALE to match.
    for (const step of [0.5, 1.5, 2.5, 3.5]) {
      expect(isOnSpacingScale(step), `${step} is a real Tailwind half-step and should be on the scale`).toBe(true);
    }
    // And the full published scale, so a future edit that drops or
    // mistypes any step (e.g. 44 -> 45) is caught here rather than only in
    // whichever component test happens to use that particular step.
    const published = [
      0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 20,
      24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 72, 80, 96,
    ];
    for (const step of published) {
      expect(isOnSpacingScale(step), `${step} is on Tailwind's published default scale`).toBe(true);
    }
    expect(TAILWIND_SPACING_SCALE.size).toBe(published.length);
  });

  // spacingUtilitiesIn is the scanner the codebase-wide check below relies
  // on to even find candidate classes. Arbitrary-value syntax (`pb-[9.5rem]`)
  // is Tailwind's real escape hatch for an off-scale value — it always
  // compiles to real CSS — so the scanner must treat it as a different kind
  // of thing entirely, not as a spacing utility to validate against the
  // scale. If the scanner mis-parsed it as a bare step, a legitimate
  // `pb-[9.5rem]` would be flagged as a false positive.
  it("does not treat arbitrary-value syntax as a bare scale step", () => {
    const found = spacingUtilitiesIn('<div className="pb-[9.5rem] w-[560px]">');
    expect(found).toEqual([]);
  });

  // Fraction utilities (`w-1/2`) and bare keywords (`w-full`, `h-screen`,
  // `inset-0` aside — that IS numeric and valid) use the same `prop-value`
  // shape as a real spacing step but are a different Tailwind feature
  // entirely and must not false-positive.
  it("does not mistake fraction or keyword width/height utilities for spacing steps", () => {
    const found = spacingUtilitiesIn('<div className="w-1/2 w-full h-screen h-auto h-fit">');
    expect(found).toEqual([]);
  });

  // The scanner must still find a real bare step sitting right next to the
  // syntax it's supposed to ignore, including through a responsive prefix
  // (md:pb-24) — a scanner that over-corrected to avoid false positives
  // above could just as easily start missing real classes too.
  it("still finds a real bare spacing step next to arbitrary-value and fraction utilities", () => {
    const found = spacingUtilitiesIn('<div className="w-1/2 pb-[9.5rem] md:pb-24 gap-2.5">');
    const classNames = found.map(f => f.className).sort();
    expect(classNames).toEqual(["gap-2.5", "pb-24"]);
  });

  // The actual proof this whole describe block exists for: feed the
  // scanner the exact class the owner's bug shipped with, and confirm the
  // combination — found by the scanner, then rejected by the validator —
  // is what would have failed the "docked controls clearance" test, instead
  // of the old version that quietly parsed `38` out of `pb-38` and did
  // arithmetic as if it meant something.
  it("catches the exact pb-38 class the original bug shipped, end to end", () => {
    const found = spacingUtilitiesIn('<div className="fixed inset-x-0 bottom-0 z-40 pb-38 md:hidden">');
    const pb = found.find(f => f.className.startsWith("pb-"));
    expect(pb, "scanner should have found the pb-38 utility").toBeTruthy();
    expect(isOnSpacingScale(pb!.raw)).toBe(false);
  });
});

describe("codebase-wide tailwind spacing scale scan", () => {
  // The one instance (docked controls clearance, full-height wrapper
  // clearance) and the validator itself (tailwind spacing scale, above) are
  // both covered, but neither scans the rest of the app. A second off-scale
  // class of the exact same shape (silently-zero CSS, a test that "passes"
  // because nothing renders to disagree with it) could ship anywhere else
  // in components/ or app/ and nothing here would notice. This scans every
  // .tsx file under both directories for every spacing utility this
  // codebase uses and fails naming any class whose numeric step isn't on
  // Tailwind's real scale — not just the corner this session already found.
  const files = [...componentFiles("components"), ...componentFiles("app")];

  it("scans more than a handful of files, so this check is not accidentally vacuous", () => {
    expect(files.length).toBeGreaterThan(20);
  });

  it("keeps every spacing utility class in components/ and app/ on Tailwind's real scale", () => {
    const offenders: string[] = [];
    for (const file of files) {
      const src = sourceOf(file);
      for (const { className, raw } of spacingUtilitiesIn(src)) {
        if (!isOnSpacingScale(raw)) {
          offenders.push(
            `${file}: \`${className}\` (${raw}) is not on Tailwind's default spacing scale — it ` +
            `compiles to NO CSS at all, silently leaving the property unset. This is the exact ` +
            `failure mode of the pb-38 bug: nothing in the DOM or a screenshot-free test tells you ` +
            `the class never applied.`,
          );
        }
      }
    }
    expect(
      offenders,
      `found ${offenders.length} off-scale Tailwind spacing utilit${offenders.length === 1 ? "y" : "ies"} ` +
      `in components/ or app/:\n${offenders.join("\n")}`,
    ).toEqual([]);
  });
});

describe("operator MRR reconciliation", () => {
  // The plan originally specified mrr: 148_916 while metrics.mix (702×$99 +
  // 431×$149 + 151×$299) sums to $178,866. Both render on the same
  // dashboard panel (components/screens/operator/metrics.tsx) — the top MRR
  // stat card, and the mix breakdown directly beneath it — so an investor
  // doing the arithmetic the mix table invites would see the two disagree.
  // This is a data assertion against the real fixture, not source analysis:
  // it fails again if anyone edits mrr or the mix independently in the
  // future, whichever one drifts.
  it("keeps metrics.mrr equal to the sum of metrics.mix's own count × monthly", async () => {
    const { metrics } = await import("./mock-data");
    const reconciled = metrics.mix.reduce((sum, m) => sum + m.count * m.monthly, 0);
    expect(
      metrics.mrr,
      `metrics.mrr (${metrics.mrr}) does not match metrics.mix's own count × monthly (${reconciled}). ` +
      `Both numbers render on the same operator dashboard panel, so a mismatch reads as a ` +
      `contradiction to anyone who does the mix table's own arithmetic.`,
    ).toBe(reconciled);
  });

  it("keeps metrics.activeMemberships equal to the sum of metrics.mix's own counts", async () => {
    const { metrics } = await import("./mock-data");
    const reconciled = metrics.mix.reduce((sum, m) => sum + m.count, 0);
    expect(
      metrics.activeMemberships,
      `metrics.activeMemberships (${metrics.activeMemberships}) does not match the sum of ` +
      `metrics.mix's own tier counts (${reconciled}) — the same dashboard shows both the total and ` +
      `the per-tier breakdown that should add up to it.`,
    ).toBe(reconciled);
  });
});

describe("unsourced operator figures stay visibly marked", () => {
  // metrics.conversion, metrics.deviceGrossProfit, metrics.cmaShare and
  // metrics.supervisionRatio appear in neither the deck nor the MRD — the
  // product owner flagged them as demo placeholders only (spec §14,
  // mock-data.ts's own comment above `metrics`). They render in the funnel
  // row of components/screens/operator/metrics.tsx alongside the genuinely
  // sourced "Visit fee $99" card. Nothing about the rendered card
  // distinguishes a placeholder from a real figure except the "Illustrative"
  // tag — if that tag is ever removed, these numbers read to an investor as
  // sourced company metrics, which they are not.
  const metricsSrc = sourceOf("components/screens/operator/metrics.tsx");

  // Isolate the funnel row specifically — the same "Or enter as one
  // persona"-style isolation the cover/mobile-indicator tests use above —
  // so this doesn't accidentally match an unrelated "Illustrative"-shaped
  // string elsewhere on the dashboard.
  const funnelStart = metricsSrc.indexOf("Conversion, Device GP and Supervision");
  if (funnelStart === -1) throw new Error("could not locate the funnel row's placeholder-figures comment in metrics.tsx");
  const funnelBlock = metricsSrc.slice(funnelStart);

  it("still renders a visible 'Illustrative' marker in the funnel row", () => {
    expect(
      funnelBlock,
      "the funnel row (components/screens/operator/metrics.tsx) must render a visible 'Illustrative' " +
      "marker — these four figures (conversion, device gross profit, cma share, supervision ratio) " +
      "are demo placeholders per spec §14, unsourced from either the deck or the MRD, and must never " +
      "read to an investor as sourced company metrics.",
    ).toContain("Illustrative");
  });

  // The marker must be driven from each card's own data (a per-card
  // `illustrative` boolean fed into a shared `.map`), not hand-authored once
  // per card — a hardcoded per-card marker is exactly the shape of edit
  // that silently drops the tag from one card (e.g. copy-pasting a new card
  // without its flag) while every existing test that only checks "the text
  // 'Illustrative' appears somewhere" keeps passing.
  it("drives the Illustrative marker from card data rather than one hardcoded per-card element", () => {
    // The funnel's four cards are declared as an array of tuples fed
    // through one `.map` — the fourth element of each tuple is the
    // per-card illustrative flag, and the JSX must branch on that flag
    // (`{illustrative && ...}`) rather than repeating a literal
    // "Illustrative" span once per card.
    expect(
      funnelBlock,
      "expected the funnel row to map over an array of per-card data (so the four funnel cards share " +
      "one render path) rather than hand-authoring four separate cards",
    ).toMatch(/\]\)\.map\(/);
    expect(
      funnelBlock,
      "expected the 'Illustrative' tag to be gated by a per-card boolean (e.g. `{illustrative && ...}`) " +
      "read from that card's own data, not rendered unconditionally or duplicated by hand per card",
    ).toMatch(/\{illustrative\s*&&/);
    // Exactly one occurrence of the literal tag text: if a future edit
    // hardcoded a second "Illustrative" span per card instead of reusing
    // the data-driven one, or duplicated the whole card block, this would
    // catch the drift even though "still renders a visible marker" above
    // would keep passing on the surviving copy.
    const literalOccurrences = (funnelBlock.match(/Illustrative/g) ?? []).length;
    expect(
      literalOccurrences,
      `found the literal text "Illustrative" ${literalOccurrences} times in the funnel row — expected ` +
      "exactly one, from the single data-driven render path",
    ).toBe(1);
  });

  // The one genuinely sourced figure in the same row — Visit fee, spec §9a
  // — must stay unmarked, so the tag keeps meaning something. If every card
  // carried the tag, "Illustrative" would stop communicating "unsourced"
  // and just read as decoration.
  it("leaves the genuinely sourced Visit fee card unmarked", () => {
    const visitFeeIdx = funnelBlock.indexOf('"Visit fee"');
    expect(visitFeeIdx, "could not find the Visit fee card's data in the funnel row").toBeGreaterThan(-1);
    // The Visit fee tuple's own trailing boolean (its `illustrative` flag)
    // must be false — check the tuple line itself rather than the whole
    // block, since the whole block legitimately contains "false" for the
    // one card that should have it.
    const tupleLine = funnelBlock.slice(visitFeeIdx, funnelBlock.indexOf("\n", visitFeeIdx));
    expect(tupleLine, `Visit fee's card data must end with \`false\` (not illustrative): "${tupleLine}"`).toMatch(/false\]/);
  });
});

/**
 * React hooks must run in the same order on every render of a component.
 * `latch.use()` is `useSyncExternalStore` in disguise, so putting it on the
 * right-hand side of `||` or `&&` makes it a conditional hook: the operator
 * short-circuits once the left side settles the answer, the hook silently
 * disappears from that render, and React throws "Rendered fewer hooks than
 * expected" — which the demo surfaces as a blank "Application error: a
 * client-side exception has occurred".
 *
 * The bug that reached a viewer: on CMA Try-on, `tried.length > 0 ||
 * triedLatch.use()` called the hook on first paint (empty list) and skipped
 * it on the very next render (non-empty list), so tapping any device card
 * crashed the whole demo. The same shape was live in patient Intake.
 *
 * Asserted as an invariant over every call site rather than against the two
 * instances, so the next screen that reaches for a latch is covered too.
 */
describe("latch hooks are called unconditionally", () => {
  // `use()` is the React binding; `get()` is the plain read that is safe
  // anywhere. Only the hook is order-sensitive.
  const callSites = componentFiles()
    .flatMap(file => {
      const src = sourceOf(file);
      return src
        .split("\n")
        .map((line, i) => ({ file, line: line.trim(), number: i + 1 }))
        .filter(l => /\w+Latch\.use\(\)/.test(l.line));
    });

  it("finds the latch call sites it is meant to guard", () => {
    // If a refactor renames the binding, this test would otherwise pass by
    // vacuously checking nothing.
    expect(callSites.length, "expected at least one `someLatch.use()` call site").toBeGreaterThan(0);
  });

  it("never guards a latch hook behind || or &&", () => {
    const shortCircuited = callSites.filter(l => /(\|\||&&)[^\n]*\w+Latch\.use\(\)/.test(l.line));
    expect(
      shortCircuited.map(l => `${l.file}:${l.number}  ${l.line}`),
      "a latch hook sits to the right of a short-circuiting operator, so it is " +
      "skipped once the left operand decides the result — React then sees the " +
      "hook count change between renders and throws",
    ).toEqual([]);
  });

  it("never guards a latch hook behind a ternary branch", () => {
    const ternary = callSites.filter(l => /\?[^\n]*\w+Latch\.use\(\)|\w+Latch\.use\(\)[^\n]*:/.test(l.line));
    expect(
      ternary.map(l => `${l.file}:${l.number}  ${l.line}`),
      "a latch hook sits inside a ternary branch, so it only runs for one of " +
      "the two outcomes — the hook order changes when the condition flips",
    ).toEqual([]);
  });

  it("assigns each latch hook straight into a binding, so it cannot be skipped", () => {
    const notPlainBinding = callSites.filter(l => !/^const\s+\w+\s*=\s*\w+Latch\.use\(\);$/.test(l.line));
    expect(
      notPlainBinding.map(l => `${l.file}:${l.number}  ${l.line}`),
      "every latch hook must be read as its own `const x = someLatch.use();` " +
      "statement — combine it with other state on the line below, where " +
      "short-circuiting cannot reach the hook",
    ).toEqual([]);
  });
});

/**
 * Back must land on the screen the viewer actually came from.
 *
 * The screen shown is a function of BOTH the beat pointer and the current
 * role — `screenFor(beat, role)`. Guided `next` moves both: it advances the
 * beat and adopts the new beat's lead role at a handoff. `back` moved only
 * the beat, leaving the role stuck on whoever led the beat being left.
 *
 * So stepping forward across a handoff and immediately pressing Back did not
 * undo the step: it returned to the previous beat but rendered it through the
 * NEW role's eyes, showing a screen the viewer had never been on. Thirteen of
 * the script's beats sat on such a handoff — e.g. Next from "assigned"
 * (patient) to "cma-enroute" (cma), then Back showed the CMA's "cma-day"
 * instead of the patient's "assigned".
 *
 * The invariant is round-tripping, asserted over the whole script rather than
 * the thirteen instances, so a handoff added later is covered too.
 */
describe("back returns to the screen the viewer came from", () => {
  // Mirrors the guided reducer in story-context.tsx: `next` takes the new
  // beat's lead, `back` steps the pointer and takes that beat's lead too.
  const guidedNext = (beat: number, role: Role) => {
    const i = nextBeat(beat);
    return { beat: i, role: BEATS[i].lead };
  };
  // Read the real reducer out of the source rather than restating it, so this
  // test tracks story-context.tsx instead of a copy that can drift out of sync
  // with it (and silently keep passing after a regression).
  const storySource = sourceOf("components/shell/story-context.tsx");
  const backBody = /const back = useCallback\(\(\) => \{([\s\S]*?)\}, \[/.exec(storySource)?.[1] ?? "";
  const backRestoresRole = /setRoleState|setRole\(/.test(backBody);

  const guidedBack = (beat: number, role: Role) => {
    const i = prevBeat(beat);
    // Only a `back` that also restores the landing beat's lead role changes
    // which persona the screen renders through.
    return { beat: i, role: backRestoresRole ? BEATS[i].lead : role };
  };

  it("has handoffs in the script, so this is not vacuous", () => {
    const handoffs = BEATS.filter((b, i) => i > 0 && b.lead !== BEATS[i - 1].lead);
    expect(handoffs.length, "expected the script to switch lead role somewhere").toBeGreaterThan(0);
  });

  it("undoes a guided Next, at every beat including every handoff", () => {
    const broken: string[] = [];
    for (let i = 0; i < BEATS.length - 1; i++) {
      const role = BEATS[i].lead;
      const before = screenFor(i, role);
      const fwd = guidedNext(i, role);
      const back = guidedBack(fwd.beat, fwd.role);
      const after = screenFor(back.beat, back.role);
      if (after !== before) {
        broken.push(
          `beat ${i} "${BEATS[i].id}" (${role}) → "${BEATS[fwd.beat].id}" (${fwd.role}): ` +
          `was showing "${before}", Back showed "${after}"`,
        );
      }
    }
    expect(
      broken,
      "Back must return to the screen Next left. When it only moves the beat " +
      "pointer and keeps the role adopted at a handoff, it renders the earlier " +
      "beat through the wrong persona's eyes — a screen the viewer was never on",
    ).toEqual([]);
  });

  it("keeps the role consistent with the beat after going back", () => {
    // A role that never leads its own beat means the shell's persona chip and
    // the screen disagree, which is how the wrong-screen bug shows up visually.
    const mismatched: string[] = [];
    for (let i = 1; i < BEATS.length; i++) {
      const { beat, role } = guidedBack(i, BEATS[i].lead);
      if (BEATS[beat].lead !== role) mismatched.push(`${BEATS[i].id} → ${BEATS[beat].id}`);
    }
    expect(mismatched, "after Back the active role must be the landing beat's lead").toEqual([]);
  });
});

describe("back from We're here after delivery", () => {
  // The patient's back arrow on Support navigates to "order". Two beats show
  // that screen — the CMA-led close-out first, then the patient-led order
  // beat — and goToScreen's first-match lookup parked the pointer on
  // close-out. The next forward press advanced close-out → order and
  // repainted the SAME screen: a dead click a viewer hit (2026-08-31).
  it("lands the patient on the order beat, not the CMA close-out", () => {
    const from = beatIndexById("support");
    const target = beatForScreenNear("patient", "order", from);
    expect(BEATS[target].id).toBe("order");
    expect(BEATS[target].lead).toBe("patient");
  });

  it("advances to Support on the first forward press after that back", () => {
    const target = beatForScreenNear("patient", "order", beatIndexById("support"));
    expect(nextBeat(target)).toBe(beatIndexById("support"));
  });

  it("prefers a beat this role leads whenever several show the same screen", () => {
    // Every patient screen with multiple beats must resolve to a patient-led
    // one from anywhere in the script, so no other screen hides this bug.
    const patientScreens = new Set(BEATS.map(b => b.screens.patient));
    for (const s of patientScreens) {
      const hasLed = BEATS.some(b => b.screens.patient === s && b.lead === "patient");
      if (!hasLed) continue; // ambient screens (e.g. during CMA-only stretches)
      for (let from = 0; from < BEATS.length; from++) {
        const i = beatForScreenNear("patient", s, from);
        expect(BEATS[i].lead, `navigating to "${s}" from beat ${from}`).toBe("patient");
      }
    }
  });

  it("still reports -1 for a screen outside the script", () => {
    expect(beatForScreenNear("patient", "intake-needs", 3)).toBe(-1);
  });
});

describe("route map scales to any column", () => {
  // In the CMA's tablet column the map's fixed 360×280 viewBox centered
  // itself while the markers kept phone-pixel offsets: the dashed route
  // floated in the middle, detached from the home and destination pins
  // (found 2026-08-31). The map must be drawn in container percentages.
  it("draws the route and markers in percentages, not phone pixels", () => {
    const src = sourceOf("components/screens/shared.tsx");
    const map = src.split(/(?=export function RouteMap)/)[1]?.split(/(?=export function )/)[0] ?? "";
    expect(map).toContain('preserveAspectRatio="none"');
    expect(map, "dashes must be normalised so they stay uniform at any width").toContain("pathLength");
    expect(map, "markers must sit at percentage coordinates").toMatch(/left-\[\d+%\]/);
    expect(map, "no fixed-pixel marker offsets or x/y animation").not.toMatch(/left-\d|top-\d|\{x:/);
  });
});

describe("pure-tone ring label clearance", () => {
  // On a real phone the sweep's completion label read "OTH EARS COMPLET" —
  // the first and last glyphs were gone (found 2026-08-31). Measured
  // headless, the loss is identical at every viewport and text size, because
  // everything involved scales in rem: "Both ears complete" in text-xs bold
  // uppercase with tracking-widest lays out ~181px wide at the 18px root,
  // but the ring's clear inner circle — the w-56 (14rem) card, minus the
  // svg's inset-4 on each side, times the circle's inner-stroke-edge
  // diameter 2·(43−6/2) of its 100-unit viewBox — is only 9.6rem = 172.8px
  // across at its widest. The line's ends therefore sat ON the progress
  // arc's stroke, and label and arc are the same brand teal (#12AAA5), so
  // once the arc completed under them those glyphs vanished into it. During
  // the sweep the arc under the label is still the pale #e6efef track,
  // which is why every earlier state looked fine and the bug only surfaced
  // at "Both ears complete". The centered stack must cap its own width
  // inside that clearance (in always-compiling arbitrary-rem syntax, per
  // the tailwind-scale lesson: a made-up bare max-w-N step could silently
  // emit no CSS) and let long labels wrap onto extra lines instead.
  const src = sourceOf("components/exam/puretone-step.tsx");

  const ring = /<div className="([^"]*\bgrid h-(\d+) w-(\d+)\b[^"]*\brounded-full\b[^"]*)">/.exec(src);
  if (!ring) throw new Error("could not locate the sweep ring container (grid h-N w-N … rounded-full) in puretone-step.tsx");
  const afterRing = src.slice(ring.index);

  const svgTag = /<svg className="([^"]*)"[^>]*viewBox="0 0 (\d+) \d+"/.exec(afterRing);
  if (!svgTag) throw new Error("could not locate the ring's svg/viewBox in puretone-step.tsx");
  const circleTag = /<circle[^>]*\br="(\d+)"[^>]*\bstrokeWidth="(\d+)"/.exec(afterRing);
  if (!circleTag) throw new Error("could not locate the ring's circle (r/strokeWidth) in puretone-step.tsx");

  const ringDiameterRem = Number(ring[3]) * SPACING_UNIT_REM;
  const insetMatch = /\binset-(\d+)\b/.exec(svgTag[1]);
  const insetRem = insetMatch ? Number(insetMatch[1]) * SPACING_UNIT_REM : 0;
  const viewBoxUnits = Number(svgTag[2]);
  const innerStrokeEdgeUnits = 2 * (Number(circleTag[1]) - Number(circleTag[2]) / 2);
  const svgBoxRem = ringDiameterRem - 2 * insetRem;
  const innerClearanceRem = svgBoxRem * (innerStrokeEdgeUnits / viewBoxUnits);

  it("keeps the ring a square, so the parsed diameter is the real geometry", () => {
    expect(ring![2]).toBe(ring![3]);
  });

  // The centered stack holds both branches (the live "Testing … ear" labels
  // and the completion label), so one cap on it covers every ring state.
  const centerDiv = /<div className="([^"]*\btext-center\b[^"]*)">/.exec(afterRing);
  const centerCls = centerDiv?.[1] ?? "";

  it("caps the ring's center stack narrower than the arc's clear inner circle", () => {
    expect(centerDiv, "could not find the centered text stack inside the sweep ring").toBeTruthy();
    const cap = /\bmax-w-\[([\d.]+)rem\]/.exec(centerCls);
    expect(
      cap,
      `the ring's center stack ("${centerCls}") has no max-w-[…rem] cap — an uncapped tracking-widest ` +
      `label line (~10rem for "Both ears complete") reaches the progress arc's stroke, where teal-on-teal ` +
      `renders it as "OTH EARS COMPLET"`,
    ).toBeTruthy();
    expect(
      Number(cap![1]),
      `max-w-[${cap![1]}rem] exceeds the ${innerClearanceRem}rem clear inner circle of the arc ` +
      `(${ringDiameterRem}rem ring − 2×${insetRem}rem svg inset, × ${innerStrokeEdgeUnits}/${viewBoxUnits} inner stroke edge)`,
    ).toBeLessThanOrEqual(innerClearanceRem);
  });

  it("lets a capped label wrap instead of clipping to one line", () => {
    // truncate/nowrap would turn the width cap into a different clip of the
    // same words — the cap only works because extra lines are allowed, and
    // there is vertical room for them at every state of the center stack.
    expect(centerCls).not.toMatch(/\btruncate\b|whitespace-nowrap/);
  });
});

/**
 * The chart world (design-chart-world branch): the audiogram's grammar —
 * named severity bands, plotted marks, real axes — is the product's interface
 * language, not a results-screen flourish. These pin the invariants that make
 * that claim true, so a later screen can't quietly drop back to plain tiles
 * or re-introduce the patterns this direction replaced.
 */
describe("chart world", () => {
  const audiogramSrc = sourceOf("components/charts/audiogram.tsx");
  const sparklineSrc = sourceOf("components/charts/exam-sparkline.tsx");
  const weekPlotSrc = sourceOf("components/charts/week-plot.tsx");
  const supervisionSrc = sourceOf("components/screens/audiologist/supervision.tsx");
  const resultsSrc = sourceOf("components/screens/patient/results.tsx");

  // The bands are the whole point: without them a threshold is a dot on an
  // axis the patient has to measure against. Every band needs its own name,
  // because "where the line lands" is the reading the screen states in words.
  it("names every severity band on the audiogram", () => {
    const bands = /const BANDS = \[([\s\S]*?)\n\];/.exec(audiogramSrc);
    expect(bands, "audiogram.tsx no longer defines a BANDS table").toBeTruthy();
    const labels = [...bands![1].matchAll(/label: "([^"]+)"/g)].map(m => m[1]);
    expect(labels).toEqual(["Normal", "Mild", "Moderate", "Severe"]);
  });

  // Bands must tile the plot with no gap and no overlap, or a threshold can
  // land in unpainted space and read as belonging to no band at all.
  it("tiles the plot with contiguous bands, edge to edge", () => {
    const bands = /const BANDS = \[([\s\S]*?)\n\];/.exec(audiogramSrc)![1];
    const rows = [...bands.matchAll(/from: (DB_MIN|[\d.]+), to: (DB_MAX|[\d.]+)/g)]
      .map(m => [m[1], m[2]] as const);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0][0]).toBe("DB_MIN");
    expect(rows[rows.length - 1][1]).toBe("DB_MAX");
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i][0], `band ${i} starts at ${rows[i][0]} but band ${i - 1} ended at ${rows[i - 1][1]}`)
        .toBe(rows[i - 1][1]);
    }
  });

  // A plot mark drawn with fill="none" over a painted band shows the band
  // through its middle and stops reading as a mark. Banded charts fill white.
  it("fills plot marks against a painted band", () => {
    expect(audiogramSrc).toMatch(/fill=\{bands \? "#fff" : "none"\}/);
    expect(sparklineSrc).toMatch(/fill="#fff"/);
  });

  // Bands and speech sounds are opt-in: the clinician's overlay stays
  // uncluttered, and a screen that wants the plain clinical chart still gets
  // one. Defaulting them on would silently restyle every existing caller.
  it("keeps bands and speech sounds opt-in", () => {
    expect(audiogramSrc).toMatch(/bands = false/);
    expect(audiogramSrc).toMatch(/speech = false/);
  });

  // The supervision panel's red flag used to pulse the entire card — motion
  // that reads as alarm while carrying no state, and which the product
  // register bans outright. It states itself in a row with its action instead.
  it("does not pulse the whole tile for a red flag", () => {
    expect(supervisionSrc).not.toMatch(/animate-pulse/);
    expect(supervisionSrc).toMatch(/Red flag/);
    expect(supervisionSrc).toMatch(/Respond/);
  });

  // Six exams read as six charts, which is the claim the panel makes about
  // the 1:many model. A tile that dropped its chart would be a text row again.
  it("draws a chart on every supervision tile", () => {
    expect(supervisionSrc).toMatch(/<ExamSparkline plotted=\{e\.plotted\}/);
  });

  // Expression may never obscure the task (product register): the week plot
  // presents the choice, but the choice itself stays a real radio group with
  // labelled, keyboard-operable controls.
  it("keeps the week plot's choice a real radio group", () => {
    expect(weekPlotSrc).toMatch(/role="radiogroup"/);
    expect(weekPlotSrc).toMatch(/role="radio"/);
    expect(weekPlotSrc).toMatch(/aria-checked=\{i === selected\}/);
    // The decorative plot must not also be announced; the buttons carry it.
    expect(weekPlotSrc).toMatch(/aria-hidden="true"/);
  });

  // Every tap target on the plot's control row obeys the low-vision floor.
  it("keeps the week plot's day buttons at the touch-target floor", () => {
    const btn = /className=\{`(min-h-\d+[^`]*)`\}/.exec(weekPlotSrc);
    expect(btn, "week-plot day button lost its min-height class").toBeTruthy();
    const min = /min-h-(\d+)/.exec(btn![1]);
    expect(Number(min![1]) * SPACING_UNIT_REM).toBeGreaterThanOrEqual(3.5);
  });

  // The results screen must say the reading in words, not leave the patient
  // to interpret the plot. That sentence is what makes the chart legible to
  // someone who has never read an audiogram.
  it("states the results reading in plain language", () => {
    expect(resultsSrc).toMatch(/bands speech/);
    expect(resultsSrc).toMatch(/lossBand\(e\.avg\)\.toLowerCase\(\)/);
  });

  // slate-400 fails contrast as anything longer than a two-word meta label
  // (DESIGN.md). The chart world's screens were swept; keep them swept.
  it("keeps the chart world's screens off slate-400", () => {
    for (const [name, src] of [
      ["supervision.tsx", supervisionSrc],
      ["results.tsx", resultsSrc],
      ["week-plot.tsx", weekPlotSrc],
    ] as const) {
      expect(src, `${name} re-introduced text-slate-400`).not.toMatch(/text-slate-400/);
    }
  });
});

/**
 * A chart's axis labels live inside the viewBox, so a left pad narrower than
 * the longest label clips it — "Afternoon" rendered as "ernoon" on the week
 * plot, which reads as a typo rather than a layout bug. One test per chart
 * that puts text left of its plot area.
 */
describe("chart axis labels fit inside the viewBox", () => {
  // Rough advance width for the UI face at a given font size. 0.5em per
  // character is generous for lowercase sans digits/letters and is the same
  // approximation the pad was sized against.
  const EM_PER_CHAR = 0.5;

  it("gives the week plot's row labels room to render in full", () => {
    const src = sourceOf("components/charts/week-plot.tsx");
    const padL = Number(/PAD_L = (\d+)/.exec(src)![1]);
    const fontSize = Number(/textAnchor="end" fontSize="([\d.]+)"/.exec(src)![1]);
    const gap = Number(/x=\{PAD_L - (\d+)\}/.exec(src)![1]);
    const rows = /const rows = \[([^\]]+)\]/.exec(src)![1];
    const longest = [...rows.matchAll(/"([^"]+)"/g)]
      .map(m => m[1])
      .reduce((a, b) => (b.length > a.length ? b : a), "");
    const needed = longest.length * fontSize * EM_PER_CHAR + gap;
    expect(
      padL,
      `PAD_L=${padL} clips "${longest}" (needs ~${Math.ceil(needed)} units at fontSize ${fontSize} ` +
      `plus a ${gap}-unit gap) — right-anchored axis text runs off the left edge of the viewBox`,
    ).toBeGreaterThanOrEqual(needed);
  });

  it("gives the audiogram's dB labels room to render in full", () => {
    const src = sourceOf("components/charts/audiogram.tsx");
    const padL = Number(/PAD_L = (\d+)/.exec(src)![1]);
    // The dB axis tops out at DB_MAX, so the widest label is its digit count.
    const dbMax = Number(/DB_MAX = (\d+)/.exec(src)![1]);
    const needed = String(dbMax).length * 8 * EM_PER_CHAR + 6;
    expect(padL).toBeGreaterThanOrEqual(needed);
  });
});

/**
 * A band label sits inside the plot area, so it shares space with the curve.
 * Right-anchored labels were struck through by the thresholds: hearing loss
 * slopes down to the right, so the right edge is exactly where the line ends
 * up. The label anchor has to be on the side the curve leaves clear.
 */
describe("audiogram band labels clear the plotted curve", () => {
  const src = sourceOf("components/charts/audiogram.tsx");

  it("anchors the severity labels away from where the curve lands", () => {
    const label = /<text x=\{(PAD_L \+ \d+|W - PAD_R - \d+)\} y=\{[^}]+\}\s+textAnchor="(start|end)"/
      .exec(src);
    expect(label, "could not find the band label text element in audiogram.tsx").toBeTruthy();
    const [, xExpr, anchor] = label!;
    // The demo's own thresholds slope downward, so the last frequency is the
    // worst. Assert against the data rather than hardcoding a side.
    const slopesDown = audiogram.right[audiogram.right.length - 1] > audiogram.right[0];
    if (slopesDown) {
      expect(
        anchor,
        `band labels are ${anchor}-anchored at ${xExpr}, but thresholds worsen toward the right ` +
        `(${audiogram.right[0]} → ${audiogram.right[audiogram.right.length - 1]} dB), so the curve ` +
        `runs through that corner and strikes the label out`,
      ).toBe("start");
      expect(xExpr).toMatch(/^PAD_L/);
    }
  });

  // The labels only stay clear because the left edge is where the curve is
  // highest. If a threshold at the first frequency ever reached the severe
  // band, the label would need to move again — this catches that data change.
  it("keeps the first threshold well above the lowest band", () => {
    const bands = /const BANDS = \[([\s\S]*?)\n\];/.exec(src)![1];
    const lastFrom = [...bands.matchAll(/from: (DB_MIN|[\d.]+),/g)].pop()![1];
    expect(lastFrom).not.toBe("DB_MIN");
    for (const ear of [audiogram.right, audiogram.left]) {
      expect(ear[0]).toBeLessThan(Number(lastFrom));
    }
  });
});

/**
 * An empty chart and a chart that failed to render look identical. Any tile
 * that can legitimately have nothing plotted has to say so in words, or the
 * supervisor reads a not-yet-started exam as a broken panel.
 */
describe("empty charts state their emptiness", () => {
  it("labels a supervision tile whose exam has not reached the hearing test", () => {
    const src = sourceOf("components/charts/exam-sparkline.tsx");
    expect(src).toMatch(/done\.length === 0 &&/);
    expect(src).toMatch(/not started/i);
  });

  // The empty state only matters because the queue actually contains such
  // exams. If every exam were mid-plot the label would be dead code — and if
  // `plotted` ever exceeds the frequency count the chart would silently clip.
  it("keeps every queued exam's plotted count inside the chart's range", () => {
    const n = audiogram.frequencies.length;
    for (const e of supervisionQueue) {
      expect(e.plotted, `${e.name} plots ${e.plotted} of ${n} thresholds`).toBeGreaterThanOrEqual(0);
      expect(e.plotted).toBeLessThanOrEqual(n);
    }
    expect(supervisionQueue.some(e => e.plotted === 0)).toBe(true);
  });
});

/**
 * Left-anchoring the band labels put them level with the dB axis numbers on
 * the same rows ("MILD" beside "20", "SEVERE" beside "60"). A label has to
 * clear the gridlines, not just the curve — moving text away from one
 * collision is how you land in the next one.
 */
describe("audiogram band labels clear the dB gridlines", () => {
  const src = sourceOf("components/charts/audiogram.tsx");

  it("computes label placement instead of pinning it to the band's top edge", () => {
    // y(b.from) + N puts the label a fixed offset below the band's boundary,
    // which is exactly where a gridline (and its axis number) sits.
    expect(
      src,
      "band labels are pinned to y(b.from), which is a gridline row — use bandLabelY()",
    ).not.toMatch(/y=\{y\(b\.from\) \+ \d+\}/);
    expect(src).toMatch(/y=\{bandLabelY\(b\.from, b\.to\)\}/);
  });

  it("keeps every band's label off every gridline", () => {
    const H = Number(/H = (\d+)/.exec(src)![1]);
    const padT = Number(/PAD_T = (\d+)/.exec(src)![1]);
    const padB = Number(/PAD_B = (\d+)/.exec(src)![1]);
    const dbMin = Number(/DB_MIN = (-?\d+)/.exec(src)![1]);
    const dbMax = Number(/DB_MAX = (\d+)/.exec(src)![1]);
    const yOf = (db: number) => padT + ((db - dbMin) / (dbMax - dbMin)) * (H - padT - padB);

    const bandsSrc = /const BANDS = \[([\s\S]*?)\n\];/.exec(src)![1];
    const bands = [...bandsSrc.matchAll(/from: (DB_MIN|-?[\d.]+), to: (DB_MAX|[\d.]+)/g)]
      .map(m => ({
        from: m[1] === "DB_MIN" ? dbMin : Number(m[1]),
        to: m[2] === "DB_MAX" ? dbMax : Number(m[2]),
      }));
    const gridlines = JSON.parse(
      /const DB_GRIDLINES = (\[[^\]]+\])/.exec(src)![1],
    ) as number[];

    // Mirror bandLabelY's arithmetic, then assert the result clears each line.
    for (const b of bands) {
      const mid = (Math.max(b.from, dbMin) + Math.min(b.to, dbMax)) / 2;
      const nudged = gridlines.some(g => Math.abs(yOf(g) - yOf(mid)) < 6) ? mid + 6 : mid;
      const labelY = yOf(nudged) + 3;
      for (const g of gridlines) {
        // The axis number's own baseline is y(g) + 3; a label within a few
        // units of it reads as one line of text across the chart.
        expect(
          Math.abs(labelY - (yOf(g) + 3)),
          `band ${b.from}–${b.to} labels at y=${labelY.toFixed(1)}, colliding with the ${g} dB axis number`,
        ).toBeGreaterThan(5);
      }
    }
  });
});
