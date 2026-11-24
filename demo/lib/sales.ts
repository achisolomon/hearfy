import { BRAND_NAME } from "./mock-data";

/**
 * Copy for the public /sales page.
 *
 * Source: the community sales deck "Concierge Hearing" (2026-11-23).
 *
 * This page is public, so it carries no prices, no staffing or supervision
 * ratio, and no claim that staff are trained or certified by the company.
 * lib/sales.test.ts fails the build if any of those reach this file.
 * The company name always comes from BRAND_NAME, never a literal.
 */

export type Tone = "dark" | "light";
export type SlideKind = "cover" | "close";

export interface Title {
  lead: string;
  /** Set in italic accent colour after the lead. */
  accent?: string;
}

export interface Card {
  title: string;
  body?: string;
  tag?: string;
  /** The one card per slide that carries the point. */
  hero?: boolean;
}

export interface Stat {
  value: string;
  label: string;
  body?: string;
  hero?: boolean;
}

export interface Pillar {
  name: string;
  line: string;
  body: string;
  tags: string[];
}

export interface Leader {
  name: string;
  role: string;
}

export interface Band {
  text: string;
  accent: string;
}

export interface Slide {
  id: string;
  tone: Tone;
  kind?: SlideKind;
  eyebrow: string;
  title: Title;
  lede?: string;
  label?: string;
  stats?: Stat[];
  cards?: Card[];
  /** Prefix each card with 01, 02, ... */
  numbered?: boolean;
  pillars?: Pillar[];
  leaders?: { label: string; line: string; people: Leader[] };
  band?: Band;
  /** Tracked uppercase sign-off line. */
  signature?: string;
  closing?: string;
  source?: string;
  footer?: [string, string];
  ask?: string;
}

export const CONTACT = {
  name: "Isaac Greszes, CRO",
  email: "Isaac@hearfy.org",
  site: "hearfy.org",
} as const;

const CONCIERGE = `${BRAND_NAME} · Concierge hearing`;

