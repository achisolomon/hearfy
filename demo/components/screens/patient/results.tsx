"use client";
import { motion } from "framer-motion";
import { Check,FileHeart,RefreshCw } from "lucide-react";
import { Card,PageHeader,PrimaryButton,StatusPill } from "../../ui";
import { devices, deviceDetail } from "@/lib/mock-data";
import { tierFor } from "@/lib/commerce";
import { ScreenId } from "../registry";
import { Shell, Audiogram } from "../shared";

export function Review({go,back}:{go:(s:ScreenId)=>void;back:()=>void}){return <Shell><PageHeader title="Your results are being reviewed" subtitle="Your audiologist is completing the clinical summary and recommendation." onBack={back} eyebrow="Clinical review"/><div className="mt-10 text-center"><motion.div animate={{rotate:360}} transition={{duration:2,repeat:Infinity,ease:"linear"}} className="mx-auto grid h-28 w-28 place-items-center rounded-full border-4 border-[#dceceb] border-t-brand-teal"><FileHeart className="text-brand-teal" size={38}/></motion.div><h2 className="mt-8 text-2xl font-extrabold">Almost ready</h2><p className="mx-auto mt-3 max-w-[280px] leading-6 text-slate-500">Most reports are ready within a few minutes after the visit.</p></div><Card className="mt-8 p-5"><div className="space-y-4">{[["Test data received",true],["Clinical interpretation",true],["Care recommendation",false]].map(([t,done]:any)=><div key={t} className="flex items-center gap-3"><span className={`grid h-8 w-8 place-items-center rounded-full ${done?"bg-[#dcf5ef] text-emerald-600":"bg-[#edf3f3] text-slate-400"}`}>{done?<Check size={17}/>:<RefreshCw size={16}/>}</span><b className={`text-sm ${done?"":"text-slate-400"}`}>{t}</b></div>)}</div></Card><div className="mt-6"><PrimaryButton onClick={()=>go("results")}>View completed results</PrimaryButton></div></Shell>}
export function Results({go,back}:{go:(s:ScreenId)=>void;back:()=>void}){return <Shell><PageHeader title="Your hearing results" subtitle="Reviewed and signed by Dr. Susan Reed." onBack={back} eyebrow="Results"/><Card className="p-5"><div className="mb-2 flex justify-between text-[10px] font-extrabold tracking-widest text-slate-400"><span>LEFT EAR</span><span>RIGHT EAR</span></div><Audiogram/></Card><Card className="mt-4 p-5"><StatusPill tone="blue">Clinical summary</StatusPill><h2 className="mt-4 text-[23px] font-extrabold">Moderate hearing loss in both ears</h2><p className="mt-3 text-sm leading-6 text-slate-500">Speech may sound unclear, especially in groups, restaurants, and other noisy environments.</p><div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-[#f2f7f7] p-4"><span className="text-xs text-slate-500">Speech clarity</span><b className="mt-1 block">Reduced</b></div><div className="rounded-2xl bg-[#f2f7f7] p-4"><span className="text-xs text-slate-500">Next step</span><b className="mt-1 block">Hearing aids</b></div></div></Card><div className="mt-6"><PrimaryButton onClick={()=>go("recommendation")}>View recommendation</PrimaryButton></div></Shell>}
export function Recommendation({go,back}:{go:(s:ScreenId)=>void;back:()=>void}){
  const shortlist = devices.slice(0,2); // The audiologist recommended two.
  return <Shell>
    <PageHeader title="Your audiologist's shortlist" subtitle="Two devices suit your results. The choice of tier is yours." onBack={back} eyebrow="Recommended"/>
    <div className="space-y-4">
      {shortlist.map(d=>{
        const detail = deviceDetail[d.name];
        const tier = tierFor(detail.tier);
        return <Card key={d.name} className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div><b className="text-[17px]">{d.name}</b>
              <p className="mt-1 text-sm text-slate-500">{tier.name} · ${tier.monthly}/month · {tier.care}</p></div>
            {detail.inCase&&<StatusPill tone="green">Available today</StatusPill>}
          </div>
          {/* Explainable fit: the factors, never a bare percentage (spec §2 gap). */}
          <ul className="mt-4 space-y-2">
            {detail.fitFactors.map(f=><li key={f} className="flex gap-2.5 text-sm leading-6 text-slate-600">
              <Check size={17} className="mt-1 shrink-0 text-brand-teal"/>{f}</li>)}
          </ul>
        </Card>;
      })}
    </div>
    <div className="mt-6"><PrimaryButton onClick={()=>go("compare")}>Compare side by side</PrimaryButton></div>
  </Shell>;
}
