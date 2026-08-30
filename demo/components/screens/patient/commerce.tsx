"use client";
import { Check } from "lucide-react";
import { Card,PageHeader,PrimaryButton } from "../../ui";
import { devices, deviceDetail, orderStates, compareCategories } from "@/lib/mock-data";
import { creditedFirstMonth, tierFor } from "@/lib/commerce";
import { ScreenId } from "../registry";
import { Shell } from "../shared";

export function Compare({go,back}:{go:(s:ScreenId)=>void;back:()=>void}){
  const shortlist = devices.slice(0,3);
  return <Shell>
    <PageHeader title="Side by side" subtitle="The six things worth comparing." onBack={back} eyebrow="Compare"/>
    <div className="-mx-5 overflow-x-auto px-5">
      <table className="w-full min-w-[28rem] border-separate border-spacing-y-2 text-left text-sm">
        <thead><tr>
          <th scope="col" className="w-32"/>
          {shortlist.map(d=><th key={d.name} scope="col" className="p-2 align-bottom">
            <b className="block text-[13px] leading-tight">{d.name}</b>
            <span className="text-[11px] font-normal text-slate-400">
              ${tierFor(deviceDetail[d.name].tier).monthly}/mo
            </span></th>)}
        </tr></thead>
        <tbody>
          {compareCategories.map(cat=><tr key={cat}>
            <th scope="row" className="rounded-l-xl bg-white p-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">{cat}</th>
            {shortlist.map(d=><td key={d.name} className="bg-white p-3 align-top text-[13px] leading-5 text-slate-600 last:rounded-r-xl">
              {deviceDetail[d.name].compare[cat]}</td>)}
          </tr>)}
        </tbody>
      </table>
    </div>
    <div className="mt-6"><PrimaryButton onClick={()=>go("checkout")}>Continue with the {devices[0].name}</PrimaryButton></div>
  </Shell>;
}

export function Checkout({go,back}:{go:(s:ScreenId)=>void;back:()=>void}){
  const chosen = devices[0];
  const tier = tierFor(deviceDetail[chosen.name].tier);
  const {monthly,credit,dueNow} = creditedFirstMonth(tier.id);
  return <Shell>
    <PageHeader title="Start your membership" subtitle={`${chosen.name} · ${tier.name}`} onBack={back} eyebrow="Checkout"/>
    <Card className="p-5">
      <div className="space-y-3">
        <div className="flex justify-between text-sm"><span className="text-slate-500">{tier.name} membership</span><b>${monthly}/mo</b></div>
        {/* The promise made at booking, visibly kept (spec §9a). */}
        <div className="flex justify-between text-sm text-brand-teal">
          <span>Your $99 visit fee, credited</span><b>−${credit}</b></div>
        <div className="flex items-center justify-between border-t border-[#eef4f5] pt-3">
          <b>Due today</b><b className="text-2xl">${dueNow}</b></div>
      </div>
      {dueNow===0&&<p className="mt-4 rounded-xl bg-[#edfbfa] p-3 text-sm leading-6 text-[#087d7a]">
        Your visit was free — the $99 you paid covers your first month.</p>}
    </Card>
    <Card className="mt-3 p-4">
      <p className="text-sm leading-6 text-slate-500">
        ${monthly} per month from next month. Includes the devices, ongoing care and remote
        adjustments. Cancel with 30 days&rsquo; notice.</p>
    </Card>
    <div className="mt-6"><PrimaryButton onClick={()=>go("order")}>Confirm membership</PrimaryButton></div>
  </Shell>;
}

export function Order({go,back}:{go:(s:ScreenId)=>void;back:()=>void}){
  // The hero was fitted in the home, so every state is already complete.
  const done = orderStates.length;
  return <Shell>
    <PageHeader title="Fitted and active" subtitle="You left your visit hearing." onBack={back} eyebrow="Your device"/>
    <Card className="p-5">
      <div className="space-y-0">
        {orderStates.map((s,i)=><div key={s} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span className={`grid h-7 w-7 place-items-center rounded-full ${i<done?"bg-brand-teal text-white":"bg-[#eef4f5] text-slate-300"}`}>
              <Check size={14}/></span>
            {i<orderStates.length-1&&<span className={`w-0.5 flex-1 ${i<done-1?"bg-brand-teal":"bg-[#eef4f5]"}`}/>}
          </div>
          <div className="pb-5"><b className="text-sm">{s}</b>
            {s==="Activated"&&<p className="mt-1 text-xs text-slate-500">Serial HF-2284-L / HF-2284-R</p>}</div>
        </div>)}
      </div>
    </Card>
    <div className="mt-6"><PrimaryButton onClick={()=>go("support")}>Ongoing care</PrimaryButton></div>
  </Shell>;
}
