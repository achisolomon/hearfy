import { describe, expect, it } from "vitest";
import {
  GATE_ORDER, clearanceOf, gateFor, questionnaireGate, referralReason,
  verdictForTone, visitClearance, visitGates, worst,
  NO_REVIEW, REVIEWABLE, criticalGates, markReview, reviewOutcome, reviewReferralReason,
  type GateResult, type ReviewMark,
} from "./clearance";

const g = (id: string, verdict: GateResult["verdict"]): GateResult =>
  ({ id, label: id, verdict, detail: "" });

describe("verdict scoring", () => {
  it("maps each finding tone to a verdict", () => {
    expect(verdictForTone("green")).toBe("pass");
    expect(verdictForTone("amber")).toBe("noted");
    expect(verdictForTone("red")).toBe("fail");
  });

  it("takes the worse of two ears", () => {
    expect(worst("pass", "fail")).toBe("fail");
    expect(worst("noted", "pass")).toBe("noted");
    expect(worst("pass", "pass")).toBe("pass");
    expect(worst("fail", "noted")).toBe("fail");
  });

  // A failure in EITHER ear fails the check — one healthy ear does not license
  // a hearing test over a diseased one.
  it("fails a check when only one ear fails", () => {
    const r = gateFor("otoscopy", "Otoscopy", {
      left: { finding: "Perforated tympanic membrane", tone: "red" },
      right: { finding: "Clear canal", tone: "green" },
    });
    expect(r.verdict).toBe("fail");
    expect(r.detail).toBe("Left ear: Perforated tympanic membrane.");
  });

  it("names the ear that drove the verdict", () => {
    const r = gateFor("tympanometry", "Tympanometry", {
      left: { finding: "Normal", tone: "green" },
      right: { finding: "Flat trace, no peak", tone: "red" },
    });
    expect(r.detail).toBe("Right ear: Flat trace, no peak.");
  });

  it("says both ears are clear on a pass", () => {
    const r = gateFor("otoscopy", "Otoscopy", {
      left: { finding: "Clear", tone: "green" },
      right: { finding: "Clear", tone: "green" },
    });
    expect(r.verdict).toBe("pass");
    expect(r.detail).toBe("Both ears clear.");
  });
});

describe("the questionnaire gate", () => {
  it("passes a completed questionnaire with no red flags", () => {
    expect(questionnaireGate({ completedOn: "May 19, 2025", redFlagAnswers: 0, finding: "Completed" }).verdict)
      .toBe("pass");
  });

  // A red-flag answer is exactly what intake-medical exists to catch, so it
  // stops the visit as hard as a failed tympanogram does.
  it("fails on any red-flag answer", () => {
    const r = questionnaireGate({ completedOn: "May 19, 2025", redFlagAnswers: 1, finding: "x" });
    expect(r.verdict).toBe("fail");
    expect(r.detail).toMatch(/1 red-flag answer needs/);
  });

  it("pluralises multiple red flags", () => {
    expect(questionnaireGate({ completedOn: "May 19, 2025", redFlagAnswers: 2, finding: "x" }).detail)
      .toMatch(/2 red-flag answers need/);
  });

  // "Not answered" is not a pass: the checklist's claim is that the check was
  // actually done.
  it("fails an incomplete questionnaire", () => {
    const r = questionnaireGate({ completedOn: "", redFlagAnswers: 0, finding: "x" });
    expect(r.verdict).toBe("fail");
    expect(r.detail).toMatch(/Not completed/);
  });
});

describe("clearance", () => {
  it("clears when every gate passes", () => {
    const c = clearanceOf([g("a", "pass"), g("b", "pass")]);
    expect(c.cleared).toBe(true);
    expect(c.stopped).toBe(false);
    expect(c.failed).toEqual([]);
  });

  // The hero's own left ear is amber on both physical checks. `noted` must
  // NEVER stop the visit, or the demo's main story cannot run — and clinically
  // it is a finding to interpret, not a contraindication.
  it("clears when a gate is noted rather than failed", () => {
    const c = clearanceOf([g("a", "pass"), g("b", "noted")]);
    expect(c.cleared).toBe(true);
    expect(c.stopped).toBe(false);
  });

  it("stops on any failed gate", () => {
    const c = clearanceOf([g("a", "pass"), g("b", "fail"), g("c", "noted")]);
    expect(c.cleared).toBe(false);
    expect(c.stopped).toBe(true);
    expect(c.failed.map(f => f.id)).toEqual(["b"]);
  });

  it("cannot be both cleared and stopped", () => {
    for (const gates of [
      [g("a", "pass")], [g("a", "fail")], [g("a", "noted"), g("b", "fail")], [],
    ]) {
      const c = clearanceOf(gates);
      expect(c.cleared).toBe(!c.stopped);
    }
  });
});

