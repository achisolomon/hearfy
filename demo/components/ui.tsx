"use client";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/cn";
import { BRAND_NAME } from "@/lib/mock-data";

export function BrandLogo({ compact=false, className="" }:{compact?:boolean;className?:string}){
  return <div className={cn("flex items-center gap-2.5",className)}>
    <div className="flex h-8 items-center gap-[3px]" aria-hidden>{[10,19,28,19,10].map((h,i)=><span key={i} className="w-[3px] rounded-full bg-brand-teal" style={{height:h}}/>)}</div>
    {!compact&&<span className="text-[19px] font-extrabold tracking-[.08em] text-brand-navy">{BRAND_NAME.toUpperCase()}</span>}
  </div>
}
export function Card({children,className=""}:{children:React.ReactNode;className?:string}){return <div className={cn("rounded-[24px] border border-[#e4eef0] bg-white shadow-card",className)}>{children}</div>}
/**
 * One fill, no surface branch: Harbor Navy with a white label, 15.8:1.
 *
 * This used to fork. The four dispatch and call screens were a navy Shell, so
 * a navy button on them was navy-on-navy at 1.14:1 — invisible — and the
 * button switched itself to Teal Ink there. That was right while navy simply
 * meant "action", and wrong once teal came to mean "chosen" (DESIGN.md's
 * Selection Rule): the same action read navy on 34 screens and teal on four,
 * and on the dispatch screen the teal button sat beside a teal route line
 * that genuinely did mean live state.
 *
 * Rather than give the action a second colour for one ground, those four
 * screens went light (2026-09-01), which removed the ground that forced the
 * exception. An explicit bg-* in `className` still wins, since it comes last.
 */
export function PrimaryButton({children,onClick,disabled=false,className=""}:{children:React.ReactNode;onClick?:()=>void;disabled?:boolean;className?:string}){return <motion.button whileTap={{scale:.985}} disabled={disabled} onClick={onClick} className={cn("flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl px-5 font-bold text-white shadow-soft transition disabled:opacity-50 bg-brand-navy hover:bg-[#102d51]",className)}>{children}<ArrowRight size={18}/></motion.button>}
export function SecondaryButton({children,onClick,className=""}:{children:React.ReactNode;onClick?:()=>void;className?:string}){return <button onClick={onClick} className={cn("min-h-12 w-full rounded-2xl border border-[#d8e5e8] bg-white px-5 font-bold text-brand-navy",className)}>{children}</button>}
/**
 * One ink, because there is one ground.
 *
 * This carried a light/dark fork for the four navy screens, whose heading was
 * once `text-brand-navy` on `bg-brand-navy` and did not render at all. Those
 * screens went light on 2026-09-01, so the fork had no callers left.
 *
 * The eyebrow stays Teal Ink: Vital Teal measured 2.68:1 at 10px on the light
 * ground, the exact case DESIGN.md's "don't use Vital Teal for text below
 * 18px on white" rule forbids.
 */
export function PageHeader({title,subtitle,onBack,eyebrow}:{title:string;subtitle?:string;onBack?:()=>void;eyebrow?:string}){return <header className="mb-6"><div className="mb-5 flex items-center justify-between">{onBack?<button onClick={onBack} aria-label="Go back" className="grid h-11 w-11 place-items-center rounded-full border border-[#e1ebed] bg-white text-brand-navy transition hover:bg-[#f4f8f8]"><ArrowLeft size={19}/></button>:<BrandLogo/>}{eyebrow&&<span className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#087d7a]">{eyebrow}</span>}</div><h1 className="text-[30px] font-extrabold leading-[1.08] tracking-[-.03em] text-balance text-brand-navy">{title}</h1>{subtitle&&<p className="mt-3 text-[15px] leading-6 text-slate-500">{subtitle}</p>}</header>}
export function StatusPill({children,tone="teal"}:{children:React.ReactNode;tone?:"teal"|"blue"|"green"|"amber"}){const tones={teal:"bg-[#e8f9f8] text-[#087d7a]",blue:"bg-[#edf4fb] text-[#235f98]",green:"bg-[#edf8f2] text-[#237451]",amber:"bg-[#fff6e8] text-[#9d6514]"};return <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold",tones[tone])}><Check size={13}/>{children}</span>}
export function Progress({step,total}:{step:number;total:number}){return <div className="mb-6"><div className="mb-2 flex justify-between text-[11px] font-bold text-slate-400"><span>STEP {step} OF {total}</span><span>{Math.round(step/total*100)}%</span></div><div className="h-1.5 rounded-full bg-[#e4eeee]"><div className="h-full rounded-full bg-brand-teal transition-all" style={{width:`${step/total*100}%`}}/></div></div>}
export function SecureFooter(){return <div className="mt-7 flex items-center justify-center gap-2 text-[11px] font-semibold text-slate-400"><ShieldCheck size={14}/>HIPAA-ready demo · Secure & encrypted</div>}
