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
  const SPACING_UNIT_REM = 0.25;
  // Tailwind's default theme.spacing keys (the *bare* numeric utilities —
  // pb-38, bottom-38, h-38, etc.). A bare number NOT in this set compiles to
  // NOTHING: Tailwind's JIT only emits CSS for class names it recognizes, so
  // an off-scale utility like `pb-38` (there is no 38 — the scale jumps 36
  // -> 40) is silently dropped, the element gets zero padding, and nothing
  // in the DOM or a screenshot-free test run tells you the rule never
  // existed. This is exactly the bug that shipped: the old version of this
  // test parsed the integer out of `pb-38` and did correct arithmetic on
  // it, which made the class *look* covered while the browser applied none
  // of it. See tailwind.config.ts — theme.extend only adds colors and
  // boxShadow, no custom spacing step, so this set is the complete scale.
  const TAILWIND_SPACING_SCALE = new Set([
    0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 20,
    24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 72, 80, 96,
  ]);
  const assertOnScale = (raw: number, context: string) => {
    expect(
      TAILWIND_SPACING_SCALE.has(raw),
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
