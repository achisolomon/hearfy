"use client";
import { useState } from "react";
import { Activity,AlertTriangle,CreditCard,FileHeart,HeartPulse,Home,ShieldCheck,UserRound,Video,WalletCards } from "lucide-react";
import { Card,PageHeader,SecondaryButton,StatusPill } from "../../ui";
import { BRAND_NAME, patient } from "@/lib/mock-data";
import { createLatch } from "@/lib/latch";
import { showsDiversion } from "@/lib/red-flag";
import { ScreenId } from "../registry";
import { Option, Shell, StepPage } from "../shared";

// The story shell remounts the active screen on every navigation (not just
// distant round trips), so a red flag held only in useState would silently
// clear itself when a presenter steps back and forward again. This latch
// keeps "a red flag was raised" true across that remount, the same way
// consult.tsx keeps its lock outside useState.
const redFlagLatch = createLatch();

export function IntakeFor({go,back}:{go:(s:ScreenId)=>void;back:()=>void}){const [a,setA]=useState(0);return <StepPage title="Who is the visit for?" subtitle="You can book for yourself or someone you care for." step={1} onBack={back} onNext={()=>go("intake-needs")}><Option title="Myself" sub="I am the patient" icon={UserRound} active={a===0} onClick={()=>setA(0)}/><Option title="A family member" sub="I’ll help manage their care" icon={HeartPulse} active={a===1} onClick={()=>setA(1)}/></StepPage>}
// The needs the pre-visit questionnaire asks about co-occur — unclear speech
// in noise, a loud TV and ringing are commonly the SAME patient, not four
// different ones — so holding one `useState(0)` index here (owner,
// 2026-09-01) silently discarded every answer but the last one clicked, and
// the copy already promised otherwise ("You can add more later"). A Set of
// chosen titles replaces the index: clicking toggles rather than replaces,
// and the screen keeps the whole answer.
//
// The keys are the option TITLES rather than positions, so reordering or
// inserting a need cannot silently re-map an existing selection onto a
// different answer.
const NEEDS: {title:string;sub?:string}[] = [
  {title:"Speech is unclear",sub:"Especially in groups or background noise"},
  {title:"TV or phone volume is too high"},
  {title:"Ringing in the ears"},
  {title:"A recent change in hearing"},
];
export function IntakeNeeds({go,back}:{go:(s:ScreenId)=>void;back:()=>void}){
  const [chosen,setChosen] = useState<Set<string>>(new Set());
  // A new Set every toggle: mutating the held one keeps the same reference,
  // so React would bail out of the re-render and the tick would not appear.
  const toggle = (title:string)=>setChosen(prev=>{
    const next = new Set(prev);
    if(!next.delete(title)) next.add(title);
    return next;
  });
  // Nothing chosen is not an answer to "what are you noticing?", and the
  // step used to be un-skippable only because one option was preselected.
  // With a real empty state the button has to hold the door instead.
  const count = chosen.size;
  return <StepPage
    title="What are you noticing?"
    subtitle="Choose everything that applies. Most people notice more than one."
    step={2} onBack={back}
    onNext={()=>{if(count) go("intake-medical");}}
    nextDisabled={count===0}
    next={count>1?`Continue with ${count} answers`:"Continue"}>
    {/* `group`, not `radiogroup`: this list accepts several answers, and the
        count is announced so a screen-reader user hears the selection grow
        without having to re-read the list. */}
    <div role="group" aria-label="What are you noticing? Choose all that apply." className="space-y-3">
      {NEEDS.map(n=><Option key={n.title} title={n.title} sub={n.sub} multi
        active={chosen.has(n.title)} onClick={()=>toggle(n.title)}/>)}
    </div>
    <p role="status" className="text-center text-xs leading-5 text-slate-500">
      {count===0?"Select at least one to continue.":`${count} selected`}
    </p>
  </StepPage>;
}
const NONE_APPLY = "None of these apply to me";
const SYMPTOMS = [
  "Sudden hearing loss in the last 72 hours",
  "Pain, drainage or bleeding from an ear",
  "Dizziness or spinning",
  "Ringing in one ear only",
];
export function IntakeMedical({go,back}:{go:(s:ScreenId)=>void;back:()=>void}){
  // Tracks an explicit "go back" on this mount, so the still-set latch (which
  // survives a remount on purpose) doesn't override a deliberate dismissal.
  // Selecting a symptom clears it again — a dismissal that outlived the answer
  // it dismissed made every later symptom click a dead button.
  const [dismissed,setDismissed] = useState(false);
  // Hook first, then combine — inside a short-circuit it could be skipped and
  // React would see the hook count change.
  const everFlagged = redFlagLatch.use();
  const showDiversion = showsDiversion({everFlagged,dismissed});

  // Same shape as IntakeNeeds: a Set of chosen titles, keyed by title (not
  // index) so reordering the symptom list can never re-map an existing
  // answer onto a different one. Nothing preselected — the owner's bug was
  // exactly a preselected "None of these apply to me".
  const [chosen,setChosen] = useState<Set<string>>(new Set());
  // A patient may genuinely have several symptoms (dizziness AND ringing),
  // so ticking a symptom toggles it into the set alongside any others — but
  // "None of these apply to me" is mutually exclusive with all of them:
  // choosing it clears any ticked symptoms, and choosing any symptom clears
  // it. A new Set every call: mutating the held one keeps the same
  // reference, so React would bail out of the re-render and the tick would
  // not appear.
  const toggleSymptom = (title:string)=>setChosen(prev=>{
    const next = new Set(prev.has(NONE_APPLY)?[]:prev);
    if(!next.delete(title)) next.add(title);
    return next;
  });
  const noneChosen = chosen.has(NONE_APPLY);
  const toggleNone = ()=>setChosen(prev=>prev.has(NONE_APPLY)?new Set():new Set([NONE_APPLY]));
  const count = chosen.size;

  const goBack = ()=>setDismissed(true);

  // The diversion is a fresh answer, decided on Continue rather than on tap:
  // a patient must be able to tick a symptom, change their mind, and tick
  // "None of these" instead without diverting mid-thought. Only committing
  // with Continue raises the latch.
  const onContinue = ()=>{
    if(count===0) return;
    if(noneChosen){ go("intake-coverage"); return; }
    redFlagLatch.set();
    setDismissed(false);
  };

  if(showDiversion) return <Shell>
    <PageHeader title="Let's get this looked at first" subtitle="Booking is paused while a clinician reviews your answer." onBack={goBack} eyebrow="Routed to review"/>
    <Card className="p-5">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#fff6e8] text-[#9d6514]">
        <AlertTriangle size={22}/></span>
      <h3 className="mt-4 text-lg font-extrabold">A licensed clinician will contact you</h3>
      <p className="mt-3 text-[15px] leading-7 text-slate-600">
        The symptom you selected needs medical review before a hearing exam. We have sent your
        answers to our clinical team — expect a call within one business day.
      </p>
      <p className="mt-3 text-[15px] leading-7 text-slate-600">
        If symptoms are severe or getting worse, contact your doctor or emergency services now.
      </p>
    </Card>
    <div className="mt-6"><SecondaryButton onClick={goBack}>Go back and change my answer</SecondaryButton></div>
  </Shell>;

  return <StepPage
    title="A few safety questions"
    subtitle="These help us route you to the right care. Choose everything that applies."
    step={3} onBack={back}
    onNext={onContinue}
    nextDisabled={count===0}
    next={count>1?`Continue with ${count} answers`:"Continue"}>
    <div role="group" aria-label="A few safety questions. Choose all that apply." className="space-y-3">
      {SYMPTOMS.map(s=><Option key={s} title={s} multi
        active={chosen.has(s)} onClick={()=>toggleSymptom(s)}/>)}
      <Option title={NONE_APPLY} multi active={noneChosen} onClick={toggleNone}/>
    </div>
    <Card className="mt-4 p-4">
      <p className="text-sm leading-6 text-slate-500">
        {`${BRAND_NAME} does not replace emergency or ENT care. Red flags are reviewed before scheduling.`}
      </p>
    </Card>
  </StepPage>;
}
export function IntakeCoverage({go,back}:{go:(s:ScreenId)=>void;back:()=>void}){const [a,setA]=useState(0);return <StepPage title="How will you pay?" subtitle="Your $99 visit is self-pay. We can help you request reimbursement." step={4} onBack={back} onNext={()=>go("intake-plan")}><Option title="Use my insurance benefits" sub="We’ll create a personalized Superbill" icon={ShieldCheck} active={a===0} onClick={()=>setA(0)}/><Option title="Self-pay only" sub="No insurance paperwork needed" icon={WalletCards} active={a===1} onClick={()=>setA(1)}/><Option title="I’m not sure yet" sub="You can decide after the visit" icon={CreditCard} active={a===2} onClick={()=>setA(2)}/></StepPage>}
export function IntakePlan({go,back}:{go:(s:ScreenId)=>void;back:()=>void}){return <StepPage title="Your personalized plan" subtitle="Based on your answers, an at-home diagnostic visit is a good fit." step={5} onBack={back} onNext={()=>go("book-date")} next="Choose a visit"><Card className="overflow-hidden"><div className="bg-[#e7f8f7] p-5"><StatusPill>Good match</StatusPill><h2 className="mt-4 text-2xl font-extrabold">At-home hearing diagnostic</h2><p className="mt-2 text-sm leading-6 text-slate-600">A CMA brings the clinical kit. A licensed audiologist joins remotely.</p></div><div className="space-y-4 p-5">{[[Home,"Home visit"],[Activity,"Clinical-grade testing"],[Video,"Audiologist review"],[FileHeart,"Results and care plan"]].map(([Icon,t]:any)=><div key={t} className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f1f7f7] text-teal-ink"><Icon size={19}/></span><b className="text-sm">{t}</b></div>)}</div></Card><div className="rounded-2xl bg-brand-navy p-4 text-white"><span className="text-xs text-white/60">Estimated visit price</span><div className="mt-1 flex items-end justify-between"><b className="text-3xl">$99</b><span className="text-xs text-white/70">Superbill available</span></div></div></StepPage>}