describe("the referral message", () => {
  it("is empty when nothing stopped", () => {
    expect(referralReason(clearanceOf([g("a", "pass")]))).toBe("");
  });

  it("names the single failed check", () => {
    const c = clearanceOf([{ id: "t", label: "Tympanometry", verdict: "fail", detail: "" }]);
    expect(referralReason(c)).toMatch(/tympanometry finding needs a physician/);
  });

  it("lists several failed checks", () => {
    const c = clearanceOf([
      { id: "o", label: "Otoscopy", verdict: "fail", detail: "" },
      { id: "t", label: "Tympanometry", verdict: "fail", detail: "" },
    ]);
    expect(referralReason(c)).toMatch(/otoscopy and tympanometry/);
  });

  // The CMA is not licensed to diagnose, and a stopped visit sells nothing.
  // Both are properties of the words themselves, so they are asserted here.
  it("never diagnoses or mentions a device", () => {
    const c = clearanceOf([{ id: "o", label: "Otoscopy", verdict: "fail", detail: "" }]);
    const msg = referralReason(c);
    expect(msg).not.toMatch(/diagnos|infection|perforation/i);
    expect(msg).not.toMatch(/hearing aid|purchase|price|recommend/i);
    expect(msg).toMatch(/physician/);
  });
});

describe("this visit's gates", () => {
  // The order the audiologist's checklist shows (owner, 2026-09-02).
  it("lists the three checks in clinical order", () => {
    expect(visitGates().map(x => x.id)).toEqual([...GATE_ORDER]);
    expect(GATE_ORDER).toEqual(["questionnaire", "otoscopy", "tympanometry"]);
  });

  // The hero's story must reach the hearing test: his amber findings are
  // noted, not failures. If this ever flips, the whole demo stops at stage 4.
  it("clears the hero visit despite its amber findings", () => {
    const c = visitClearance();
    expect(c.cleared).toBe(true);
    expect(c.stopped).toBe(false);
    expect(c.gates.map(x => x.verdict)).toEqual(["pass", "noted", "noted"]);
  });

  it("gives every gate a label and a detail to show", () => {
    for (const gate of visitGates()) {
      expect(gate.label.length).toBeGreaterThan(0);
      expect(gate.detail.length).toBeGreaterThan(0);
    }
  });
});

describe("the audiologist's review", () => {
  // Owner, 2026-09-02: she ticks otoscopy and tympanometry. The questionnaire
  // was answered at intake and is not hers to rule on.
  it("gives her exactly the two physical checks to rule on", () => {
    expect([...REVIEWABLE]).toEqual(["otoscopy", "tympanometry"]);
    expect(REVIEWABLE).not.toContain("questionnaire");
  });

  it("starts with nothing decided", () => {
    expect(reviewOutcome(NO_REVIEW)).toBe("pending");
  });

  // THE rule this module exists for: an un-reviewed visit is not a cleared
  // visit. Treating "not yet stopped" as "go" would let the hearing test start
  // before anyone looked.
  it("stays pending until she has ruled on BOTH checks", () => {
    let s = markReview(NO_REVIEW, "otoscopy", "clear");
    expect(reviewOutcome(s)).toBe("pending");
    s = markReview(s, "tympanometry", "clear");
    expect(reviewOutcome(s)).toBe("cleared");
  });

  it("stops the visit the moment she flags anything critical", () => {
    const s = markReview(NO_REVIEW, "otoscopy", "critical");
    // Tympanometry is still pending — she does not have to finish the list to
    // stop something she has already seen.
    expect(s.tympanometry).toBe("pending");
    expect(reviewOutcome(s)).toBe("stopped");
  });

  it("keeps the visit stopped even if the other check is clear", () => {
    let s = markReview(NO_REVIEW, "otoscopy", "clear");
    s = markReview(s, "tympanometry", "critical");
    expect(reviewOutcome(s)).toBe("stopped");
  });

  it("is never more than one outcome at a time", () => {
    const marks: ReviewMark[] = ["pending", "clear", "critical"];
    for (const o of marks) for (const t of marks) {
      const out = reviewOutcome({ otoscopy: o, tympanometry: t });
      expect(["pending", "cleared", "stopped"]).toContain(out);
    }
  });

  // She can change her mind before committing.
  it("lets her revise a mark", () => {
    let s = markReview(NO_REVIEW, "otoscopy", "critical");
    expect(reviewOutcome(s)).toBe("stopped");
    s = markReview(s, "otoscopy", "clear");
    s = markReview(s, "tympanometry", "clear");
    expect(reviewOutcome(s)).toBe("cleared");
  });

  it("names only the checks she flagged, never the ones she cleared", () => {
    const gates = visitGates();
    let s = markReview(NO_REVIEW, "otoscopy", "clear");
    s = markReview(s, "tympanometry", "critical");
    expect(criticalGates(s, gates).map(g => g.id)).toEqual(["tympanometry"]);
    const msg = reviewReferralReason(s, gates);
    expect(msg).toMatch(/tympanometry/);
    expect(msg).not.toMatch(/otoscopy/);
  });

  it("lists both when she flags both", () => {
    let s = markReview(NO_REVIEW, "otoscopy", "critical");
    s = markReview(s, "tympanometry", "critical");
    expect(reviewReferralReason(s, visitGates())).toMatch(/otoscopy and tympanometry/);
  });

  // Same constraints as the automatic message: she refers, she does not
  // diagnose, and a stopped visit sells nothing.
  it("never diagnoses or mentions a device", () => {
    const s = markReview(NO_REVIEW, "otoscopy", "critical");
    const msg = reviewReferralReason(s, visitGates());
    expect(msg).not.toMatch(/diagnos|infection|perforation/i);
    expect(msg).not.toMatch(/hearing aid|purchase|price|recommend/i);
    expect(msg).toMatch(/physician/);
  });

  it("says nothing when she has flagged nothing", () => {
    expect(reviewReferralReason(NO_REVIEW, visitGates())).toBe("");
  });
});
