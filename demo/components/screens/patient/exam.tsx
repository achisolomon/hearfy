"use client";
import { useState } from "react";
import { Check,FileHeart,Phone,Stethoscope,Video,Volume2 } from "lucide-react";
import { Card,PageHeader,PrimaryButton } from "../../ui";
import { BRAND_NAME } from "@/lib/mock-data";
import { OtoscopyStep } from "../../exam/otoscopy-step";
import { TympanometryStep } from "../../exam/tympanometry-step";
import { PureToneStep } from "../../exam/puretone-step";
import { ScreenId } from "../registry";
import { Shell, AudiologistStatusLine } from "../shared";
import { reviewOutcome, reviewReferralReason, visitGates } from "@/lib/clearance";
import { useReview } from "@/lib/review-store";

// The visit's patient-facing steps, counted from one list so adding a step
// (as tympanometry was, corrections sheet item 5) renumbers every eyebrow —
// a hardcoded "N of 5" is exactly what lib/regressions.test.ts bans.
const VISIT_FLOW = ["setup", "otoscopy", "tympanometry", "clearance", "testing", "live"] as const;
const visitEyebrow = (id: (typeof VISIT_FLOW)[number]) =>
  `Visit ${VISIT_FLOW.indexOf(id) + 1} of ${VISIT_FLOW.length}`;

