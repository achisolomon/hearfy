"use client";
import { useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/cn";
import { WORDMARK_HEAD, WORDMARK_TAIL } from "@/lib/mock-data";

/**
 * The mark, from the owner's logo file (Hearfy-Logo-01, handed over 2026-09-02).
 *
 * An SVG rebuild rather than the JPEG itself: the file is raster on a hard
 * white ground, so it would have shown a white box on the welcome screen's
 * teal gradient card, could not follow the brand tokens, and would soften on
 * retina. Vector also keeps `compact` and `wordmarkFromLg` meaningful — a
 * flat image of the whole lockup has no wordmark to drop.
 *
 * The arc is drawn as a path, not a bordered circle with a cut-out: it is a
 * two-thirds sweep opening to the right, which is the shape a clipped circle
 * cannot make without a mask. The fourth bar sits at 45% opacity and the dot
 * carries the sound out to the right — both are in the source file and both
 * read as the signal fading rather than stopping.
 */
/**
 * True when the viewer asked their OS for less motion. SSR-safe: the server
 * snapshot is always `false`, and the subscription corrects it on mount, so
 * the markup matches on hydration.
 */
function usePrefersReducedMotion(){
  return useSyncExternalStore(
    (cb) => {
      const q = window.matchMedia("(prefers-reduced-motion: reduce)");
      q.addEventListener("change", cb);
      return () => q.removeEventListener("change", cb);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

/**
 * The mark's entry animation: each element arrives in reading order, left to
 * right — the ear catches the sound, the waves carry it, the dot releases it.
 * That is the logo's own story, so the order is not decorative.
 *
 * Opt-in (`animate`) and used only on the cover and welcome screens, per
 * DESIGN.md §5: "it is the only place the brand performs". The same mark in
 * the chrome bar sits on every screen and must not twitch on each navigation.
 */
/**
 * How many elements the mark is built from: arc, three bars, dot. Pinned as a
 * constant so a regression test can assert every one of them is animatable —
 * an element added to the SVG but left as a plain <rect> would sit still while
 * the rest arrived, which reads as a rendering bug rather than a logo.
 */
const MARK_PARTS = 5;
/** Seconds between one element's arrival and the next. */
const MARK_STAGGER = 0.11;

/**
 * The two sizes the lockup ships at.
 *
 * `sm` is the working size — chrome bar, in-screen headers — and is what the
 * mark has always been. `lg` is for the cover, where the brand is the subject
 * of the screen rather than a label on it (owner, 2026-09-02: "in the cover
 * screen make it bigger").
 *
 * Literal Tailwind classes, never interpolated: the wordmark once vanished at
 * every width because a built-up `${p}:inline` compiled to no class at all,
 * and a `h-[${n}px]` here would fail exactly the same way.
 *
 * The gap grows with the mark so the lockup keeps its proportions — a large
 * mark against the small gap reads as two pieces that happen to be adjacent.
 */
const SIZES = {
  sm: { box: "h-8 w-[42px]", word: "text-[19px]", gap: "gap-2.5" },
  lg: { box: "h-14 w-[74px]", word: "text-[34px]", gap: "gap-4" },
} as const;

export function BrandLogo({ compact=false, className="", wordmarkFromLg=false, animate=false, size="sm" }:{compact?:boolean;className?:string;
  /** "lg" is the cover's hero lockup; everything else stays "sm". */
  size?:keyof typeof SIZES;
  /**
   * Play the entry animation once on mount. Off everywhere by default: the
   * chrome bar's logo would replay it on every re-render. Honours
   * `prefers-reduced-motion`, where every element is simply present.
   */
  animate?:boolean;
  /**
   * Hold the wordmark back until `lg`. The demo shell's top bar needs it: at
   * 768px the bar's own contents — mark, four role tabs, Back and Next — leave
   * no room for the name, and "Operator" ran straight into "Back". Written as
   * a literal class, not an interpolated prefix: Tailwind only compiles class
   * names it can see in the source, so a built-up `${p}:inline` silently
   * renders as no class at all (it did — the wordmark vanished at every width).
   */
  wordmarkFromLg?:boolean}){
  // Each element fades up and slides a little from the left, in source order.
  // `custom` carries the index so one variant serves all five.
  const S = SIZES[size];
  const hidden = { opacity: 0, x: -5 };
  // The fourth bar is drawn at 45% in the source file — it must land there,
  // not at full strength, or the mark's fade-out reads as a solid bar.
  const partShown = (i:number, o=1) => ({ opacity: o, x: 0,
    transition: { delay: i * MARK_STAGGER, duration: .42, ease: [.22,1,.36,1] as const } });
  // Reduced motion: no entry at all, every element simply present. Framer's
  // `reducedMotion="user"` only drops transforms, so a fade would still play;
  // this gate is explicit, the same way the video and counter screens do it.
  const still = usePrefersReducedMotion();
  const play = animate && !still;
  // When motion is off the element must simply BE there. Returning `{}` was a
  // bug: the SVG attribute `opacity` is only set on the faded bar, so the other
  // four had no opacity at all — and any element that had already taken
  // `initial: 0` from a previous render stayed invisible. Pin the final state
  // explicitly instead, with no transition.
  const anim = (i:number, o=1) => play
    ? { initial: hidden, animate: partShown(i, o) }
    : { initial: false as const, animate: { opacity: o, x: 0 }, transition: { duration: 0 } };
  return <div className={cn("flex items-center",S.gap,className)}>
    <svg viewBox="0 0 42 32" className={cn("shrink-0",S.box)} fill="none" aria-hidden>
      <motion.path {...anim(0)} d="M13 3a13.5 13.5 0 0 0 0 26" strokeWidth="2.6" strokeLinecap="round" className="stroke-brand-teal"/>
      <motion.rect {...anim(1)} x="17.5" y="11" width="3" height="10" rx="1.5" className="fill-brand-teal"/>
      <motion.rect {...anim(2)} x="23" y="6.5" width="3.4" height="19" rx="1.7" className="fill-brand-teal"/>
      <motion.rect {...anim(3, .45)} x="29" y="9" width="3.4" height="14" rx="1.7" className="fill-brand-teal"/>
      <motion.circle {...anim(4)} cx="38" cy="16" r="2.6" className="fill-brand-teal"/>
    </svg>
    {!compact&&<span className={cn("font-extrabold tracking-[-.01em] text-brand-navy", S.word,
      wordmarkFromLg&&"hidden lg:inline")}>{WORDMARK_HEAD}{/*
      Teal Ink, not Vital Teal. The logo file tints these letters in Vital
      Teal, which measures 2.87:1 on white — under the 4.5:1 floor for text,
      and the reason `contrast.test.ts` flags a bare `text-brand-teal` here.
      Teal Ink is the same hue at 4.97:1 and is already the app's colour for
      teal text everywhere else, so the wordmark matches the eyebrows and
      labels around it rather than being the one lighter thing on the page.
      The MARK keeps Vital Teal: it is decoration, not text. */}
      <span className="text-teal-ink">{WORDMARK_TAIL}</span></span>}
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
export function PageHeader({title,subtitle,onBack,eyebrow}:{title:string;subtitle?:string;onBack?:()=>void;eyebrow?:string}){return <header className="mb-6"><div className="mb-5 flex items-center justify-between">{onBack?<button onClick={onBack} aria-label="Go back" className="grid h-11 w-11 place-items-center rounded-full border border-[#e1ebed] bg-white text-brand-navy transition hover:bg-[#f4f8f8]"><ArrowLeft size={19}/></button>:<BrandLogo className="md:hidden"/>}{eyebrow&&<span className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#087d7a]">{eyebrow}</span>}</div><h1 className="text-[30px] font-extrabold leading-[1.08] tracking-[-.03em] text-balance text-brand-navy">{title}</h1>{subtitle&&<p className="mt-3 text-[15px] leading-6 text-slate-500">{subtitle}</p>}</header>}
export function StatusPill({children,tone="teal"}:{children:React.ReactNode;tone?:"teal"|"blue"|"green"|"amber"}){const tones={teal:"bg-[#e8f9f8] text-[#087d7a]",blue:"bg-[#edf4fb] text-[#235f98]",green:"bg-[#edf8f2] text-[#237451]",amber:"bg-[#fff6e8] text-[#9d6514]"};return <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold",tones[tone])}><Check size={13}/>{children}</span>}
export function Progress({step,total}:{step:number;total:number}){return <div className="mb-6"><div className="mb-2 flex justify-between text-[11px] font-bold text-slate-400"><span>STEP {step} OF {total}</span><span>{Math.round(step/total*100)}%</span></div><div className="h-1.5 rounded-full bg-[#e4eeee]"><div className="h-full rounded-full bg-brand-teal transition-all" style={{width:`${step/total*100}%`}}/></div></div>}
export function SecureFooter(){return <div className="mt-7 flex items-center justify-center gap-2 text-[11px] font-semibold text-slate-400"><ShieldCheck size={14}/>HIPAA-ready demo · Secure & encrypted</div>}
