"use client";
import { Check } from "lucide-react";
import { Card,PageHeader,PrimaryButton } from "../../ui";
import { devices, deviceDetail, orderStates, compareCategories } from "@/lib/mock-data";
import { creditedFirstMonth, tierFor } from "@/lib/commerce";
import { selectDevice, useSelectedDevice } from "@/lib/selection";
import { cn } from "@/lib/cn";
import { ScreenId } from "../registry";
import { Shell } from "../shared";

export function Compare({go,back}:{go:(s:ScreenId)=>void;back:()=>void}){
  const shortlist = devices.slice(0,3);
  const selected = useSelectedDevice();
  // Was a 4-column table (label + 3 devices) in Shell's phone-width
  // container. Six sentence-length values across three devices cannot fit
  // that width at any text size — two prior fixes tried a min-width floor
  // (560px, then 28rem) and both either clipped the last column or forced
  // the horizontal scrollbar the owner rejected outright ("It looks bad.
  // Lose this. Lose the scroll."). A stacked card per device removes the
  // scroll structurally: every value wraps in a single column instead of
  // fighting for table width. "Side by side" no longer describes this
  // layout, so the copy below says what it actually is.
  return <Shell>
    <PageHeader title="Compare devices" subtitle="The six things worth comparing, one device at a time." onBack={back} eyebrow="Compare"/>
    <div className="space-y-4">
      {shortlist.map(d=>{
        const isSel = d.name===selected.name;
        const detail = deviceDetail[d.name];
        return <Card key={d.name} className={cn("overflow-hidden p-0 transition",
          isSel?"border-brand-teal ring-2 ring-brand-teal":"border-[#e4eef0]")}>
          <button
            type="button"
            aria-pressed={isSel}
            onClick={()=>selectDevice(d.name)}
            className={cn("flex w-full items-center justify-between gap-3 p-4 text-left transition",
              isSel?"bg-brand-teal/10":"hover:bg-[#f8fafb]")}>
            <span>
              <b className="block text-[15px] leading-tight">{d.name}</b>
              <span className="mt-1 block text-[12px] text-slate-500">
                ${tierFor(detail.tier).monthly}/mo · {tierFor(detail.tier).name}
              </span>
            </span>
            <span className={cn("shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider",
              isSel?"bg-brand-teal text-white":"bg-[#f1f5f6] text-slate-500")}>
              {isSel?"Selected":"Select"}
            </span>
          </button>
          <div className="space-y-3 border-t border-[#eef4f5] p-4">
            {compareCategories.map(cat=><div key={cat}>
              <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">{cat}</span>
              <p className="mt-0.5 text-[13px] leading-5 text-slate-600">{detail.compare[cat]}</p>
            </div>)}
          </div>
        </Card>;
      })}
    </div>
    <div className="mt-6"><PrimaryButton onClick={()=>go("checkout")}>Continue with the {selected.name}</PrimaryButton></div>
  </Shell>;
}

export function Checkout({go,back}:{go:(s:ScreenId)=>void;back:()=>void}){
  const chosen = useSelectedDevice();
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
  const chosen = useSelectedDevice();
  const inCase = deviceDetail[chosen.name].inCase;
  // In-case devices (Fulfilment: "In the case — fitted today") were fitted
  // during the home visit, so every state is already complete. A device that
  // ships later (Fulfilment: "Ships to you — fitted at a follow-up", e.g. the
  // Oticon Intent 2) has not been fitted yet — claiming "Activated" for it
  // would be the same dishonesty the compare screen used to hide: telling the
  // patient they were fitted today when they were not. So it stops at
  // "Fitting due", one step short of complete.
  const done = inCase ? orderStates.length : orderStates.indexOf("Fitting due") + 1;
  return <Shell>
    <PageHeader
      title={inCase ? "Fitted and active" : "On its way"}
      subtitle={inCase ? "You left your visit hearing." : "Ships to you, fitted at a follow-up visit."}
      onBack={back} eyebrow="Your device"/>
    <Card className="p-5">
      <div className="space-y-0">
        {orderStates.map((s,i)=><div key={s} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span className={`grid h-7 w-7 place-items-center rounded-full ${i<done?"bg-brand-teal text-white":"bg-[#eef4f5] text-slate-300"}`}>
              <Check size={14}/></span>
            {i<orderStates.length-1&&<span className={`w-0.5 flex-1 ${i<done-1?"bg-brand-teal":"bg-[#eef4f5]"}`}/>}
          </div>
          <div className="pb-5"><b className="text-sm">{s}</b>
            {s==="Activated"&&i<done&&<p className="mt-1 text-xs text-slate-500">Serial HF-2284-L / HF-2284-R</p>}</div>
        </div>)}
      </div>
    </Card>
    <div className="mt-6"><PrimaryButton onClick={()=>go("support")}>Ongoing care</PrimaryButton></div>
  </Shell>;
}
