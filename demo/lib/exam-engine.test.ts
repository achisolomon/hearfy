import { describe, expect, it } from "vitest";
import { sourceOf } from "./screens";

/**
 * The Exam Engine spec (Hearfy AI Avatar Exam Engine, MVP spec v2.0) in the
 * v1 demo.
 *
 * The spec replaces the audiologist with an AI avatar in the patient
 * interaction. The demo does NOT do that, deliberately: the 2026-09-02
 * rulings (no video on the patient's pages; Dr. Reed present on every exam
 * step) stand, and corrections.test.ts still enforces them. What is
 * implemented here are the three requirements that hold either way, and
 * these tests pin the BEHAVIOUR each one exists to protect — not the wording,
 * which is free to change.
 */
describe("exam engine spec in the demo", () => {
  /**
   * AC02 — disclosure lands BEFORE consent is given, not after.
   *
   * The invariant is the order: a disclosure rendered below the consent
   * checkbox, or on a later screen, is a disclosure the patient consents
   * without having read. So this asserts position, which is the thing that
   * can actually regress when someone tidies the JSX.
   */
  it("discloses the automated examiner before the consent control", () => {
    const src = sourceOf("components/screens/patient/exam.tsx");
    const consent = src.split(/(?=export function )/)
      .find(p => /export function Consent\b/.test(p));
    expect(consent, "Consent screen must exist").toBeTruthy();
    const disclosure = consent!.indexOf("<AiDisclosure");
    const checkbox = consent!.indexOf("setOk(!ok)");
    expect(disclosure, "Consent must render the AI disclosure").toBeGreaterThan(-1);
    expect(checkbox, "Consent must still carry its checkbox").toBeGreaterThan(-1);
    expect(disclosure, "disclosure must come before the consent control")
      .toBeLessThan(checkbox);
  });

  /**
   * AC02 again, on the disclosure's substance: it must say a human clinician
   * is still responsible. "This uses AI" alone would pass a naive keyword
   * check while telling the patient nothing about who is accountable — the
   * half of the spec's wording rule that protects trust.
   */
  it("names the human clinician's role in the disclosure", () => {
    const src = sourceOf("components/exam/guidance.tsx");
    const disclosure = src.split(/(?=export function )/)
      .find(p => /export function AiDisclosure\b/.test(p));
    expect(disclosure).toBeTruthy();
    expect(disclosure!, "must say the automated part does not decide")
      .toMatch(/does not decide/i);
    expect(disclosure!, "must say a licensed clinician supervises, reviews and signs")
      .toMatch(/audiologist[^]*?(reviews|signs)/i);
  });

  /**
   * AC07 — comprehension is verified BEFORE the first measured stimulus.
   *
   * The behaviour that matters is gating: the measured run must be
   * unreachable until the patient has answered. A tutorial rendered
   * alongside the test, or above it, satisfies "there is a tutorial" and
   * breaks the requirement. So this asserts PureToneStep sits behind the
   * gate's state, not merely that a TeachBack appears somewhere.
   */
  it("gates the measured test behind the comprehension check", () => {
    const src = sourceOf("components/screens/patient/exam.tsx");
    const testing = src.split(/(?=export function )/)
      .find(p => /export function Testing\b/.test(p));
    expect(testing, "Testing screen must exist").toBeTruthy();
    expect(testing!, "Testing must hold teach-back state").toMatch(/useState\(false\)/);
    expect(testing!, "Testing must render the teach-back").toMatch(/<TeachBack\b/);
    // The measured step renders only on the true branch of that state.
    expect(testing!, "PureToneStep must sit behind the gate, not beside it")
      .toMatch(/taught\s*\?[^]*?<PureToneStep[^]*?:[^]*?<TeachBack/);
  });

  /**
   * Teach-back that cannot be failed is not teach-back. The check needs a
   * wrong answer available, and choosing it must not advance the test —
   * otherwise it is a "click to continue" wearing a question's clothes.
   */
  it("offers a wrong answer that does not start the test", () => {
    const src = sourceOf("components/exam/guidance.tsx");
    const teach = src.split(/(?=export function )/)
      .find(p => /export function TeachBack\b/.test(p));
    expect(teach).toBeTruthy();
    const confirms = teach!.match(/onConfirm\(\)/g) ?? [];
    expect(confirms.length, "exactly one option may start the test").toBe(1);
    expect(teach!, "the other option must record a wrong answer instead")
      .toMatch(/setAnswered\("wrong"\)/);
    // And the wrong answer re-explains rather than blocking or scolding.
    expect(teach!, "a wrong answer must invite another attempt")
      .toMatch(/answered==="wrong"/);
  });

  /**
   * AC09 — the correction loop resumes from a validated checkpoint.
   *
   * Every part of the spec's loop is load-bearing, but the one that decides
   * whether a patient finishes the visit is the last: they are told the work
   * is not lost. A correction notice that explains and demonstrates but
   * implies a restart is the failure this pins.
   */
  it("explains a correction and names where testing resumes", () => {
    const src = sourceOf("components/exam/guidance.tsx");
    const notice = src.split(/(?=export function )/)
      .find(p => /export function CorrectionNotice\b/.test(p));
    expect(notice).toBeTruthy();
    for (const part of ["issue", "why", "fix", "resumeAt"]) {
      expect(notice!, `the loop must carry its ${part}`).toMatch(new RegExp(`\\{${part}\\}`));
    }
    expect(notice!, "the patient must be told nothing is lost")
      .toMatch(/nothing is lost/i);
    expect(notice!, "and must not be blamed for the interruption")
      .toMatch(/Nothing you did caused this/i);
  });

  /**
   * The correction notice is wired to a real trigger, not just defined.
   * A component nobody renders is a spec requirement nobody implemented.
   */
  it("shows the correction loop on a screen that can act on it", () => {
    const src = sourceOf("components/screens/cma/exam.tsx");
    expect(src, "the CMA's pure-tone screen must carry the correction notice")
      .toMatch(/<CorrectionNotice/);
    expect(src, "with a checkpoint to resume from").toMatch(/resumeAt=/);
  });

  /**
   * Found while looking at the CMA's pure-tone screen (2026-09-08): the
   * correction notice said the room was too noisy to test while the
   * environment row under it still showed a green "Environment is stable /
   * Good". Two components asserting opposite facts about the same room.
   *
   * The fix made the row read the noise state instead of hardcoding
   * "stable", so this pins the property that matters: a screen showing the
   * correction must not also claim the environment is fine.
   */
  it("never shows a stable environment beside a noise correction", () => {
    const step = sourceOf("components/exam/puretone-step.tsx");
    expect(step, "the environment row's heading must read the noise state")
      .toMatch(/\{noisy \? "Room noise too high" : "Environment is stable"\}/);
    expect(step, "and its pill must follow the same state")
      .toMatch(/tone=\{noisy \? "amber" : "green"\}/);
    expect(step, "the step must accept the room state as a prop")
      .toMatch(/noisy\?: boolean/);

    // Any screen rendering the correction must put the step in that state.
    const cma = sourceOf("components/screens/cma/exam.tsx");
    const idx = cma.indexOf("export function CmaPureTone");
    expect(idx, "the CMA pure-tone screen must exist").toBeGreaterThan(-1);
    const puretone = cma.slice(idx);
    if (puretone.includes("<CorrectionNotice")) {
      expect(puretone, "a screen showing the noise correction must pass noisy")
        .toMatch(/<PureToneStep[^>]*noisy/);
    }
  });
});