export const SLIDES: Slide[] = [
  {
    id: "cover",
    tone: "dark",
    kind: "cover",
    eyebrow: CONCIERGE,
    title: { lead: "Hearing care", accent: "that comes to you." },
    footer: ["People · Service · Tech", "November 2026"],  },
  {
    id: "problem",
    tone: "light",
    eyebrow: "The blind spot",
    title: { lead: "The earliest warning sign", accent: "is the easiest to miss." },
    lede: "Hearing loss often shows up first: before a fall, before a resident pulls away, before the family calls. Most communities check it once.",
    label: "Untreated hearing loss is associated with:",
    stats: [
      { value: "~50%", label: "more hospital stays" },
      { value: "~44%", label: "higher 30-day readmission risk" },
      { value: "46%", label: "higher healthcare costs over 10 years", hero: true },
    ],
    source: "Reed et al., JAMA Otolaryngology–Head & Neck Surgery, 2018. Claims data; association, not cause.",
  },
  {
    id: "today",
    tone: "dark",
    eyebrow: "Today",
    title: { lead: "A free test day", accent: "is not a hearing program." },
    numbered: true,
    cards: [
      { title: "One screening, then a sales pitch." },
      { title: "Little follow-up after the sale.", body: "Aids sit in drawers. Batteries die. Settings drift." },
      { title: "Problems surface only when a family calls.", hero: true },
    ],
  },
  {
    id: "brand",
    tone: "dark",
    eyebrow: BRAND_NAME,
    title: { lead: "Hearing care that stays", accent: "in your building." },
    lede: "Licensed hearing professionals visit on a schedule, with an audiologist overseeing care and technology behind them.",
    cards: [
      { title: "Every resident checked", body: "Not only the ones who buy." },
      { title: "Monthly visits", body: "Cleaning, adjustments and repairs, in the community." },
      {
        title: "Early flags",
        body: "Your wellness team hears when something changes, with the resident's consent.",
        hero: true,
      },
    ],
    closing: "We don't wait for the problem. We see it coming.",
  },
  {
    id: "pillars",
    tone: "dark",
    eyebrow: `The ${BRAND_NAME} standard`,
    title: { lead: "Three promises.", accent: "One standard of care." },
    pillars: [
      {
        name: "People",
        line: "Known by name.",
        body: "The same licensed professional, every visit. Part of your community, not a stranger.",
        tags: ["Licensed", "Same face", "Belonging"],
      },
      {
        name: "Service",
        line: "It comes to you.",
        body: "Premium care brought to your door, and kept up month after month.",
        tags: ["Proactive", "Ongoing", "White-glove"],
      },
      {
        name: "Tech",
        line: "Quietly brilliant.",
        body: "Premium devices and a platform that works in the background.",
        tags: ["Premium devices", "Audiologist-led", "Family app"],
      },
    ],
    signature: "People. Service. Tech.",
  },
  {
    id: "community",
    tone: "dark",
    eyebrow: "For your community",
    title: { lead: "Residents who hear", accent: "stay engaged." },
    cards: [
      {
        title: "No cost to the community. No extra work for staff.",
        body: "We bring the team, the equipment and the follow-up.",
      },
      {
        title: "Fewer avoidable transfers.",
        body: "A hospital trip often leads to a higher level of care. Hearing is a fixable part of that risk.",
        tag: "A goal we track together, not a promise",
      },
      {
        title: "Families see the care.",
        body: "A visible, ongoing service families talk about.",
        hero: true,
      },
    ],
  },
  {
    id: "offer",
    tone: "dark",
    eyebrow: "For residents and families",
    title: { lead: "Simple to start.", accent: "Easy to keep." },
    numbered: true,
    cards: [
      { title: "A free hearing check", body: "Right in the community." },
      { title: "A personal evaluation", body: "With a licensed hearing professional." },
      { title: "Fitted, tuned and connected to your devices", body: "With a 30-day trial." },
      { title: "Membership", body: "Monthly visits, help anytime, and the app." },
    ],
    band: { text: "Clear membership pricing.", accent: "Flexible plans for devices." },
  },
  {
    id: "clinical",
    tone: "dark",
    eyebrow: "Clinical model",
    title: { lead: "Licensed. Trained.", accent: "Connected." },
    cards: [
      { title: "Licensed.", body: "Every visit is done by a licensed hearing professional." },
      { title: "Trained.", body: "Trained in senior care. An audiologist oversees each care plan." },
      {
        title: "Connected.",
        body: "Clear results for the resident, the family and your wellness team. Medical concerns go straight to the resident's doctor.",
        hero: true,
      },
    ],
    leaders: {
      label: "Clinical leadership",
      line: "Clinical-grade testing. Secure records. Audiologist review.",
      people: [
        {
          name: "Prof. Amyn M. Amlani, PhD",
          role: "Chief Audiology Advisor; past President, Academy of Doctors of Audiology",
        },
        { name: "Zahi Tubul, MA/PhD", role: "Clinical Audiologist, Kaplan Medical Center" },
        { name: "Dr. Michael Mastai", role: "Chief Medical Officer" },
      ],
    },
  },
  {
    id: "evidence",
    tone: "light",
    eyebrow: "Why hearing care",
    title: { lead: "Hearing care is linked to fewer falls", accent: "and slower decline." },
    stats: [
      {
        value: "~27%",
        label: "fewer falls",
        body: "In a large 3-year randomized trial (ACHIEVE), older adults who received hearing care reported about 27% fewer falls.",
      },
      {
        value: "48%",
        label: "slower cognitive decline, in the higher-risk group only",
        body: "In the same trial. No effect in the full study group.",
        hero: true,
      },
    ],
    source: "Goman AM et al., Lancet Public Health, 2025 (falls); Lin FR et al., Lancet, 2023 (cognition).",
  },
  {
    id: "scorecard",
    tone: "light",
    eyebrow: "Pilot scorecard",
    title: { lead: "One shared view of hearing", accent: "in your community." },
    lede: "A monthly report. What we'll track together, not promises.",
    numbered: true,
    cards: [
      { title: "Share of residents screened" },
      { title: "Hearing aid use and issues fixed" },
      { title: "Falls and hospital transfers among members, against your baseline" },
      { title: "Resident and family satisfaction" },
    ],
  },
  {
    id: "pilot",
    tone: "dark",
    eyebrow: "Pilot",
    title: { lead: "One community. 90 days.", accent: "Clear measures." },
    cards: [
      { title: "Every willing resident screened." },
      { title: "Weekly visit days for the full pilot." },
      { title: "A monthly scorecard, and a review at day 90." },
      { title: "Success measures agreed upfront." },
    ],
    band: {
      text: "No cost to the community.",
      accent: "Members pay as they join, with a full refund if something is not right.",
    },
  },
  {
    id: "close",
    tone: "dark",
    kind: "close",
    eyebrow: CONCIERGE,
    title: { lead: "Start with one community." },
    ask: "Sign a letter of intent for a 90-day pilot.",
  },
];
