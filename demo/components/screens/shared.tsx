"use client";
import { motion } from "framer-motion";
import { Check,Home,MapPin,MessageCircle,Navigation,UserRound } from "lucide-react";
import { TextSize } from "../a11y/text-size";
import { PageHeader,PrimaryButton,Progress } from "../ui";
import { SurfaceProvider, useOnDark } from "../surface";
import { cn } from "@/lib/cn";
import { useStoryOptional } from "../shell/story-context";
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
// from the viewport bottom. On phone (below md), Option C docks the demo
// controls (demo-shell.tsx) flush at bottom-0, h-14 (3.5rem) tall; the
// patient app's BottomNav (below) stacks directly on top of that bar —
// bottom-14, h-20 (5rem) — so the worst case (patient role, both bars
// stacked) reaches 3.5 + 5 = 8.5rem above the viewport bottom. pb-40 (10rem)
// is the smallest step on Tailwind's default spacing scale above that edge
// (pb-36 is 9rem, which is under it) and leaves 1.5rem of breathing room
// past that top edge. A role with no BottomNav (CMA, audiologist, operator)
// only has the 3.5rem control bar, so the same pb-40 clears it with room to
// spare. On desktop (md:) the phone control bar is md:hidden and BottomNav
// reverts to bottom-0 (`h-20` = 5rem); pb-24 (6rem) gives it the same 1rem
// margin, unchanged from before. See lib/regressions.test.ts's "docked
// controls clearance" tests for the arithmetic this pins, including the
// scale-validity check that catches any bare number Tailwind can't compile.
// `tablet` is the CMA's column (refined 2026-08-31: only the patient is on a
// phone — the CMA works a tablet, the audiologist and operator a computer or
// tablet). It widens from `md` (768px, iPad portrait) so the Zoom-like exam
// layout has room, while phones still get the max-w-md column. `wide` keeps
// Compare's existing lg-up behavior untouched.
//
// From `xl` the tablet column widens again (2026-08-31): once the shortlist
// screen carried the full comparison table beside the 380px call column, a
// 4xl cap left the table's four columns about 490px to share, wrapping every
// cell to three lines. Only the xl step is new; md and lg are unchanged.
// `dark` is published through SurfaceProvider (components/surface.tsx) rather
// than only setting classes here: PageHeader's title and PrimaryButton's fill
// are both navy, so on the four navy screens (assigned, driving, arrived,
// live) the heading rendered navy-on-navy — invisible — and the primary
// action was a navy button on a navy ground. Those components now read the
// surface instead of each dark screen having to override them by hand.
export function Shell({children,dark=false,wide=false,tablet=false}:{children:React.ReactNode;dark?:boolean;wide?:boolean;tablet?:boolean}){return <SurfaceProvider value={dark?"dark":"light"}><div className={dark?"min-h-[800px] bg-brand-navy text-white":"min-h-[800px] bg-brand-bg text-brand-navy"}><div className={cn("mx-auto px-5 pb-40 pt-6 md:pb-24",tablet?"max-w-md md:max-w-3xl lg:max-w-4xl xl:max-w-6xl":wide?"max-w-md lg:max-w-4xl":"max-w-md")}><div className="mb-3 flex justify-end"><TextSize /></div>{children}</div></div></SurfaceProvider>}
export function Avatar({large=false}:{large?:boolean}){return <div className={`${large?"h-20 w-20 text-xl":"h-12 w-12 text-sm"} grid shrink-0 place-items-center rounded-full border-4 border-white bg-gradient-to-br from-[#c7eeec] to-[#edf8f8] font-extrabold text-brand-navy shadow-soft`}>ML</div>}
// `multi` is opt-in and defaults to false, so every single-answer screen
// (IntakeFor, IntakeCoverage, BookTime, the medical-safety list) renders
// exactly the shape it did before. Only the shape of the indicator and the
// ARIA role change: a ROUND indicator is the long-standing signal for "pick
// one", so a list that accepts several must not wear it — the owner's note
// (2026-09-01) was that "What are you noticing?" only ever kept one answer,
// and a viewer cannot tell a one-of list from a several-of list when both
// draw the same circle. Square + `aria-pressed` is the multi-select pair;
// round + `aria-checked`/`radio` stays the single-select one, so assistive
// tech is told which list it is on rather than inferring it from the tick.
export function Option({title,sub,active,onClick,icon:Icon,multi=false}:{title:string;sub?:string;active?:boolean;onClick?:()=>void;icon?:any;multi?:boolean}){return <button type="button" onClick={onClick} {...(multi?{"aria-pressed":!!active}:{role:"radio","aria-checked":!!active})} className={`flex w-full items-center gap-3 rounded-[20px] border p-4 text-left transition ${active?"border-brand-teal bg-[#edfbfa]":"border-[#dfeaec] bg-white"}`}>{Icon&&<span className={`grid h-11 w-11 place-items-center rounded-2xl ${active?"bg-brand-teal text-white":"bg-[#f0f6f6] text-brand-teal"}`}><Icon size={21}/></span>}<span className="flex-1"><b className="block text-[15px]">{title}</b>{sub&&<span className="mt-1 block text-xs leading-5 text-slate-500">{sub}</span>}</span><span className={`grid h-5 w-5 shrink-0 place-items-center border ${multi?"rounded-md":"rounded-full"} ${active?"border-brand-teal bg-brand-teal text-white":"border-slate-300"}`}>{active&&<Check size={13}/>}</span></button>}
// `nextDisabled` is opt-in and defaults to false: every step that preselects
// an answer (IntakeFor, IntakeCoverage, BookTime) can always continue, exactly
// as before. Only the multi-select needs step starts genuinely empty, and an
// empty answer to "what are you noticing?" must not walk the viewer forward.
export function StepPage({title,subtitle,step,children,onBack,onNext,next="Continue",nextDisabled=false}:{title:string;subtitle:string;step:number;children:React.ReactNode;onBack:()=>void;onNext:()=>void;next?:string;nextDisabled?:boolean}){return <Shell><PageHeader title={title} subtitle={subtitle} onBack={onBack} eyebrow="Smart matching"/><Progress step={step} total={5}/><div className="space-y-3">{children}</div><div className="mt-7"><PrimaryButton onClick={onNext} disabled={nextDisabled}>{next}</PrimaryButton></div></Shell>}
// Everything is in PERCENTAGES of the container: the original fixed 360×280
// viewBox centered itself inside the CMA's tablet column while the markers
// kept phone-pixel offsets, so the route floated detached from its own
// endpoints (found 2026-08-31). `preserveAspectRatio="none"` stretches the
// path with the box, `vector-effect` keeps the stroke width honest, and
// `pathLength={100}` keeps the dashes uniform at any width. Markers sit on
// path coordinates and self-center with translate.
export function RouteMap({moving=false}:{moving?:boolean}){
  const marker="absolute grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-4 border-white";
  return <div className="map-grid relative h-72 overflow-hidden rounded-[26px]">
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
      <path d="M8 84 C22 72,30 65,43 55 S70 30,92 14" fill="none" stroke="#12aaa5" strokeWidth="7"
        vectorEffect="non-scaling-stroke" strokeLinecap="round" pathLength={100} strokeDasharray={moving?"2.6 2.2":"0"}/>
    </svg>
    <div className={`${marker} left-[8%] top-[84%] bg-brand-navy text-white`}><Home size={20}/></div>
    {/* The courier only ever travels toward the patient. repeatType "reverse"
        played the leg backwards on every other cycle, which read as the CMA
        driving away from the visit; "loop" restarts at the origin instead, and
        the opacity keyframes hide the instant snap-back at the wrap. */}
    <motion.div animate={moving?{left:["33%","72%"],top:["63%","32%"],opacity:[0,1,1,0]}:{}}
      transition={{duration:3,repeat:Infinity,repeatType:"loop",ease:"linear",
        opacity:{duration:3,repeat:Infinity,repeatType:"loop",ease:"linear",times:[0,0.12,0.88,1]}}}
      className={`${marker} left-[33%] top-[63%] bg-brand-teal text-white`}><Navigation size={20}/></motion.div>
    <div className={`${marker} left-[92%] top-[14%] bg-white text-brand-navy`}><MapPin size={20}/></div>
  </div>;
}
/**
 * A plain "who is acting now" line, for the moments a persona-lock removes a
 * patient's action button but no live call panel is on screen yet to say it
 * instead (see `AudiologistStrip` in cma/call-tile.tsx for the version that
 * DOES accompany a live call — this is its lighter sibling for dispatch/setup
 * screens, before the call has started).
 *
 * Reads the surface the same way PageHeader/PrimaryButton do (`useOnDark`)
 * rather than taking a `dark` prop, so it drops into either a light or navy
 * Shell without the caller having to say so twice.
 */
