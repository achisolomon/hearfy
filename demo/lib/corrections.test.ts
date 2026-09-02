import { describe, expect, it } from "vitest";
import { BEATS, ROLES, beatIndexById, isConditionalBeat, isTerminalBeat, nextBeat, nextBeatForRole, prevBeat } from "./story";
import { EXAM_STEPS } from "./exam";
import { clearanceOf, visitClearance, visitGates } from "./clearance";
import { compareCategories, devices, deviceDetail, tiers } from "./mock-data";
import { componentFiles, sourceOf } from "./screens";
import { existsSync } from "node:fs";
import { join } from "node:path";

/**
 * One test per item on the corrections sheet (2026-08-31, owner Achi Solomon).
 * Where the change is pure logic it asserts the logic; where it lives in JSX
 * it reads the source, the same way regressions.test.ts holds its invariants.
 */

describe("corrections sheet 2026-08-31", () => {
  // Item 1 — the door check verifies the person, not the kit.
  it("confirms identity by ID scan and SSN tail, never by kit ID", () => {
    const src = sourceOf("components/screens/cma/arrival.tsx");
    expect(src).not.toMatch(/Kit ID/);
    expect(src).toMatch(/Scan photo ID/);
    expect(src).toMatch(/ssnLast4/);
  });

  // Item 2 — consent starts unchecked; it is given, never presumed.
  it("starts every consent box unchecked", () => {
    const src = sourceOf("components/screens/cma/arrival.tsx");
    expect(src).not.toMatch(/care:\s*true/);
    expect(src).toMatch(/care:\s*false,\s*telehealth:\s*false,\s*recording:\s*false/);
  });

  // Item 3 — the ear health check captures one image per ear.
  it("renders one otoscopy capture per ear", () => {
    const src = sourceOf("components/exam/otoscopy-step.tsx");
    expect(src).toMatch(/Right ear/);
    expect(src).toMatch(/Left ear/);
    expect(src).not.toMatch(/>Both ears</);
  });

  // Item 4 — the hearing test shows two results, one per ear, in the step
  // and again on the results screen.
  it("presents pure tone results per ear in the step and the results screen", () => {
    for (const file of ["components/exam/puretone-step.tsx", "components/screens/patient/results.tsx"]) {
      const src = sourceOf(file);
      expect(src).toMatch(/Right ear/);
      expect(src).toMatch(/Left ear/);
    }
    // Superseded 2026-09-02: the results screen now shows ONE audiogram, the
    // same drawing the audiologist signed, because two different pictures of
    // one exam read as two different instruments. Item 4's requirement is a
    // result PER EAR, which the screen still states — as a dB HL + loss-band
    // reading for each ear above the shared chart, rather than two plots.
    const results = sourceOf("components/screens/patient/results.tsx");
    expect(results, "each ear still needs its own stated result")
      .toMatch(/\{e\.avg\} dB HL/);
    expect(results, "and its own loss band in words").toMatch(/lossBand\(e\.avg\)/);
    // Refined 2026-08-31: the sweep animates through BOTH ears via the
    // lib-tested advanceSweep state machine, not a frozen one-ear snapshot.
    expect(sourceOf("components/exam/puretone-step.tsx")).toMatch(/advanceSweep/);
  });

  // Item 5 — tympanometry is a full step between the ear check and the
  // hearing test, with a beat and a screen for both roles.
  it("runs tympanometry right after the ear health check", () => {
    const ids = EXAM_STEPS.map(s => s.id);
    expect(ids.indexOf("tympanometry")).toBe(ids.indexOf("otoscopy") + 1);
    // Named for what it is (Achi, 2026-08-31): the screen says Tympanometry.
    expect(EXAM_STEPS.find(s => s.id === "tympanometry")?.title).toBe("Tympanometry");
    expect(beatIndexById("tympanometry")).toBe(beatIndexById("otoscopy") + 1);
    const beat = BEATS[beatIndexById("tympanometry")];
    expect(beat.screens.cma).toBe("cma-tympanometry");
    expect(beat.screens.patient).toBe("tympanometry");
  });

  // Item 6 — bone conduction is mandatory; nothing frames it as added on.
  // Refined 2026-08-31: the audiologist MONITORS it like any other step —
  // no "Intervene / Add bone conduction" call to action.
  it("treats bone conduction as a standard step, never an addition", () => {
    expect(EXAM_STEPS.find(s => s.id === "bone")?.conditional).toBe(false);
    const src = sourceOf("components/screens/cma/exam.tsx");
    expect(src).not.toMatch(/added this step/);
    expect(src).not.toMatch(/· added/);
    const monitor = sourceOf("components/screens/audiologist/supervision.tsx");
    expect(monitor).not.toMatch(/Add bone conduction/);
    expect(monitor).not.toMatch(/>Intervene</);
  });

  // Item 9 — the step sells the service package, not the hardware.
  it("labels the compare step by service package", () => {
    expect(sourceOf("components/screens/registry.tsx")).toMatch(/compare:"Compare service packages"/);
    expect(sourceOf("components/screens/patient/commerce.tsx")).toMatch(/Compare service packages/);
  });

  // Refined 2026-08-31: the compare screen shows a picture of each device,
  // in both the desktop table and the phone cards.
  it("shows a device picture on the compare screen", () => {
    // The comparison moved into its own component when the CMA's tablet
    // started rendering it too; the thumbs moved with it.
    const src = sourceOf("components/screens/compare-table.tsx");
    expect((src.match(/DeviceThumb/g) ?? []).length).toBeGreaterThanOrEqual(3);
  });

  // The thumb went from a flat capsule to a shaded RIC with gradients, and
  // three of them render side by side on the compare table. SVG ids are
  // document-global: a fixed id in <defs> would make all three shells adopt
  // whichever gradient resolved last, so every id must derive from `finish`.
  it("derives the device picture's SVG ids from the finish", () => {
    const src = sourceOf("components/device-thumb.tsx");
    const ids = src.match(/id=\{?["`][^"`}]*/g) ?? [];
    expect(ids.length, "the drawing should define gradients").toBeGreaterThan(0);
    for (const id of ids) {
      expect(id, `${id} must be per-instance, not a fixed string`).toMatch(/\$\{uid\}|`/);
    }
    // And each reference must point at the same per-instance id.
    expect(src).not.toMatch(/url\(#[a-z]/i);
  });

  // Three flat colour swatches read as one product in three paints only if the
  // paints stay far enough apart to tell apart on a phone.
  it("gives each device a visually distinct finish", () => {
    const finishes = devices.map(d => deviceDetail[d.name].finish.toLowerCase());
    expect(new Set(finishes).size, "each device needs its own finish").toBe(devices.length);
  });

  // Every screen that touches a device dereferences deviceDetail[d.name] —
  // the try-on crash class — and the thumbs need a finish, the tiers a
  // price. One integrity check keeps a new device from arriving half-built.
  it("gives every device a complete detail record", () => {
    for (const d of devices) {
      const detail = deviceDetail[d.name];
      expect(detail, `${d.name} needs a deviceDetail entry`).toBeTruthy();
      expect(detail.finish, `${d.name} needs a finish for its picture`).toMatch(/^#[0-9a-f]{6}$/i);
      expect(tiers.map(t => t.id), `${d.name} must sit in a real tier`).toContain(detail.tier);
      for (const cat of compareCategories) {
        expect(detail.compare[cat], `${d.name} must fill "${cat}"`).toBeTruthy();
      }
    }
  });

  // The dispensed pair's serial numbers come from mock-data's `serials` —
  // three screens show them, and a literal in any of them can drift.
  it("never hardcodes the device serial numbers in a screen", () => {
    for (const file of componentFiles()) {
      expect(sourceOf(file), `${file} must read serials from mock-data`).not.toMatch(/HF-2284/);
    }
  });

  // Item 12 — a signing beat sits between checkout and activation. Refined
  // 2026-08-31: the PATIENT leads it — contract, terms, card and signature
  // are approved on the patient's own phone, and the CMA's screen is a
  // read-only mirror of those inputs (lib/signing is the shared store; its
  // own test file pins that every approval starts unchecked).
  it("requires the patient's signing page before activation", () => {
    const signing = beatIndexById("signing");
    expect(signing).toBe(beatIndexById("checkout") + 1);
    expect(beatIndexById("activate")).toBe(signing + 1);
    expect(BEATS[signing].lead).toBe("patient");
    expect(BEATS[signing].screens.patient).toBe("signing");
    expect(BEATS[signing].screens.cma).toBe("cma-signing");
    // The patient screen owns the actions; the CMA mirror can take none.
    const patientSrc = sourceOf("components/screens/patient/commerce.tsx");
    expect(patientSrc).toMatch(/toggleSigningItem/);
    expect(patientSrc).toMatch(/onClick=\{sign\}/);
    const cmaSrc = sourceOf("components/screens/cma/suitcase.tsx");
    expect(cmaSrc).toMatch(/useSigning/);
    expect(cmaSrc, "the CMA mirror must not write signing state").not.toMatch(/toggleSigningItem|[^.]sign\(\)/);
  });

  // Item 13 — the call runs from the first exam step until the patient is
  // fitted and happy, on BOTH sides. Refined 2026-08-31: identity, consent
  // and the kit checklist are the CMA's own pre-exam tasks (no call there),
  // and on a tablet the call is a Zoom-like half of the screen.
  it("keeps the call live from the first exam step until the fit, both sides", () => {
    const withCall = [
      "components/screens/cma/exam.tsx",
      "components/screens/cma/handoff.tsx",
      "components/screens/cma/suitcase.tsx",
    ];
    for (const file of withCall) {
      expect(sourceOf(file), `${file} must render the call split`).toMatch(/CallSplit/);
    }
    const withoutCall = [
      "components/screens/cma/arrival.tsx",
      "components/screens/cma/setup.tsx",
    ];
    for (const file of withoutCall) {
      expect(sourceOf(file), `${file} is pre-exam — no call`).not.toMatch(/CallSplit|AudiologistCallTile/);
    }
    // The audiologist sees the room on every screen of hers until the
    // prescription is locked — monitoring, review, signature, consult.
    for (const file of [
      "components/screens/audiologist/supervision.tsx",
      "components/screens/audiologist/review.tsx",
      "components/screens/audiologist/consult.tsx",
    ]) {
      expect(sourceOf(file), `${file} must render the home feed`).toMatch(/HomeFeed/);
    }
    expect(sourceOf("components/screens/audiologist/home-feed.tsx")).toMatch(/Talk to the room/);
    // Each of those files holds TWO screens (monitor is one; review holds
    // review + signature; consult holds consult + prescription) — the feed
    // must be on both, not just the file: import plus two usages.
    for (const file of [
      "components/screens/audiologist/review.tsx",
      "components/screens/audiologist/consult.tsx",
    ]) {
      const uses = sourceOf(file).match(/HomeFeed/g) ?? [];
      expect(uses.length, `${file}: both of its screens need the feed`).toBeGreaterThanOrEqual(3);
    }
    // And the call ENDS when the patient is fitted and happy: activation is
    // the last CMA screen on the call; the close-out is off it.
    const suitcaseScreens = sourceOf("components/screens/cma/suitcase.tsx").split(/(?=export function )/);
    const activate = suitcaseScreens.find(s => s.startsWith("export function CmaActivate"));
    const closeout = suitcaseScreens.find(s => s.startsWith("export function CmaCloseout"));
    expect(activate, "CmaActivate is still on the call").toMatch(/CallSplit/);
    expect(closeout, "CmaCloseout is after the call ends").not.toMatch(/CallSplit/);
    // Only the audiologist sells (sheet item 13's core rule) — the sale
    // screens must say so, not merely show her.
    // The sentence now reaches the screen from mock-data (`cmaNote`), which
    // the suitcase renders — assert on what the two files carry together, so
    // the rule stays stated wherever the copy happens to live.
    const saleCopy = sourceOf("components/screens/cma/suitcase.tsx") + sourceOf("lib/mock-data.ts");
    expect(saleCopy).toMatch(/only Dr\. Reed recommends and sells/);
    expect(sourceOf("components/screens/cma/suitcase.tsx")).toMatch(/compareRecommendation\.cmaNote/);
  });

  // Refined 2026-08-31: exam step numbering is DERIVED from the step lists —
  // the hand-numbered "Step N of 5" eyebrows are what let tympanometry's
  // arrival silently misnumber every screen.
  it("derives the CMA exam numbering instead of hardcoding it", () => {
    const src = sourceOf("components/screens/cma/exam.tsx");
    expect(src).not.toMatch(/"Step \d+ of \d+"/);
    expect(src).toMatch(/CMA_STEPS\.length/);
    const patientExam = sourceOf("components/screens/patient/exam.tsx");
    expect(patientExam).not.toMatch(/"Visit \d+ of \d+"/);
    expect(patientExam).toMatch(/VISIT_FLOW\.length/);
  });

  // The back-from-Support fix must stay wired: free navigation resolves
  // through the nearest-role-led lookup, not the first-match one
  // (lib/regressions.test.ts pins the lookup's behaviour itself).
  it("routes free navigation through beatForScreenNear", () => {
    expect(sourceOf("components/shell/story-context.tsx")).toMatch(/beatForScreenNear\(role, screen, beat\)/);
  });

  // Refined 2026-08-31: the video is the SAME size in the SAME place on
  // every screen that carries it — the geometry lives in exactly one
  // component, and every video screen on both sides renders through it.
  it("defines the call's size and place in one component only", () => {
    const geometry = /minmax\(0,380px\)/;
    expect(sourceOf("components/screens/video-split.tsx")).toMatch(geometry);
    for (const file of componentFiles()) {
      if (file.endsWith("video-split.tsx")) continue;
      expect(sourceOf(file), `${file} must not define its own video column`).not.toMatch(geometry);
    }
    for (const file of [
      "components/screens/cma/call-tile.tsx",
      "components/screens/audiologist/supervision.tsx",
      "components/screens/audiologist/review.tsx",
      "components/screens/audiologist/consult.tsx",
    ]) {
      expect(sourceOf(file), `${file} must place its video via VideoSplit`).toMatch(/VideoSplit/);
    }
  });

  // Refined 2026-08-31: every audiologist screen opens with the same page
  // header — eyebrow plus title — including the two sign-off screens,
  // which used to start at a bare card.
  //
  // Strengthened 2026-08-31 (critique): "the same header" now means the shared
  // PageHeader component, not a hand-rolled span that happens to match its
  // letter-spacing. The audiologist was the only role of four whose screens
  // rolled their own, which is how seven eyebrows ended up at Vital Teal on
  // light — 2.87:1, against the rule DESIGN.md already states. PageHeader
  // switches to Teal Ink on a light surface, so routing through it fixes every
  // instance at once and stops the next one being typed.
  it("gives every audiologist screen the standard page header", () => {
    for (const file of [
      "components/screens/audiologist/supervision.tsx",
      "components/screens/audiologist/review.tsx",
      "components/screens/audiologist/consult.tsx",
    ]) {
      const src = sourceOf(file);
      const headers = src.match(/<PageHeader\b/g) ?? [];
      expect(headers.length, `${file} holds two screens — each needs a PageHeader`).toBeGreaterThanOrEqual(2);
      expect(src, `${file} must not hand-roll an eyebrow`).not.toMatch(/tracking-\[\.2em\]/);
    }
  });

  // Refined 2026-08-31: the patient's exam feels like a hearing lab with the
  // audiologist right next to them — she is present on every exam step of the
  // patient's phone. Refined again 2026-09-02 (owner): her presence is no
  // longer a video tile, because the patient's pages carry no video streaming
  // at all. What the rule was always protecting is that she is THERE on each
  // step, so the guard asserts the presence, not the medium — a screen that
  // drops her line entirely still fails here, which is the point.
  it("keeps Dr. Reed next to the patient through the exam", () => {
    const src = sourceOf("components/screens/patient/exam.tsx");
    const steps = ["Otoscopy", "Tympanometry", "Testing"];
    for (const part of src.split(/(?=export function )/)) {
      const name = /export function (\w+)/.exec(part)?.[1];
      if (!name || !steps.includes(name)) continue;
      expect(part, `${name} must still say Dr. Reed is with the patient`)
        .toMatch(/<AudiologistStatusLine[^]*?Dr\. Reed/);
    }
  });

  // Only the patient is on a phone (refined 2026-08-31): every CMA screen
  // uses the tablet column, not the phone-width strip.
  //
  // Two components render that column, and the test asks for EITHER (owner,
  // 2026-09-01): `Shell tablet` for a CMA screen with no video, `CallShell`
  // for one carrying the call. They resolve to the same max-width ramp on
  // purpose — CallShell exists to give the video the same container on both
  // roles — so a screen using it is as much "laid out for a tablet" as one
  // using Shell. Pinning the NAME would have failed a screen that satisfies
  // the rule, which is the tell of a guard testing spelling over behaviour.
  it("lays out every CMA screen for a tablet", () => {
    for (const file of [
      "components/screens/cma/day.tsx",
      "components/screens/cma/arrival.tsx",
      "components/screens/cma/setup.tsx",
      "components/screens/cma/exam.tsx",
      "components/screens/cma/handoff.tsx",
      "components/screens/cma/suitcase.tsx",
    ]) {
      expect(sourceOf(file), `${file} must use the tablet column (Shell tablet or CallShell)`)
        .toMatch(/<Shell tablet>|<CallShell[\s>]/);
    }
  });

  // And the two must actually BE the same column, or the sentence above is a
  // lie and the video moves between a CMA beat and an audiologist one. Both
  // ramps are pinned here so widening one without the other fails loudly.
  it("gives Shell tablet and CallShell the same width ramp", () => {
    const ramp = /max-w-md[^"]*md:max-w-3xl[^"]*lg:max-w-4xl[^"]*xl:max-w-6xl/;
    const shell = sourceOf("components/screens/shared.tsx");
    const call = sourceOf("components/screens/video-split.tsx");
    expect(shell, "Shell's tablet ramp changed").toMatch(/max-w-md md:max-w-3xl lg:max-w-4xl xl:max-w-6xl/);
    expect(call, "CallShell must use that same ramp").toMatch(ramp);
    // Same horizontal padding, or the column starts at a different x even
    // with an identical max-width.
    expect(call, "CallShell must use Shell's px-5").toMatch(/px-5/);
  });

  // Items 5, 12 — every CMA screen a beat points at must be wired in the
  // role view, or the shell falls back to a "not built yet" stub mid-demo.
  it("wires every CMA screen the script points at", () => {
    const roleView = sourceOf("components/shell/role-view.tsx");
    const cmaScreens = [...new Set(BEATS.map(b => b.screens.cma))];
    for (const id of cmaScreens) {
      expect(roleView, `role-view must handle ${id}`).toContain(`case "${id}"`);
    }
  });

  // Item 14 — the after-delivery screen carries the whole care record and
  // the calibration service mock.
  it("summarises the care record and offers calibration after delivery", () => {
    const src = sourceOf("components/screens/patient/support.tsx");
    for (const marker of ["Hearing results", "serials", "visitHistory", "membership", "Documents you signed", "Calibrate my devices"]) {
      expect(src, `support screen must include ${marker}`).toContain(marker);
    }
  });
});

/**
 * The audiologist critique (2026-08-31, owner Achi Solomon). Six screens
 * scored 22/40; these hold the fixes that answered it.
 */
describe("audiologist critique 2026-08-31", () => {
  // P0 — a pulsing red border that opened nothing. The alarm has to discharge,
  // or the clinician learns to ignore it (and "state over decoration" becomes
  // decoration).
  it("lets the audiologist acknowledge a red-flagged exam", () => {
    const peek = sourceOf("components/screens/audiologist/peek.tsx");
    expect(peek).toMatch(/Acknowledge &amp; route to on-call/);
    expect(peek, "the flag must say what it is, not just that it exists").toMatch(/flagReason/);

    const sup = sourceOf("components/screens/audiologist/supervision.tsx");
    expect(sup, "acknowledging must clear the pulse").toMatch(/flagging\s*=\s*e\.redFlag && !acknowledged/);
    expect(sup).toMatch(/setAcked/);
  });

  // The peek is the ceiling the persona spec sets for a non-hero exam: it may
  // show state, never a second live call. Two feeds on screen would contradict
  // "one call, one room" and duplicate the geometry VideoSplit owns.
  it("keeps the peek card read-only, with no second video feed", () => {
    // Strip comments first: this file explains in prose why it renders neither,
    // and the explanation must not read as the thing it forbids.
    const peek = sourceOf("components/screens/audiologist/peek.tsx")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/.*$/gm, "");
    expect(peek).not.toMatch(/HomeFeed|VideoSplit/);
    expect(peek, "only the hero opens full monitoring").toMatch(/\{exam\.hero &&/);
    expect(peek).toMatch(/Open full monitoring/);
  });

  // P0 — signing releases results to the patient AND freezes the record, in
  // one action, and shipped on a single tap. lib/latch.ts already treats
  // irreversibility as worth engineering; this is that rigor at the trigger.
  it("puts a confirmation step in front of both irreversible commitments", () => {
    const confirm = sourceOf("components/screens/audiologist/confirm-button.tsx");
    expect(confirm, "Escape must disarm").toMatch(/e\.key === "Escape"/);
    expect(confirm, "the armed state must not be a latch — it resets between beats")
      .toMatch(/useState\(false\)/);

    for (const file of [
      "components/screens/audiologist/review.tsx",
      "components/screens/audiologist/consult.tsx",
    ]) {
      const src = sourceOf(file);
      expect(src, `${file} must gate its commitment`).toMatch(/<ConfirmButton/);
      expect(src, `${file} must not fire the latch from a bare button`)
        .not.toMatch(/<PrimaryButton onClick=\{\w+Latch\.set\}/);
    }
  });

  // The clinician's own review showed less evidence than the patient's results
  // screen: no tympanometry (though the data existed, and the stiff left trace
  // is what corroborates the air–bone gap) and otoscopy as text only.
  it("shows the full exam evidence on the screen where candidacy is decided", () => {
    const src = sourceOf("components/screens/audiologist/review.tsx");
    expect(src, "tympanometry belongs on the review").toMatch(/tympanometry/);
    expect(src, "the captures themselves, not a description of them").toMatch(/<EarImage/);
    // One otoscopy view in the product: the review reuses the exam step's.
    expect(src).toMatch(/from "\.\.\/\.\.\/exam\/otoscopy-step"/);
  });

  // The otoscopy captures are real photographs, one per ear. The two must stay
  // two distinct files: a single image reused for both ears would show the same
  // organ twice under two different findings, and the review reads these as the
  // evidence behind the text beside them.
  it("renders a distinct otoscopy photograph per ear", () => {
    const src = sourceOf("components/exam/otoscopy-step.tsx");
    const srcs = [...src.matchAll(/\/exam\/(ear-[\w-]+\.jpg)/g)].map(m => m[1]);
    expect(srcs.length, "one capture per ear").toBe(2);
    expect(new Set(srcs).size, "the two ears must not share one image").toBe(2);

    // Both files ship, so a rename cannot leave the exam rendering blank frames.
    for (const file of srcs) {
      expect(
        existsSync(join(process.cwd(), "public/exam", file)),
        `${file} must exist in public/exam`,
      ).toBe(true);
    }

    // Captures carry alt text: the review is a clinical screen read by a
    // clinician, and an unlabelled <img> tells a screen reader nothing.
    expect(src).toMatch(/Otoscopy capture, left ear/);
    expect(src).toMatch(/Otoscopy capture, right ear/);

    // Every capture URL goes through asset(). Pages serves the demo under
    // /hearfy/, and a raw <img src="/exam/..."> resolves against the domain
    // root instead — which 404s in production while looking perfect on
    // localhost. Shipped exactly that way once: the cards rendered as empty
    // navy boxes on the deployed site because object-cover on a broken image
    // still paints the container's background.
    expect(src, "capture URLs must be basePath-aware").not.toMatch(
      /src:\s*"\/exam\//,
    );
    for (const file of srcs) {
      expect(src, `${file} must be wrapped in asset()`)
        .toMatch(new RegExp(`asset\\("/exam/${file.replace(".", "\\.")}"\\)`));
    }
  });

  // She authors the reasoning the patient later reads, so the consult has to
  // show that reasoning — not the marketing feature list.
  it("shows clinical fit factors on the consult, not the spec sheet", () => {
    const src = sourceOf("components/screens/audiologist/consult.tsx");
    expect(src).toMatch(/deviceDetail\[d\.name\]\.fitFactors/);
    expect(src).not.toMatch(/d\.features\.join/);
  });

  // The exclusion rationale names one device's fitting type. Achi chose to
  // pin the pairing rather than restructure the fixtures, so this is the pin:
  // reorder `devices` and the build fails instead of the screen quietly
  // stating something false about a real product.
  it("keeps the exclusion rationale married to the device it describes", () => {
    expect(devices[2].name).toBe("Oticon Intent 2");
    const src = sourceOf("components/screens/audiologist/consult.tsx");
    expect(src).toMatch(/devices\[2\]\.name/);
    expect(src, "the rationale is about an open fitting and the left air–bone gap")
      .toMatch(/open fitting is unsuitable/i);
  });

  // Vital Teal at eyebrow size measured 2.87:1 on the light ground — the exact
  // case DESIGN.md forbids. PageHeader owns the light/dark decision now, so no
  // audiologist screen may name the raw token for text again.
  // The rule is about TEXT below 18px: a lucide glyph sized in px, or an icon
  // sitting on the #edf8f7 tile, is not text and is not what fails to read.
  // So this looks for text-brand-teal in a class list that also sets a text
  // size — the eyebrow shape that actually shipped at 2.87:1.
  it("never puts Vital Teal text on the light ground", () => {
    for (const file of componentFiles().filter(f => f.includes("screens/audiologist/"))) {
      const src = sourceOf(file);
      for (const cls of src.match(/className="[^"]*text-brand-teal[^"]*"/g) ?? []) {
        expect(cls, `${file}: teal text below 18px must be Teal Ink`).not.toMatch(/text-\[\d/);
        expect(cls, `${file}: teal text below 18px must be Teal Ink`).not.toMatch(/text-(xs|sm|base)\b/);
      }
      expect(src, `${file} must not fill with brand-teal behind white text`)
        .not.toMatch(/bg-brand-teal text-white/);
    }
  });

  // "Ticking timers, advancing steps" (persona spec §2) — the panel read as a
  // screenshot. Motion is opt-out everywhere in this demo, so the interval
  // must not start under prefers-reduced-motion.
  it("advances the wait times, and stops for reduced motion", () => {
    const src = sourceOf("components/screens/audiologist/supervision.tsx");
    expect(src).toMatch(/setInterval/);
    expect(src).toMatch(/prefers-reduced-motion: reduce/);
    expect(src, "the interval must be cleared").toMatch(/clearInterval/);
  });

  // Every animation in the demo needs a reduced-motion path; the live dot was
  // the one that shipped without one.
  it("gives every audiologist animation a reduced-motion escape", () => {
    for (const file of componentFiles().filter(f => f.includes("screens/audiologist/"))) {
      const src = sourceOf(file);
      const pulses = (src.match(/animate-pulse/g) ?? []).length;
      const escapes = (src.match(/motion-reduce:animate-none/g) ?? []).length;
      expect(escapes, `${file}: ${pulses} animation(s), ${escapes} escape(s)`).toBe(pulses);
    }
  });
});

/* ---------------------------------------------------------------------- *
 * Owner, 2026-09-02 — the pre-test clearance gate.
 *
 * "If the tympanometry or otoscopy test failed, do not continue to the next
 *  step. Notify the patient he has to go to a doctor. In this case we cannot
 *  proceed with providing a hearing device, so we stop the process."
 * "We need a formal passing screen before the hearing test starts."
 * "The CMA screen should show a cleared-for-testing screen, while the
 *  audiologist screen should show a checklist for 3 items — pre-test
 *  questionnaire, otoscopy and tympanometry."
 * ---------------------------------------------------------------------- */
describe("the pre-test clearance gate", () => {
  // The gate is a BEAT, not a flourish inside the tympanometry screen: it has
  // to be somewhere the story can stop, and every role needs its own view of
  // a stop that affects all three of them.
  it("sits between tympanometry and the hearing test", () => {
    expect(beatIndexById("clearance")).toBe(beatIndexById("tympanometry") + 1);
    // The referral beat sits between the gate and the test: a stopped visit
    // ends there, so it is passed over on the way to puretone rather than
    // walked through (nothing advances out of it — see isTerminalBeat).
    expect(beatIndexById("referral")).toBe(beatIndexById("clearance") + 1);
    expect(beatIndexById("puretone")).toBe(beatIndexById("referral") + 1);
  });

  // The clinician decides; the CMA reports. Whoever leads the beat is who the
  // guided walk hands the decision to.
  it("is led by the audiologist, who signs the checks off", () => {
    const beat = BEATS[beatIndexById("clearance")];
    expect(beat.lead).toBe("audiologist");
    expect(beat.screens.audiologist).toBe("aud-clearance");
    expect(beat.screens.cma).toBe("cma-clearance");
    expect(beat.screens.patient).toBe("clearance");
  });

  // Three items, in the owner's order.
  it("checks exactly the three named items, in order", () => {
    expect(visitGates().map(g => g.label)).toEqual([
      "Pre-test questionnaire", "Otoscopy", "Tympanometry",
    ]);
  });

  // The whole point: a failed check must make the rest of the visit
  // unreachable. Asserted on the logic, because that is what both screens
  // branch on.
  it("stops the visit when otoscopy or tympanometry fails", () => {
    for (const bad of ["otoscopy", "tympanometry"]) {
      const gates = visitGates().map(g =>
        g.id === bad ? { ...g, verdict: "fail" as const } : g);
      const c = clearanceOf(gates);
      expect(c.stopped, `${bad} failure must stop the visit`).toBe(true);
      expect(c.cleared).toBe(false);
    }
  });

  // A stopped visit sells nothing. Both clinician-facing screens say so in
  // words, because "no device" is the instruction that is easiest to lose.
  it("tells both operators that no device is provided on a stopped visit", () => {
    for (const f of ["components/screens/cma/clearance.tsx",
                     "components/screens/audiologist/clearance.tsx"]) {
      const src = sourceOf(f);
      expect(src, `${f} must send the patient to a physician`).toMatch(/physician|doctor/i);
      expect(src, `${f} must rule out a device`).toMatch(/no device|device recommendation/i);
    }
  });

  // A gate with a bypass is not a gate. Neither clinical screen may offer a
  // way to continue into the exam once a check has failed.
  it("offers no override on a stopped visit", () => {
    for (const f of ["components/screens/cma/clearance.tsx",
                     "components/screens/audiologist/clearance.tsx"]) {
      const src = sourceOf(f);
      expect(src, `${f} must not offer a bypass`)
        .not.toMatch(/continue anyway|proceed anyway|override|skip check/i);
    }
  });

  // The patient is told, in his own words, on his own screen — the owner's
  // "notify the patient he has to go to a doctor".
  it("notifies the patient and names the doctor visit", () => {
    const src = sourceOf("components/screens/patient/exam.tsx");
    expect(src).toMatch(/Please see a doctor first/);
    expect(src).toMatch(/not going ahead with the hearing test or any hearing device/);
  });

  // Both clinical surfaces read ONE source of truth: the findings come from
  // lib/clearance, and whether the visit proceeds comes from Dr. Reed's review
  // via the shared store. Two independent accounts of either is the bug this
  // prevents — as is a screen that decides for itself.
  it("draws both clinicians' checklists from the shared findings", () => {
    for (const f of ["components/screens/cma/clearance.tsx",
                     "components/screens/audiologist/clearance.tsx"]) {
      expect(sourceOf(f), `${f} must read the shared gates`)
        .toMatch(/visitClearance\(\)|visitGates\(\)/);
    }
  });

  // Owner, 2026-09-02 (refined): the audiologist ticks the checklist herself.
  // A screen that computes the answer from the recorded tones is what made the
  // referral path unreachable — nobody on screen could say "I see a problem".
  it("lets the audiologist mark a critical issue herself", () => {
    const src = sourceOf("components/screens/audiologist/clearance.tsx");
    expect(src).toMatch(/Critical issue/);
    expect(src).toMatch(/No critical issue/);
    expect(src).toMatch(/reviewStore\.set\(/);
  });

  // Her decision must reach the other two roles, or Maya walks into the
  // hearing test Dr. Reed just stopped.
  it("makes the CMA and the patient follow her decision", () => {
    for (const f of ["components/screens/cma/clearance.tsx",
                     "components/screens/patient/exam.tsx"]) {
      expect(sourceOf(f), `${f} must read her review`).toMatch(/useReview\(\)/);
      expect(sourceOf(f), `${f} must branch on the outcome`).toMatch(/reviewOutcome\(/);
    }
  });

  // Pending is not permission. Before she has ruled, no screen may offer a way
  // into the hearing test.
  it("offers the CMA no way to start the test while the review is pending", () => {
    const src = sourceOf("components/screens/cma/clearance.tsx");
    // The start control lives in the `cleared` branch, which opens before the
    // pending block — so nothing after the pending block may start the test.
    const clearedBranch = src.search(/\)\s*:\s*cleared\s*\?\s*\(/);
    const startBtn = src.indexOf("Start hearing test</PrimaryButton>");
    const pending = src.indexOf("for review");
    expect(clearedBranch, "a distinct cleared branch must exist").toBeGreaterThan(-1);
    expect(startBtn, "the start control must exist").toBeGreaterThan(clearedBranch);
    expect(pending, "a pending branch must follow it").toBeGreaterThan(startBtn);
    // Nothing in the pending branch offers a way into the test.
    expect(src.slice(pending)).not.toMatch(/Start hearing test<\/PrimaryButton>/);
  });

  // Amber is not a failure. The hero's own ears are amber on both physical
  // checks, and the demo's main story has to reach the hearing test.
  it("lets the hero visit through on its noted findings", () => {
    expect(visitClearance().cleared).toBe(true);
  });
});

/* ---------------------------------------------------------------------- *
 * Owner, 2026-09-02 — the termination screen.
 *
 * "If I click on stop the visit, then I get to something I didn't expect.
 *  Expect a termination page, something that will tell Alex you need to go to
 *  a doctor, both on his application and on the CMA screen. And only then we
 *  can help with the hearing devices, but we cannot proceed until he sees a
 *  doctor."
 * ---------------------------------------------------------------------- */
describe("the referral termination beat", () => {
  // The bug: "Stop the visit and refer" called the story's shared next(),
  // whose next beat is puretone — so the stop button walked everyone into the
  // hearing test it had just forbidden.
  it("gives every role its own termination screen", () => {
    const beat = BEATS[beatIndexById("referral")];
    expect(beat.screens.patient).toBe("referral");
    expect(beat.screens.cma).toBe("cma-referral");
    expect(beat.screens.audiologist).toBe("aud-referral");
  });

  // Nothing advances out of a stopped visit — not the chrome's Next, not an
  // in-screen button. Asserted on the logic both go through.
  it("is terminal: no beat follows it", () => {
    expect(isTerminalBeat(beatIndexById("referral"))).toBe(true);
    expect(isTerminalBeat(beatIndexById("clearance"))).toBe(false);
    expect(isTerminalBeat(beatIndexById("puretone"))).toBe(false);
  });

  it("guards both forward paths in the shell", () => {
    const src = sourceOf("components/shell/story-context.tsx");
    // Both next() and advanceInRole() must bail on a terminal beat.
    expect(src.match(/if \(isTerminalBeat\(beat\)\) return;/g)?.length ?? 0)
      .toBeGreaterThanOrEqual(2);
  });

  // The stop buttons must GO somewhere, not call next().
  it("sends both clinicians to the referral screen, not onward", () => {
    expect(sourceOf("components/screens/audiologist/clearance.tsx"))
      .toMatch(/goToScreen\("aud-referral"\)/);
    expect(sourceOf("components/screens/cma/clearance.tsx"))
      .toMatch(/goToScreen\("cma-referral"\)/);
  });

  // The owner's message, on the patient's own screen: see a doctor, we cannot
  // proceed until you have, and afterwards we can still help with devices.
  it("tells the patient to see a doctor first, and that help follows", () => {
    const src = sourceOf("components/screens/patient/exam.tsx");
    expect(src).toMatch(/Please see a doctor about your ears/);
    expect(src).toMatch(/We cannot test your hearing until they have/);
    expect(src).toMatch(/help choosing a hearing device/);
  });

  // The CMA screen carries the same instruction, since she is the one in the
  // room when the visit ends.
  it("tells the CMA to pack up and hold the device conversation", () => {
    const src = sourceOf("components/screens/cma/referral.tsx");
    expect(src).toMatch(/Pack the kit/);
    expect(src).toMatch(/No device conversation/);
    expect(src).toMatch(/seeing a doctor first/);
  });

  // A terminal screen with a forward button is not terminal.
  it("offers no way onward from any termination screen", () => {
    for (const f of ["components/screens/cma/referral.tsx",
                     "components/screens/audiologist/referral.tsx"]) {
      const src = sourceOf(f);
      expect(src, `${f} must not take a next prop`).not.toMatch(/next=\{|next:\s*\(\)/);
      expect(src, `${f} must not offer a primary action`).not.toMatch(/<PrimaryButton/);
    }
  });

  // Owner, 2026-09-02: "tell him what failed, which issue did we find in the
  // exam, so that he can go to the doctor with that." Dr. Reed's screen listed
  // the flagged checks; Maya's and Alex's showed only the summary sentence, so
  // the person actually going to the doctor could not say what was found.
  it("shows the specific finding on the CMA's and the patient's screens", () => {
    for (const f of ["components/screens/cma/referral.tsx",
                     "components/screens/patient/exam.tsx"]) {
      expect(sourceOf(f), `${f} must list the flagged findings`)
        .toMatch(/patientFindings\(/);
    }
  });

  // He needs the clinical wording to hand over, not just the plain version.
  it("gives the patient the wording for his doctor", () => {
    const src = sourceOf("components/screens/patient/exam.tsx");
    expect(src).toMatch(/For your doctor:/);
    expect(src).toMatch(/This is not a diagnosis/);
  });

  // Found walking Alex's own story (2026-09-02): with NOTHING flagged, Next
  // carried him from the clearance screen straight onto "Your visit stops here
  // today" and told a cleared patient to see a doctor. The referral is opened
  // by a decision, never reached by walking.
  it("never walks into the referral when nothing was flagged", () => {
    const clearance = beatIndexById("clearance");
    const referral = beatIndexById("referral");
    expect(isConditionalBeat(referral)).toBe(true);
    // Guided walk steps over it.
    expect(nextBeat(clearance)).toBe(beatIndexById("puretone"));
    // Back does too, or undoing a Next lands on a referral that never happened.
    expect(prevBeat(beatIndexById("puretone"))).toBe(clearance);
    // And no role's solo walk includes it.
    for (const role of ROLES) {
      expect(nextBeatForRole(clearance, role), `${role} must not walk into the referral`)
        .not.toBe(referral);
    }
  });

  // A card that frames a heading and a disclaimer around nothing.
  it("hides the findings card when there is nothing to list", () => {
    for (const f of ["components/screens/patient/exam.tsx",
                     "components/screens/cma/referral.tsx"]) {
      expect(sourceOf(f), `${f} must guard the empty case`)
        .toMatch(/patientFindings\(review, visitGates\(\)\)\.length > 0 &&/);
    }
  });
});