export function Consent({go,back}:{go:(s:ScreenId)=>void;back:()=>void}){const [ok,setOk]=useState(true);return <Shell><PageHeader title="Before we begin" subtitle="Please review and confirm today’s visit consent." onBack={back} eyebrow="Patient consent"/><Card className="p-5"><h3 className="font-extrabold">Today’s session may include</h3><div className="mt-4 space-y-4">{[[Video,"Secure video with your audiologist"],[FileHeart,"Clinical test data and images"],[Volume2,"Optional session recording for care quality"]].map(([I,t]:any)=><div key={t} className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#edf8f7] text-teal-ink"><I size={19}/></span><span className="text-sm font-semibold">{t}</span></div>)}</div></Card><button onClick={()=>setOk(!ok)} className="mt-4 flex w-full items-start gap-3 rounded-2xl bg-white p-4 text-left"><span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md border ${ok?"border-teal-ink bg-teal-ink text-white":"border-slate-300"}`}>{ok&&<Check size={15}/>}</span><span className="text-sm leading-6 text-slate-600">I understand and consent to the use of my information for this hearing-care visit.</span></button><div className="mt-6"><PrimaryButton disabled={!ok} onClick={()=>go("setup")}>Confirm and continue</PrimaryButton></div></Shell>}
// The patient's screen carries no button for a clinical act someone else
// performs — preparing the kit is Maya's act, not Alex's. The chrome's Next
// advances the story instead.
export function Setup({go,back}:{go:(s:ScreenId)=>void;back:()=>void}){return <Shell><PageHeader title={`Preparing the ${BRAND_NAME} kit`} subtitle="Maya is setting up your hearing lab, right here at home." onBack={back} eyebrow={visitEyebrow("setup")}/><div className="grid place-items-center rounded-[30px] bg-gradient-to-br from-[#e7f8f7] to-white py-10"><div className="relative h-36 w-56 rounded-[28px] bg-brand-navy shadow-card"><div className="absolute inset-x-8 top-8 h-16 rounded-xl bg-[#e6f7f6]"/><div className="absolute bottom-5 left-1/2 h-4 w-20 -translate-x-1/2 rounded-full bg-[#183b5e]"/></div></div><div className="mt-5 space-y-3">{["Kit identity verified","Equipment calibration current","Single-use items prepared","Room noise level acceptable"].map(x=><div key={x} className="flex items-center gap-3 rounded-2xl bg-white p-4"><span className="grid h-7 w-7 place-items-center rounded-full bg-[#dcf5ef] text-emerald-600"><Check size={16}/></span><b className="text-sm">{x}</b></div>)}</div><div className="mt-6"><AudiologistStatusLine>Maya is preparing the kit.</AudiologistStatusLine></div></Shell>}
// Two captures, one per ear (corrections sheet 2026-08-31, item 3) — the
// shared step renders both, so patient and CMA can never drift apart.
// The patient's screen carries no button for this clinical act, and no live
// video of Dr. Reed (owner, 2026-09-02: no video streaming on the patient's
// pages). Her presence is carried in words instead — a status line naming
// who is acting, the same pattern Setup and Arrived already use.
export function Otoscopy({go,back}:{go:(s:ScreenId)=>void;back:()=>void}){return <Shell><PageHeader title="Ear health check" subtitle="Maya is capturing a secure image of each ear for clinical review." onBack={back} eyebrow={visitEyebrow("otoscopy")}/><AudiologistStatusLine className="mb-4">Dr. Reed is right here with you — she sees each ear image as it’s captured.</AudiologistStatusLine><OtoscopyStep framing="patient"/><Card className="mt-4 flex gap-3 p-4"><Stethoscope className="text-teal-ink"/><p className="text-sm leading-6 text-slate-500">Images are reviewed by your licensed audiologist and stored with today’s clinical record.</p></Card></Shell>}
// New step (corrections sheet 2026-08-31, item 5): tympanometry between the
// ear health check and the hearing test, on every exam.
// Same reasoning as Otoscopy: a status line, not a video tile, says who is
// acting.
export function Tympanometry({go,back}:{go:(s:ScreenId)=>void;back:()=>void}){return <Shell><PageHeader title="Tympanometry" subtitle="A gentle middle ear check — pressure on each eardrum, nothing to do but sit still." onBack={back} eyebrow={visitEyebrow("tympanometry")}/><AudiologistStatusLine className="mb-4">Dr. Reed is watching your traces with you — nothing to do but sit still.</AudiologistStatusLine><TympanometryStep framing="patient"/></Shell>}
// The patient's own view of the safety gate (owner, 2026-09-02). He is told
// the checks passed and that the test is about to start — or, when they did
// not, that the visit is stopping and he is being referred to a doctor.
//
// Like every other clinical act in this flow, his screen carries no button:
// clearing the visit is Dr. Reed's decision, not his. What he gets is the
// plain-language version of the same three rows the clinicians are reading —
// the outcome, never the raw tones and trace types.
export function Clearance({go,back}:{go:(s:ScreenId)=>void;back:()=>void}){
  // Alex sees the outcome of Dr. Reed's review, in his own words. Never the
  // tones, trace types or her checklist — the outcome, and what happens next.
  const review = useReview();
  const outcome = reviewOutcome(review);
  const stopped = outcome === "stopped";
  return <Shell>
    <PageHeader
      title={stopped ? "We need to pause here" : outcome === "cleared" ? "Your ear checks are done" : "Your ear checks are with your audiologist"}
      subtitle={stopped
        ? "Your ear checks found something a doctor should look at before any hearing test."
        : outcome === "cleared"
          ? "Both ear checks are complete and your audiologist has cleared you for the hearing test."
          : "Dr. Reed is looking at both ear checks now. She will clear the hearing test when she is happy with them."}
      onBack={back}
      eyebrow={visitEyebrow("clearance")}/>
    {stopped ? <>
      <Card className="border-red-300 p-5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#fdeaea] text-[#b42318]"><Stethoscope size={18}/></span>
          <div>
            <b className="text-sm text-[#b42318]">Please see a doctor first</b>
            <p className="mt-2 text-sm leading-6 text-slate-600">{reviewReferralReason(review, visitGates())}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              We are not going ahead with the hearing test or any hearing device today.
              Dr. Reed will call you to explain what she saw and help you arrange the visit.
            </p>
          </div>
        </div>
      </Card>
      <div className="mt-6"><AudiologistStatusLine>Dr. Reed is calling you about the referral.</AudiologistStatusLine></div>
    </> : <>
      <div className="space-y-3">{[
        ["Your questionnaire", outcome === "cleared" ? "Reviewed by your audiologist." : "Answered before today\u2019s visit."],
        ["Ear health check","Images captured and read for both ears."],
        ["Middle ear check","Both eardrums measured."],
      ].map(([t,d])=><div key={t} className="flex items-start gap-3 rounded-2xl bg-white p-4">
        <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#dcf5ef] text-emerald-600"><Check size={16}/></span>
        <div><b className="text-sm">{t}</b><p className="mt-0.5 text-xs leading-5 text-slate-500">{d}</p></div>
      </div>)}</div>
      <Card className="mt-4 flex gap-3 p-4"><Stethoscope className="text-teal-ink"/><p className="text-sm leading-6 text-slate-500">Anything worth a closer look is noted on your record — Dr. Reed reads it alongside your results.</p></Card>
      <div className="mt-6"><AudiologistStatusLine>{outcome === "cleared" ? "Dr. Reed has cleared you for the hearing test." : "Dr. Reed is reviewing your ear checks."}</AudiologistStatusLine></div>
    </>}
  </Shell>
}
/**
 * Where a stopped visit ends for Alex (owner, 2026-09-02).
 *
 * The referral button used to call the story's shared `next()`, which walked
 * him straight into the hearing test he had just been told he could not have.
 * This is the destination that was missing.
 *
 * The message the owner asked for, in order: you need to see a doctor; we
 * cannot go further until you have; and once you have, we can help with
 * hearing devices. That last part matters — a stop that reads as a rejection
 * loses a patient who is still very much someone Hearfy can help, just not
 * today and not before a physician has looked.
 *
 * No forward control at all. The visit is over; his next step is a doctor,
 * not a button in this app.
 */
export function Referral({go,back}:{go:(s:ScreenId)=>void;back:()=>void}){
  const review = useReview();
  return <Shell>
    <PageHeader
      title="Your visit stops here today"
      subtitle="Maya has packed up the kit. Nothing is wrong with what you did — this is the safe next step."
      onBack={back}
      eyebrow="Referred to a doctor"/>
    <Card className="border-red-300 p-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#fdeaea] text-[#b42318]"><Stethoscope size={18}/></span>
        <div>
          <b className="text-sm text-[#b42318]">Please see a doctor about your ears</b>
          <p className="mt-2 text-sm leading-6 text-slate-600">{reviewReferralReason(review, visitGates())}</p>
        </div>
      </div>
    </Card>
    <Card className="mt-4 p-5">
      <b className="text-sm">What happens now</b>
      <div className="mt-4 space-y-4">
        {[
          ["1","See a doctor","Dr. Reed is calling you to explain what she saw and help you arrange the appointment. Your ear images and traces go with you."],
          ["2","Get their assessment","A physician needs to look at and treat what today\u2019s checks found. We cannot test your hearing until they have."],
          ["3","Come back to us","Once they clear you, we pick up right here \u2014 the hearing test, your results, and help choosing a hearing device if you need one."],
        ].map(([n,t,d])=>
          <div key={n} className="flex items-start gap-3">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#e8f9f8] text-xs font-extrabold text-teal-ink">{n}</span>
            <div><b className="text-sm">{t}</b><p className="mt-0.5 text-sm leading-6 text-slate-500">{d}</p></div>
          </div>)}
      </div>
    </Card>
    <Card className="mt-4 p-5">
      <b className="text-sm">Today&rsquo;s visit fee</b>
      <p className="mt-1 text-sm leading-6 text-slate-500">
        Nothing further is charged. The ear checks you had today are yours to keep and to
        show your doctor.
      </p>
    </Card>
    <div className="mt-6"><AudiologistStatusLine>Dr. Reed is calling you about the referral.</AudiologistStatusLine></div>
  </Shell>
}
// The "Complete test" button ended the whole procedure — Maya/Dr. Reed's
// call, not Alex's, so the patient's screen carries no button for it.
// `PureToneStep`'s own "tap when you hear a tone" button is UNTOUCHED: it is
// the patient's own audiometric response, the one clinical act that
// genuinely is his (see puretone-step.tsx).
export function Testing({go,back}:{go:(s:ScreenId)=>void;back:()=>void}){return <Shell><PageHeader title="Hearing test in progress" subtitle="Tap the button whenever you hear a tone, even if it is very soft." onBack={back} eyebrow={visitEyebrow("testing")}/><AudiologistStatusLine className="mb-4">Dr. Reed is listening with you — she adjusts the test as you press.</AudiologistStatusLine><PureToneStep framing="patient"/></Shell>}
// Ending the consult is Dr. Reed's own act, so the patient's screen carries
// no "Finish consultation" button — a status line is shown instead, and the
// chrome's Next advances the story. The red hang-up button in the call card
// is kept but made permanently inert rather than removed — its position and
// shape are part of what makes this read as a real call in progress, and Dr.
// Reed IS still on the line; only the ability to end HER session, from
// Alex's phone, is taken away. It keeps its aria-disabled and has no handler
// or hover affordance, matching how PrimaryButton's own `disabled` state is
// styled elsewhere in this file.
export function Live({go,back}:{go:(s:ScreenId)=>void;back:()=>void}){return <Shell><PageHeader title="Connected to your audiologist" subtitle="Dr. Susan Reed is reviewing your test in real time." onBack={back} eyebrow={visitEyebrow("live")}/><div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#e9f4f1] to-[#bddeea] pt-10 text-center text-brand-navy"><div className="mx-auto grid h-36 w-36 place-items-center rounded-full bg-white text-4xl font-extrabold shadow-card">SR</div><h2 className="mt-5 text-xl font-extrabold">Dr. Susan Reed, Au.D.</h2>{/* Not slate-500: this line sits on the call card's gradient, whose
            darkest end (#BDDEEA) leaves the muted token at 4.22:1. A deeper
            ink keeps it at 5.85:1 across the whole gradient. */}
        <p className="mt-1 text-sm text-[#3f5061]">Licensed Audiologist · Florida</p><div className="mt-8 flex justify-center gap-4 bg-white/70 py-5"><button className="grid h-14 w-14 place-items-center rounded-full bg-white"><Volume2/></button><button className="grid h-14 w-14 place-items-center rounded-full bg-white"><Video/></button><button aria-disabled className="grid h-14 w-14 place-items-center rounded-full bg-red-500/40 text-white cursor-default"><Phone className="rotate-[135deg]"/></button></div></div><p className="mt-5 flex items-center justify-center gap-2 text-sm font-semibold text-teal-ink"><span className="h-2 w-2 rounded-full bg-brand-teal"/>Secure clinical connection</p><div className="mt-5"><AudiologistStatusLine>Dr. Reed is reviewing your results with you.</AudiologistStatusLine></div></Shell>}
