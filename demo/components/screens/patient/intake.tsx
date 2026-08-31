"use client";
import { useState } from "react";
import { Activity,AlertTriangle,CreditCard,FileHeart,HeartPulse,Home,ShieldCheck,UserRound,Video,WalletCards } from "lucide-react";
import { Card,PageHeader,SecondaryButton,StatusPill } from "../../ui";
import { BRAND_NAME, patient } from "@/lib/mock-data";
import { createLatch } from "@/lib/latch";
import { ScreenId } from "../registry";
import { Option, Shell, StepPage } from "../shared";

// The story shell remounts the active screen on every navigation (not just
// distant round trips), so a red flag held only in useState would silently
// clear itself when a presenter steps back and forward again. This latch
// keeps "a red flag was raised" true across that remount, the same way
// consult.tsx keeps its lock outside useState.
const redFlagLatch = createLatch();

export function IntakeFor({go,back}:{go:(s:ScreenId)=>void;back:()=>void}){const [a,setA]=useState(0);return <StepPage title="Who is the visit for?" subtitle="You can book for yourself or someone you care for." step={1} onBack={back} onNext={()=>go("intake-needs")}><Option title="Myself" sub="I am the patient" icon={UserRound} active={a===0} onClick={()=>setA(0)}/><Option title="A family member" sub="I’ll help manage their care" icon={HeartPulse} active={a===1} onClick={()=>setA(1)}/></StepPage>}
export function IntakeNeeds({go,back}:{go:(s:ScreenId)=>void;back:()=>void}){const [a,setA]=useState(0);return <StepPage title="What are you noticing?" subtitle="Choose the main issue. You can add more later." step={2} onBack={back} onNext={()=>go("intake-medical")}><Option title="Speech is unclear" sub="Especially in groups or background noise" active={a===0} onClick={()=>setA(0)}/><Option title="TV or phone volume is too high" active={a===1} onClick={()=>setA(1)}/><Option title="Ringing in the ears" active={a===2} onClick={()=>setA(2)}/><Option title="A recent change in hearing" active={a===3} onClick={()=>setA(3)}/></StepPage>}
export function IntakeMedical({go,back}:{go:(s:ScreenId)=>void;back:()=>void}){
  const [flagged,setFlagged] = useState(false);
  // Tracks an explicit "go back" on this mount, so the still-set latch (which
  // survives a remount on purpose) doesn't override a deliberate dismissal.
  const [dismissed,setDismissed] = useState(false);
  // Hook first, then combine — inside `||` it would be skipped once
  // `flagged` turns true, and React would see the hook count change.
  const everFlagged = redFlagLatch.use();
  const showDiversion = (flagged || everFlagged) && !dismissed;
  const symptoms = [
    "Sudden hearing loss in the last 72 hours",
    "Pain, drainage or bleeding from an ear",
    "Dizziness or spinning",
    "Ringing in one ear only",
  ];

  const goBack = ()=>{setFlagged(false);setDismissed(true);};

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

  return <Shell>
    <PageHeader title="A few safety questions" subtitle="These help us route you to the right care." onBack={back} eyebrow="Medical safety"/>
    <div className="space-y-3">
      {symptoms.map(s=><Option key={s} title={s} onClick={()=>{setFlagged(true);redFlagLatch.set();}}/>)}
      <Option title="None of these apply to me" onClick={()=>go("intake-coverage")} active/>
    </div>
    <Card className="mt-4 p-4">
      <p className="text-sm leading-6 text-slate-500">
        {`${BRAND_NAME} does not replace emergency or ENT care. Red flags are reviewed before scheduling.`}
      </p>
    </Card>
  </Shell>;
}
export function IntakeCoverage({go,back}:{go:(s:ScreenId)=>void;back:()=>void}){const [a,setA]=useState(0);return <StepPage title="How will you pay?" subtitle="Your $99 visit is self-pay. We can help you request reimbursement." step={4} onBack={back} onNext={()=>go("intake-plan")}><Option title="Use my insurance benefits" sub="We’ll create a personalized Superbill" icon={ShieldCheck} active={a===0} onClick={()=>setA(0)}/><Option title="Self-pay only" sub="No insurance paperwork needed" icon={WalletCards} active={a===1} onClick={()=>setA(1)}/><Option title="I’m not sure yet" sub="You can decide after the visit" icon={CreditCard} active={a===2} onClick={()=>setA(2)}/></StepPage>}
export function IntakePlan({go,back}:{go:(s:ScreenId)=>void;back:()=>void}){return <StepPage title="Your personalized plan" subtitle="Based on your answers, an at-home diagnostic visit is a good fit." step={5} onBack={back} onNext={()=>go("book-date")} next="Choose a visit"><Card className="overflow-hidden"><div className="bg-[#e7f8f7] p-5"><StatusPill>Good match</StatusPill><h2 className="mt-4 text-2xl font-extrabold">At-home hearing diagnostic</h2><p className="mt-2 text-sm leading-6 text-slate-600">A CMA brings the clinical kit. A licensed audiologist joins remotely.</p></div><div className="space-y-4 p-5">{[[Home,"Home visit"],[Activity,"Clinical-grade testing"],[Video,"Audiologist review"],[FileHeart,"Results and care plan"]].map(([Icon,t]:any)=><div key={t} className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f1f7f7] text-brand-teal"><Icon size={19}/></span><b className="text-sm">{t}</b></div>)}</div></Card><div className="rounded-2xl bg-brand-navy p-4 text-white"><span className="text-xs text-white/60">Estimated visit price</span><div className="mt-1 flex items-end justify-between"><b className="text-3xl">$99</b><span className="text-xs text-white/70">Superbill available</span></div></div></StepPage>}
