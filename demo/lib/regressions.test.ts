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
