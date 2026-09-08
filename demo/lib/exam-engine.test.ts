import { describe, expect, it } from "vitest";
import { sourceOf } from "./screens";

/**
 * The Exam Engine spec (Hearfy AI Avatar Exam Engine, MVP spec v2.0) in the
 * v1 demo.
 *
 * The spec replaces the audiologist with an AI examiner in the patient
 * interaction, and on 2026-09-08 the owner asked for exactly that. So the
 * examiner now leads every normal patient step; Dr. Reed moved behind the
 * scenes to clearance, review, signature and escalation — which is the
 * spec's own MVP operating model, not a reduction of her role.
 *
 * The 2026-09-02 no-video ruling SURVIVES: the examiner is an animated mark,
 * not a feed, so regressions.test.ts's ban on video components in the
 * patient's screens is untouched and still enforced.
 *
 * These tests pin the BEHAVIOUR each requirement exists to protect — not the
 * wording, which is free to change.
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

  /**
   * AC01 — the examiner is visible through every normal step, and the
   * patient always has a way out of it.
   *
   * Two halves, both load-bearing. Presence without controls is a system
   * that talks at someone; controls without presence is a guide who left.
   */
  it("gives the patient the examiner and an escape hatch on every exam step", () => {
    const src = sourceOf("components/screens/patient/exam.tsx");
    const steps = ["Otoscopy", "Tympanometry", "Testing"];
    for (const part of src.split(/(?=export function )/)) {
      const name = /export function (\w+)/.exec(part)?.[1];
      if (!name || !steps.includes(name)) continue;
      expect(part, `${name} must show the examiner`).toMatch(/<ExaminerPanel\b/);
      expect(part, `${name} must offer the patient controls, including a human`)
        .toMatch(/<ExaminerControls\b/);
    }
  });

  /**
   * "No false humanity" (spec §4). The examiner is never presented as a
   * person: its disclosure travels with it rather than living only on the
   * consent screen, and it never claims a credential.
   */
  it("labels the examiner as AI wherever it appears", () => {
    const panel = sourceOf("components/exam/examiner-panel.tsx");
    // The disclosure is rendered unconditionally — not behind a prop or a
    // first-visit flag, which is how a disclosure quietly disappears.
    expect(panel, "the AI label must render unconditionally")
      .toMatch(/\{examiner\.disclosure\}/);
    expect(panel, "the examiner must not be given a clinical credential")
      .not.toMatch(/Au\.D|audiologist|licensed/i);
    const data = sourceOf("lib/mock-data.ts");
    expect(data, "the examiner's own record must say it is an AI")
      .toMatch(/disclosure:\s*"[^"]*AI/i);
  });

  /**
   * The no-video ruling (2026-09-02) survives the avatar. The spec asks for
   * a "video window", but it also asks for a graceful low-bandwidth mode and
   * forbids impersonating a human — an animated mark satisfies all three,
   * and keeps the patient's pages free of streaming.
   */
  it("keeps the examiner out of video", () => {
    const panel = sourceOf("components/exam/examiner-panel.tsx");
    expect(panel, "the examiner must not be a video element").not.toMatch(/<video\b/);
    expect(panel, "nor reuse the call-tile video components")
      .not.toMatch(/\b(ReedFeed|RoomFeed|HomeFeed|ZoomPanel|CallSplit|AudiologistStrip)\b/);
  });

  /**
   * AC17 / spec §3 — the CMA is asked to DO things, never told what they
   * mean. An assistance card that carried an interpretation would hand Maya
   * a clinical judgement the spec explicitly denies her.
   */
  it("asks the CMA for actions, never interpretations", () => {
    const card = sourceOf("components/exam/assistance.tsx");
    expect(card, "the assistance card must attribute the request to the examiner")
      .toMatch(/\{examiner\.name\}/);
    const cma = sourceOf("components/screens/cma/exam.tsx");
    const asks = [...cma.matchAll(/asks="([^"]*)"/g)].map(m => m[1]);
    expect(asks.length, "the CMA's exam steps must carry assistance requests")
      .toBeGreaterThan(2);
    for (const ask of asks) {
      expect(ask, `an assistance request must not interpret a finding: "${ask}"`)
        .not.toMatch(/\b(normal|abnormal|loss|conductive|sensorineural|diagnos|refer)\b/i);
    }
  });

  /**
   * AC11 — when a human takes over, the patient is told it is a handoff and
   * that context went with it. The spec's failure mode is a stranger
   * appearing mid-visit with no explanation.
   */
  it("explains the handoff when a human takes over", () => {
    const src = sourceOf("components/screens/patient/exam.tsx");
    const live = src.slice(src.indexOf("export function Live"));
    expect(live, "the escalation screen must frame the arrival as a handoff")
      .toMatch(/<HumanHandoff\b/);
    expect(live, "and must name the clinician from the record, not a literal")
      .toMatch(/\{clinician\.name\}/);
  });

  /**
   * Spec §2 — the audiologist supervises exceptions rather than watching
   * every normal session. Her queue must say so, or the demo shows the AI
   * doing the work while she still appears to watch all of it.
   */
  it("frames the audiologist's queue as exception supervision", () => {
    const sup = sourceOf("components/screens/audiologist/supervision.tsx");
    expect(sup, "her panel must name the examiner as the one running exams")
      .toMatch(/\{examiner\.name\}/);
    expect(sup, "and must be framed as exceptions, not blanket monitoring")
      .toMatch(/Exception supervision/i);
  });
});
