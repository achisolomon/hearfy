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
  // Root cause of the last three attempts: Shell caps ALL patient content at
  // max-w-md (28rem = phone width), even on a 1200px+ desktop, so a 4-column
  // table (label + 3 devices) of sentence-length values could never fit —
  // not because a table is wrong, but because it never had room. The two
  // earlier fixes (a 560-pixel floor, then a 28-rem floor, both via an
  // arbitrary min-width utility) tried to force the table to fit a
  // phone-width box and either clipped the last column or produced the
  // horizontal scrollbar the owner rejected outright ("It looks bad. Lose
  // this. Lose the scroll."). Shell now takes an opt-in
  // `wide` prop (default false, so every other screen is untouched) that
  // widens the container from `lg` (1024px) up. So: a real side-by-side
  // table from `lg` up, where there is room, and the stacked cards below it
  // where there is not. Both trees render into the DOM together, gated by
  // Tailwind's `hidden lg:*` / `lg:hidden` visibility idiom (see BottomNav's
  // sibling screens for the same pattern) rather than a JS width check, so
  // nothing depends on JS running before first paint.
  //
  // Breakpoint arithmetic (lib/regressions.test.ts pins this): Tailwind's
  // `lg` media query is a fixed 1024px — CSS media features resolve against
  // the browser's default 16px rem, not `document.documentElement.style
  // .fontSize`, which is how TextSize (components/a11y/text-size.tsx) scales
  // text — so the breakpoint itself does not move as text grows. What does
  // grow is the rem-sized chrome around the table (Shell's px-5 padding, the
  // 9rem label column), and the table's device columns are
  // `fr` units, not a px/rem floor, so they simply take whatever space is
  // left — never less, never forcing a scrollbar. At the 1024px threshold,
  // each device column still gets roughly 271px (standard, 18px root), 260px
  // (large, 20.7px root), 250px (larger, 23.4px root) — comfortably readable
  // at all three settings, and the *actual* available width only grows from
  // there as the viewport grows past 1024px.
  return <Shell wide>
    <PageHeader title="Compare devices" subtitle="Side by side on a bigger screen, one at a time on a phone — the same six things either way." onBack={back} eyebrow="Compare"/>

    {/* Desktop / tablet-landscape: a real side-by-side table. Fluid grid
       columns (fr units) mean the table can only ever get narrower or wider
       with its container — never wider than the viewport, never a fixed
       floor to clip or scroll past. */}
    <div className="hidden lg:block">
      <Card className="overflow-hidden p-0">
        <div className="grid grid-cols-[9rem_repeat(3,1fr)]">
          {shortlist.map(d=>{
            const isSel = d.name===selected.name;
            const detail = deviceDetail[d.name];
            return <div key={d.name} className={cn("border-l border-[#eef4f5] p-4 text-left transition",
              isSel?"bg-brand-teal/10":"")}>
              <b className="block text-[15px] leading-tight">{d.name}</b>
              <span className="mt-1 block text-[12px] text-slate-500">
                ${tierFor(detail.tier).monthly}/mo · {tierFor(detail.tier).name}
              </span>
              <button
                type="button"
                aria-pressed={isSel}
                onClick={()=>selectDevice(d.name)}
                className={cn("mt-3 w-full rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition",
                  isSel?"bg-brand-teal text-white":"bg-[#f1f5f6] text-slate-500 hover:bg-[#e4eef0]")}>
                {isSel?"Selected":"Select"}
              </button>
            </div>;
          })}
        </div>
        {compareCategories.map(cat=><div key={cat} className="grid grid-cols-[9rem_repeat(3,1fr)] border-t border-[#eef4f5]">
          <div className="p-4"><span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{cat}</span></div>
          {shortlist.map(d=>{
            const isSel = d.name===selected.name;
            const detail = deviceDetail[d.name];
            return <div key={d.name} className={cn("border-l border-[#eef4f5] p-4 transition",isSel?"bg-brand-teal/5":"")}>
              <p className="text-[13px] leading-5 text-slate-600">{detail.compare[cat]}</p>
            </div>;
          })}
        </div>)}
      </Card>
    </div>

    {/* Phone / tablet-portrait: stacked one-card-per-device, unchanged from
       the previous attempt — no scroll structurally, since every value
       wraps in a single column instead of fighting for table width. */}
    <div className="space-y-4 lg:hidden">
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
