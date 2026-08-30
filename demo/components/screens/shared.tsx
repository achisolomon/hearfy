"use client";
import { motion } from "framer-motion";
import { Check,Home,MapPin,MessageCircle,Navigation,UserRound } from "lucide-react";
import { TextSize } from "../a11y/text-size";
import { PageHeader,PrimaryButton,Progress } from "../ui";
import { cn } from "@/lib/cn";
import { ScreenId } from "./registry";
export { Audiogram } from "../charts/audiogram";

// `wide` is opt-in and defaults to false: every existing Shell caller (every
// other patient screen, every CMA screen) keeps today's max-w-md phone-width
// column untouched. Only Compare passes wide, so only Compare's container
// grows from lg (1024px) up — see lib/regressions.test.ts's breakpoint
// arithmetic for why lg, not a smaller or custom breakpoint. Below lg the
// class list is identical to the non-wide case, so nothing shifts until the
// breakpoint fires.
// Bottom padding must clear whichever fixed bottom element reaches highest
// from the viewport bottom. On phone (below md) that's the floating demo
// controls in demo-shell.tsx — `bottom-24` + `h-12` buttons = 9rem above the
// viewport bottom — so pb-40 (10rem) leaves 1rem of breathing room past
// their top edge. On desktop (md:) the controls are md:hidden, so only
// BottomNav (`h-20` = 5rem, flush to bottom-0) remains; pb-24 (6rem) gives
// it the same 1rem margin. See lib/regressions.test.ts's "floating controls
// clearance" tests for the arithmetic this pins.
export function Shell({children,dark=false,wide=false}:{children:React.ReactNode;dark?:boolean;wide?:boolean}){return <div className={dark?"min-h-[800px] bg-brand-navy text-white":"min-h-[800px] bg-brand-bg text-brand-navy"}><div className={cn("mx-auto px-5 pb-40 pt-6 md:pb-24",wide?"max-w-md lg:max-w-4xl":"max-w-md")}><div className="mb-3 flex justify-end"><TextSize /></div>{children}</div></div>}
export function Avatar({large=false}:{large?:boolean}){return <div className={`${large?"h-20 w-20 text-xl":"h-12 w-12 text-sm"} grid shrink-0 place-items-center rounded-full border-4 border-white bg-gradient-to-br from-[#c7eeec] to-[#edf8f8] font-extrabold text-brand-navy shadow-soft`}>ML</div>}
export function Option({title,sub,active,onClick,icon:Icon}:{title:string;sub?:string;active?:boolean;onClick?:()=>void;icon?:any}){return <button onClick={onClick} className={`flex w-full items-center gap-3 rounded-[20px] border p-4 text-left transition ${active?"border-brand-teal bg-[#edfbfa]":"border-[#dfeaec] bg-white"}`}>{Icon&&<span className={`grid h-11 w-11 place-items-center rounded-2xl ${active?"bg-brand-teal text-white":"bg-[#f0f6f6] text-brand-teal"}`}><Icon size={21}/></span>}<span className="flex-1"><b className="block text-[15px]">{title}</b>{sub&&<span className="mt-1 block text-xs leading-5 text-slate-500">{sub}</span>}</span><span className={`grid h-5 w-5 place-items-center rounded-full border ${active?"border-brand-teal bg-brand-teal text-white":"border-slate-300"}`}>{active&&<Check size={13}/>}</span></button>}
export function StepPage({title,subtitle,step,children,onBack,onNext,next="Continue"}:{title:string;subtitle:string;step:number;children:React.ReactNode;onBack:()=>void;onNext:()=>void;next?:string}){return <Shell><PageHeader title={title} subtitle={subtitle} onBack={onBack} eyebrow="Smart matching"/><Progress step={step} total={5}/><div className="space-y-3">{children}</div><div className="mt-7"><PrimaryButton onClick={onNext}>{next}</PrimaryButton></div></Shell>}
export function RouteMap({moving=false}:{moving?:boolean}){return <div className="map-grid relative h-72 overflow-hidden rounded-[26px]"><svg className="absolute inset-0 h-full w-full" viewBox="0 0 360 280"><path d="M30 235 C80 200,110 182,155 156 S250 110,320 48" fill="none" stroke="#12aaa5" strokeWidth="7" strokeLinecap="round" strokeDasharray={moving?"12 10":"0"}/></svg><div className="absolute bottom-7 left-7 grid h-12 w-12 place-items-center rounded-full border-4 border-white bg-brand-navy text-white"><Home size={20}/></div><motion.div animate={moving?{x:[0,125],y:[0,-95]}:{}} transition={{duration:3,repeat:Infinity,repeatType:"reverse"}} className="absolute left-28 top-40 grid h-12 w-12 place-items-center rounded-full border-4 border-white bg-brand-teal text-white"><Navigation size={20}/></motion.div><div className="absolute right-7 top-7 grid h-12 w-12 place-items-center rounded-full border-4 border-white bg-white text-brand-navy"><MapPin size={20}/></div></div>}
export function DeviceVisual(){return <div className="flex h-52 items-center justify-center gap-5 bg-gradient-to-br from-[#e8f8f6] via-white to-[#edf3f8]"><div className="h-28 w-16 -rotate-6 rounded-[42px] bg-gradient-to-b from-[#ded7ca] to-[#9f978b] shadow-card"/><div className="h-28 w-16 rotate-6 rounded-[42px] bg-gradient-to-b from-[#ded7ca] to-[#9f978b] shadow-card"/></div>}
export function BottomNav({current,go}:{current:ScreenId;go:(s:ScreenId)=>void}){if(["welcome","signin"].includes(current))return null;const items:[[string,any,ScreenId],[string,any,ScreenId],[string,any,ScreenId],[string,any,ScreenId]]=[["Home",Home,"home"],["Journey",Navigation,"assigned"],["Messages",MessageCircle,"support"],["Profile",UserRound,"intake-for"]];return <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#dce7e9] bg-white/95 backdrop-blur"><div className="mx-auto flex h-20 max-w-md items-center justify-around">{items.map(([l,I,t])=><button onClick={()=>go(t)} key={l} className={`flex flex-col items-center gap-1 text-[10px] font-bold ${current===t?"text-brand-teal":"text-slate-400"}`}><I size={20}/>{l}</button>)}</div></div>}