export function AudiologistStatusLine({children,className=""}:{children:React.ReactNode;className?:string}){
  const dark=useOnDark();
  return <div className={cn("rounded-2xl border px-4 py-3.5 text-sm font-semibold leading-6",dark?"border-white/15 bg-white/10 text-white/85":"border-[#e4eef0] bg-white text-brand-navy",className)}>{children}</div>;
}
export function DeviceVisual(){return <div className="flex h-52 items-center justify-center gap-5 bg-gradient-to-br from-[#e8f8f6] via-white to-[#edf3f8]"><div className="h-28 w-16 -rotate-6 rounded-[42px] bg-gradient-to-b from-[#ded7ca] to-[#9f978b] shadow-card"/><div className="h-28 w-16 rotate-6 rounded-[42px] bg-gradient-to-b from-[#ded7ca] to-[#9f978b] shadow-card"/></div>}
// `useStoryOptional` returns null on Demo 1's frozen, provider-less
// patient-app.tsx (see text-size.tsx for the same pattern) — there BottomNav
// keeps its original bottom-0 position untouched. Under Demo 2's
// <StoryProvider>, the phone-docked demo control bar (demo-shell.tsx) also
// wants bottom-0, so BottomNav stacks flush above it instead — bottom-14
// (== the control bar's h-14) on phone, reverting to bottom-0 on md: where
// that bar is md:hidden. This is a positioning change only: BottomNav's own
// items, height, and behavior are unchanged, and Demo 1 never sees a story,
// so it renders exactly as before.
export function BottomNav({current,go}:{current:ScreenId;go:(s:ScreenId)=>void}){if(["welcome","signin"].includes(current))return null;const story=useStoryOptional();const items:[[string,any,ScreenId],[string,any,ScreenId],[string,any,ScreenId],[string,any,ScreenId]]=[["Home",Home,"home"],["Journey",Navigation,"assigned"],["Messages",MessageCircle,"support"],["Profile",UserRound,"intake-for"]];return <div className={cn("fixed inset-x-0 z-30 border-t border-[#dce7e9] bg-white/95 backdrop-blur",story?"bottom-14 md:bottom-0":"bottom-0")}>{/* The tab label is the only thing naming each destination, so it is held
    to the same 4.5:1 floor as body text, not treated as decorative chrome:
    the active tab was Vital Teal (2.86:1 at 10px) and the rest slate-400
    (2.40:1). Active now uses Teal Ink and carries its own weight step, so
    the selected tab still reads as selected without relying on a colour
    that cannot be seen. Each button is also a real 44px touch target
    (measured 40px) — the patient persona's low-vision, larger-target
    standard applies most to the control that is on every screen. */}
<div className="mx-auto flex h-20 max-w-md items-stretch justify-around">{items.map(([l,I,t])=><button onClick={()=>go(t)} key={l} aria-current={current===t?"page":undefined} className={cn("flex min-h-11 flex-1 flex-col items-center justify-center gap-1 rounded-xl text-[10px] transition",current===t?"font-extrabold text-teal-ink":"font-bold text-slate-500")}><I size={20}/>{l}</button>)}</div></div>}
