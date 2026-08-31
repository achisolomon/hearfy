import type { Config } from "tailwindcss";

/**
 * Muted ink, corrected at the token layer (2026-08-31).
 *
 * Walking the patient journey at 390px measured every muted string in the
 * app below the 4.5:1 floor PRODUCT.md sets for body text:
 *
 *   slate-500 #64748B on Harbor Ground #F4F8F8 → 4.45:1  (fails)
 *   slate-400 #94A3B8 on Harbor Ground        → 2.40:1  (fails badly)
 *
 * slate-500 passes on pure white (4.76:1), which is why this survived review
 * — but the app's ground is Harbor Ground, not white, and that is where the
 * subtitles actually sit. DESIGN.md already names both faults ("Slate Muted
 * is the floor for body-size muted text"; "don't use slate-400 for anything
 * longer than a two-word meta label"), so the shipped values were drift from
 * the documented system rather than a deliberate choice.
 *
 * Fixing 161 call sites one at a time would be decoration on drift and would
 * re-drift the moment someone typed `text-slate-500` again. Redefining what
 * those two names resolve to fixes every existing screen at once and makes
 * the correct value the one that comes out of the ordinary Tailwind class.
 * Both stay recognisably the same muted blue-grey, one step deeper, and both
 * clear 4.5:1 on all four grounds in use (Harbor Ground, white, the #F2F7F7
 * inner tile, and the #E8F9F8 teal tint):
 *
 *   slate-500 → #556575  worst case 5.52:1
 *   slate-400 → #5C6C80  worst case 4.94:1
 *
 * slate-400 keeps a visible step of separation below slate-500 while still
 * clearing the floor, so the meta/body hierarchy reads as before.
 */
const config:Config={content:["./app/**/*.{js,ts,jsx,tsx,mdx}","./components/**/*.{js,ts,jsx,tsx,mdx}"],theme:{extend:{colors:{"brand-navy":"#0B2340","brand-teal":"#12AAA5","brand-bg":"#F4F8F8","teal-ink":"#087D7A",slate:{400:"#5C6C80",500:"#556575"}},boxShadow:{card:"0 18px 45px rgba(11,35,64,.09)",soft:"0 8px 24px rgba(11,35,64,.10)"}}},plugins:[]};export default config;
