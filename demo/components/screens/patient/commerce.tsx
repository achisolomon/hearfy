"use client";
import { Check, CreditCard, PenLine } from "lucide-react";
import { Card,PageHeader,PrimaryButton } from "../../ui";
import { devices, deviceDetail, identity, orderStates, compareCategories, serials } from "@/lib/mock-data";
import { DeviceThumb } from "../../device-thumb";
import { creditedFirstMonth, tierFor } from "@/lib/commerce";
import { selectDevice, useSelectedDevice } from "@/lib/selection";
import { SIGNING_ITEMS, canSign, sign, toggleSigningItem, useSigning } from "@/lib/signing";
import { cn } from "@/lib/cn";
import { ScreenId } from "../registry";
import { Shell } from "../shared";
import { CompareTable } from "../compare-table";

export function Compare({go,back}:{go:(s:ScreenId)=>void;back:()=>void}){
  const shortlist = devices.slice(0,3);
  const selected = useSelectedDevice();
  // Shell's `wide` prop is opt-in and only widens this screen from `lg` up;
  // every other screen stays phone-width. Below `lg`, stacked cards; from
  // `lg`, the side-by-side table — both trees are in the DOM, toggled by
  // Tailwind visibility. Device columns are `fr` units on purpose (no
  // px/rem floor), so the table can never overflow or need a scrollbar.
  // The patient is on a PHONE (2026-08-31): the six-across table is the
  // CMA's tablet view, not theirs. This screen keeps the phone column and
  // the stacked cards — one package at a time, the same six rows — so the
  // call tile and the cards each get the full width instead of splitting
  // ~490px between them. `CompareTable` renders its stacked branch here and
  // its wide branch on the CMA's screen from one source of truth.
  return <Shell>
    {/* Renamed from "Compare devices" (corrections sheet 2026-08-31, item 9):
       what the patient picks is the service package the device belongs to. */}
    <PageHeader title="Compare service packages" subtitle="One package at a time — the same six things for each. Dr. Reed is on the call if you want to talk it through." onBack={back} eyebrow="Compare"/>

    {/* She is on the call while the packages are on screen: only the
       audiologist recommends, so the comparison never appears without her
       clinical reason for the pick (2026-08-31). */}
    {/* No call tile here (2026-08-31): the video lives on the CMA's tablet
       and the audiologist's screen, which have the width for it. The patient
       is on a phone, where a 4:3 panel above the cards pushed the packages
       below the fold. Her recommendation still reaches them — as her words,
       carried on the card of each package. */}

    {/* One table, two surfaces: the CMA's tablet renders the same component
       read-only, so the comparison the patient reads and the one on the
       tablet can never diverge. */}
    <CompareTable onSelect={selectDevice}/>

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
        <div className="flex justify-between text-sm text-teal-ink">
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
    <div className="mt-6"><PrimaryButton onClick={()=>go("signing")}>Review &amp; sign</PrimaryButton></div>
  </Shell>;
}

/**
 * The patient signs on their OWN phone (item 12, refined 2026-08-31): the
 * contract, the terms and the card are theirs to approve, and each approval
 * lands live on the CMA's mirror. Nothing here is done for them.
 */
export function Signing({go,back}:{go:(s:ScreenId)=>void;back:()=>void}){
  const chosen = useSelectedDevice();
  const tier = tierFor(deviceDetail[chosen.name].tier);
  const {monthly,credit,dueNow} = creditedFirstMonth(tier.id);
  const s = useSigning();
  return <Shell>
    <PageHeader title="Sign &amp; authorize" subtitle="Review each item at your own pace. Dr. Reed and Maya can answer anything." onBack={back} eyebrow="Your contract"/>
    <Card className="p-5">
      <div className="space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-slate-500">{chosen.name} · {tier.name}</span><b>${monthly}/mo</b></div>
        <div className="flex justify-between text-teal-ink"><span>Your $99 visit fee, credited</span><b>−${credit}</b></div>
        <div className="mt-2 flex justify-between border-t border-[#eef4f5] pt-3"><b>Due today</b><b className="text-lg">${dueNow}</b></div>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500">Includes the devices, ongoing care and remote adjustments. Cancel with 30 days&rsquo; notice.</p>
    </Card>
    <div className="mt-4 space-y-3">
      {SIGNING_ITEMS.map(([k,label])=>(
        <button key={k} onClick={()=>toggleSigningItem(k)} disabled={s.signed}
          className="flex w-full items-start gap-3 rounded-2xl bg-white p-4 text-left">
          <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md border ${
            s[k]?"border-brand-teal bg-brand-teal text-white":"border-slate-300"}`}>
            {s[k]&&<Check size={15}/>}
          </span>
          <span className="text-sm leading-6 text-slate-600">
            {label}
            {k==="card"&&<span className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
              <CreditCard size={13}/> Visa •••• 4242 · saved at booking
            </span>}
          </span>
        </button>
      ))}
    </div>
    <button onClick={sign}
      className={`mt-4 grid min-h-24 w-full place-items-center rounded-2xl border-2 border-dashed p-4 text-center ${
        s.signed?"border-brand-teal bg-[#edfbfa]":"border-[#c9dadd] bg-white"}`}>
      {s.signed
        ? <span>
            <span className="font-serif text-2xl italic text-brand-navy">{identity.legalName}</span>
            <span className="mt-1 block text-[11px] text-slate-500">Signed by you · May 21, 2025</span>
          </span>
        : <span className="flex items-center gap-2 text-sm font-semibold text-slate-400">
            <PenLine size={16}/> {canSign(s)?"Tap to sign":"Approve the three items above to sign"}
          </span>}
    </button>
    <div className="mt-6">
      <PrimaryButton disabled={!s.signed} onClick={()=>go("order")}>
        {s.signed?"Membership confirmed":"Signature required"}
      </PrimaryButton>
    </div>
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
            {s==="Activated"&&i<done&&<p className="mt-1 text-xs text-slate-500">Serial {serials.left} / {serials.right}</p>}</div>
        </div>)}
      </div>
    </Card>
    <div className="mt-6"><PrimaryButton onClick={()=>go("support")}>Ongoing care</PrimaryButton></div>
  </Shell>;
}
