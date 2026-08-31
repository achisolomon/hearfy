"use client";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/cn";
import { useOnDark } from "./surface";
import { BRAND_NAME } from "@/lib/mock-data";

export function BrandLogo({ compact=false, className="" }:{compact?:boolean;className?:string}){
  return <div className={cn("flex items-center gap-2.5",className)}>
    <div className="flex h-8 items-center gap-[3px]" aria-hidden>{[10,19,28,19,10].map((h,i)=><span key={i} className="w-[3px] rounded-full bg-brand-teal" style={{height:h}}/>)}</div>
    {!compact&&<span className="text-[19px] font-extrabold tracking-[.08em] text-brand-navy">{BRAND_NAME.toUpperCase()}</span>}
  </div>
}
export function Card({children,className=""}:{children:React.ReactNode;className?:string}){return <div className={cn("rounded-[24px] border border-[#e4eef0] bg-white shadow-card",className)}>{children}</div>}
/**
 * The navy fill is the action colour on the light ground. On the navy ground
 * it was navy-on-navy: the four dark screens each worked around it by passing
 * `className="bg-brand-teal"`, which put white on #12AAA5 at 2.87:1. Reading
 * the surface fixes both at once — the dark ground gets Teal Ink (#087D7A),
 * where the white label measures 4.97:1 — and the per-screen overrides can go.
 * An explicit bg-* in `className` still wins, since it comes last.
 */
export function PrimaryButton({children,onClick,disabled=false,className=""}:{children:React.ReactNode;onClick?:()=>void;disabled?:boolean;className?:string}){const dark=useOnDark();return <motion.button whileTap={{scale:.985}} disabled={disabled} onClick={onClick} className={cn("flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl px-5 font-bold text-white shadow-soft transition disabled:opacity-50",dark?"bg-[#087d7a] hover:bg-[#066b69]":"bg-brand-navy hover:bg-[#102d51]",className)}>{children}<ArrowRight size={18}/></motion.button>}
export function SecondaryButton({children,onClick,className=""}:{children:React.ReactNode;onClick?:()=>void;className?:string}){return <button onClick={onClick} className={cn("min-h-12 w-full rounded-2xl border border-[#d8e5e8] bg-white px-5 font-bold text-brand-navy",className)}>{children}</button>}
/**
 * On the navy Shell the title was `text-brand-navy` on `bg-brand-navy` — the
 * heading of four screens (assigned, driving, arrived, live) simply did not
 * render. The back button had the same fault: a white circle whose navy arrow
 * was invisible against it is fine, but its `bg-white` made a hard white disc
 * on navy with no icon contrast issue, while the *title* beside it vanished.
 * The surface now decides the ink; nothing here is per-screen.
 *
 * The eyebrow keeps Vital Teal on navy (5.51:1, comfortably legible) and
 * moves to Teal Ink on light, where #12AAA5 measured 2.68:1 at 10px — the
 * exact case DESIGN.md's "don't use Vital Teal for text below 18px on white"
 * rule already forbids.
 */
export function PageHeader({title,subtitle,onBack,eyebrow}:{title:string;subtitle?:string;onBack?:()=>void;eyebrow?:string}){const dark=useOnDark();return <header className="mb-6"><div className="mb-5 flex items-center justify-between">{onBack?<button onClick={onBack} aria-label="Go back" className={cn("grid h-11 w-11 place-items-center rounded-full border transition",dark?"border-white/25 bg-white/10 text-white hover:bg-white/20":"border-[#e1ebed] bg-white text-brand-navy hover:bg-[#f4f8f8]")}><ArrowLeft size={19}/></button>:<BrandLogo/>}{eyebrow&&<span className={cn("text-[10px] font-extrabold uppercase tracking-[.2em]",dark?"text-brand-teal":"text-[#087d7a]")}>{eyebrow}</span>}</div><h1 className={cn("text-[30px] font-extrabold leading-[1.08] tracking-[-.03em] text-balance",dark?"text-white":"text-brand-navy")}>{title}</h1>{subtitle&&<p className={cn("mt-3 text-[15px] leading-6",dark?"text-[#cbd5e1]":"text-slate-500")}>{subtitle}</p>}</header>}
export function StatusPill({children,tone="teal"}:{children:React.ReactNode;tone?:"teal"|"blue"|"green"|"amber"}){const tones={teal:"bg-[#e8f9f8] text-[#087d7a]",blue:"bg-[#edf4fb] text-[#235f98]",green:"bg-[#edf8f2] text-[#237451]",amber:"bg-[#fff6e8] text-[#9d6514]"};return <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold",tones[tone])}><Check size={13}/>{children}</span>}
export function Progress({step,total}:{step:number;total:number}){return <div className="mb-6"><div className="mb-2 flex justify-between text-[11px] font-bold text-slate-400"><span>STEP {step} OF {total}</span><span>{Math.round(step/total*100)}%</span></div><div className="h-1.5 rounded-full bg-[#e4eeee]"><div className="h-full rounded-full bg-brand-teal transition-all" style={{width:`${step/total*100}%`}}/></div></div>}
export function SecureFooter(){return <div className="mt-7 flex items-center justify-center gap-2 text-[11px] font-semibold text-slate-400"><ShieldCheck size={14}/>HIPAA-ready demo · Secure & encrypted</div>}
