"use client";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/cn";

export function HearMiLogo({ compact=false, className="" }:{compact?:boolean;className?:string}){
  return <div className={cn("flex items-center gap-2.5",className)}>
    <div className="flex h-8 items-center gap-[3px]" aria-hidden>{[10,19,28,19,10].map((h,i)=><span key={i} className="w-[3px] rounded-full bg-brand-teal" style={{height:h}}/>)}</div>
    {!compact&&<span className="text-[19px] font-extrabold tracking-[.08em] text-brand-navy">HEARMI</span>}
  </div>
}
export function Card({children,className=""}:{children:React.ReactNode;className?:string}){return <div className={cn("rounded-[24px] border border-[#e4eef0] bg-white shadow-card",className)}>{children}</div>}
export function PrimaryButton({children,onClick,disabled=false,className=""}:{children:React.ReactNode;onClick?:()=>void;disabled?:boolean;className?:string}){return <motion.button whileTap={{scale:.985}} disabled={disabled} onClick={onClick} className={cn("flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-brand-navy px-5 font-bold text-white shadow-soft transition hover:bg-[#102d51] disabled:opacity-50",className)}>{children}<ArrowRight size={18}/></motion.button>}
export function SecondaryButton({children,onClick,className=""}:{children:React.ReactNode;onClick?:()=>void;className?:string}){return <button onClick={onClick} className={cn("min-h-12 w-full rounded-2xl border border-[#d8e5e8] bg-white px-5 font-bold text-brand-navy",className)}>{children}</button>}
export function PageHeader({title,subtitle,onBack,eyebrow}:{title:string;subtitle?:string;onBack?:()=>void;eyebrow?:string}){return <header className="mb-6"><div className="mb-5 flex items-center justify-between">{onBack?<button onClick={onBack} className="grid h-10 w-10 place-items-center rounded-full border border-[#e1ebed] bg-white"><ArrowLeft size={19}/></button>:<HearMiLogo/>}{eyebrow&&<span className="text-[10px] font-extrabold uppercase tracking-[.2em] text-brand-teal">{eyebrow}</span>}</div><h1 className="text-[30px] font-extrabold leading-[1.08] tracking-[-.03em] text-brand-navy">{title}</h1>{subtitle&&<p className="mt-3 text-[15px] leading-6 text-slate-500">{subtitle}</p>}</header>}
export function StatusPill({children,tone="teal"}:{children:React.ReactNode;tone?:"teal"|"blue"|"green"|"amber"}){const tones={teal:"bg-[#e8f9f8] text-[#087d7a]",blue:"bg-[#edf4fb] text-[#235f98]",green:"bg-[#edf8f2] text-[#237451]",amber:"bg-[#fff6e8] text-[#9d6514]"};return <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold",tones[tone])}><Check size={13}/>{children}</span>}
export function Progress({step,total}:{step:number;total:number}){return <div className="mb-6"><div className="mb-2 flex justify-between text-[11px] font-bold text-slate-400"><span>STEP {step} OF {total}</span><span>{Math.round(step/total*100)}%</span></div><div className="h-1.5 rounded-full bg-[#e4eeee]"><div className="h-full rounded-full bg-brand-teal transition-all" style={{width:`${step/total*100}%`}}/></div></div>}
export function SecureFooter(){return <div className="mt-7 flex items-center justify-center gap-2 text-[11px] font-semibold text-slate-400"><ShieldCheck size={14}/>HIPAA-ready demo · Secure & encrypted</div>}
