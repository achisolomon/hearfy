import type { Metadata } from "next";
import {
  Ban,
  CalendarCheck,
  ClipboardList,
  Ear,
  FileHeart,
  Headphones,
  Home,
  Phone,
  Stethoscope,
  Video,
} from "lucide-react";
import { BrandLogo } from "@/components/ui";
import { CountUp, DotGrid, LiveBrandLogo, LoopVideo, Reveal } from "@/components/one-pager/motion";
import { asset } from "@/lib/asset";
import { BRAND_NAME } from "@/lib/mock-data";
import {
  CONTRAST,
  CTA,
  HERO,
  HOW,
  MARKET,
  MEDIA,
  PROBLEM,
  SYSTEM,
  TRUST,
} from "@/lib/one-pager";

/**
 * The public one-pager.
 *
 * A separate route rather than a section of the demo: the demo is a persona
 * walkthrough behind a shell, and this is a document — one scroll, no state,
 * no role switching. It is the page a link in an email or a QR code on a
 * leaflet should land on.
 *
 * Content and the media manifest are in `lib/one-pager.ts`, and
 * `lib/one-pager.test.ts` fails the build if any business figure reaches
 * either file. Nothing here may hardcode a number that is not already public
 * in the product.
 *
 * A server component: the only client code is the motion module, so the copy,
 * layout, and imagery render on the server and the page stays fast on the
 * phone-shaped traffic a leaflet or an email link sends.
 *
 * Imagery is cropped from the founders' LIVE deck (exported 2026-09-02),
 * which is already branded HEARFY; the videos are the demo's own. See
 * MEDIA in lib/one-pager.ts for the provenance of each file.
 */
export const metadata: Metadata = {
  title: `${BRAND_NAME} — a hearing exam at home`,
  description:
    "A full diagnostic hearing exam in your own home. A Certified Medical Assistant brings the equipment; a licensed audiologist runs the exam live. Results explained the same day.",
};

/* ------------------------------------------------------------------ *
 * Small presentational pieces, local to this page.
 * ------------------------------------------------------------------ */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-teal-ink">
      {children}
    </p>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-3 text-[26px] font-extrabold leading-[1.12] tracking-[-0.02em] text-brand-navy sm:text-[30px]">
      {children}
    </h2>
  );
}

/** A soft white card on the tinted ground — the system's primary surface. */
function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[24px] border border-[#E4EEF0] bg-white p-6 shadow-card print:shadow-none ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * A photograph in a rounded frame.
 *
 * Plain `<img>` rather than `next/image`: the export is static
 * (`images.unoptimized`), so next/image would add a wrapper and a srcset that
 * resolve to the same single file — all of the machinery, none of the
 * benefit. `asset()` is mandatory for a raw src, or the URL 404s under the
 * /hearfy/ basePath in production while working on localhost.
 */
function Photo({
  src,
  alt,
  className = "",
  imgClassName = "",
}: {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
}) {
  return (
    <div className={`overflow-hidden rounded-[20px] bg-[#E4EEF0] ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={asset(src)} alt={alt} className={`h-full w-full object-cover ${imgClassName}`} />
    </div>
  );
}

/**
 * The 17-in-100 figure.
 *
 * The filled marks are spread one-or-two per row rather than packed into the
 * first seventeen cells. Packed, they read as a solid block occupying the top
 * fifth of the grid — the eye measures the block's area and the proportion
 * still lands, but it looks like a bar chart with a stray tail. Distributed,
 * the only available reading is the true one: scattered individuals among
 * many.
 *
 * Deterministic (every 100/17th cell), not random, so the figure is honest
 * and the server and client render identically.
 */
const TREATED_CELLS = Array.from(
  { length: 100 },
  (_, i) => Math.floor((i * 17) / 100) !== Math.floor(((i + 1) * 17) / 100),
);

const HOW_ICONS = [CalendarCheck, Home, Stethoscope, FileHeart, Headphones];
const SYSTEM_ICONS = [Home, Video, ClipboardList];

export default function OnePagerPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-5 pb-24 pt-8 sm:px-8 sm:pt-12">
      {/* ---------------------------------------------------------- *
       * Masthead
       * ---------------------------------------------------------- */}
      <header className="flex items-center justify-between gap-4">
        {/* The mark arrives (arc, bars, dot, in reading order) and then keeps
            breathing — the shared BrandLogo stops after its entry, which reads
            as an animation that broke. LiveBrandLogo adds the loop for this
            page only. If the parallel session's animated asset lands, swap it
            in HERE and nowhere else. */}
        <LiveBrandLogo size="lg" />
        <p className="hidden text-right text-[13px] font-semibold leading-snug text-slate-500 sm:block">
          {HERO.eyebrow}
        </p>
      </header>

      {/* Hero: the exam itself, playing. The video carries the claim that this
          is a real clinical encounter far better than any illustration. */}
      <section className="mt-10 grid items-center gap-10 lg:mt-14 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
        <Reveal>
          <h1 className="text-[34px] font-extrabold leading-[1.06] tracking-[-0.03em] text-brand-navy sm:text-[46px]">
            {HERO.title[0]}
            <br />
            <span className="text-teal-ink">{HERO.title[1]}</span>
          </h1>

          <p className="mt-5 max-w-xl text-[16px] leading-[1.6] text-slate-500 sm:text-[17px]">
            {HERO.lede}
          </p>

          <ul className="mt-6 flex flex-wrap gap-2">
            {HERO.chips.map((chip) => (
              <li
                key={chip}
                className="rounded-full bg-[#E8F9F8] px-4 py-1.5 text-[13px] font-bold text-teal-ink"
              >
                {chip}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="relative overflow-hidden rounded-[28px] bg-white p-2 shadow-card print:shadow-none">
            <Photo
              src={MEDIA.hero.src}
              alt={MEDIA.hero.alt}
              className="aspect-[4/3] w-full rounded-[22px]"
            />
            <span className="absolute left-6 top-6 inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-[12px] font-extrabold text-teal-ink shadow-soft">
              <span className="h-2 w-2 rounded-full bg-brand-teal" />
              A visit at home
            </span>
          </div>
        </Reveal>
      </section>

      {/* The thesis line, given the weight of a pull quote. */}
      <Reveal>
        <blockquote className="mt-12 rounded-[24px] bg-brand-navy px-7 py-8 text-center sm:px-12 sm:py-10">
          <p className="text-[22px] font-extrabold leading-[1.2] tracking-[-0.02em] text-white sm:text-[28px]">
            {HERO.thesis}
          </p>
        </blockquote>
      </Reveal>

      {/* ---------------------------------------------------------- *
       * Problem
       * ---------------------------------------------------------- */}
      <section className="mt-16">
        <Reveal>
          <SectionLabel>The problem</SectionLabel>
          <SectionTitle>{PROBLEM.title}</SectionTitle>
        </Reveal>

        {/* One dense block: three stats across the top, then the figure and
            the barriers side by side. Every earlier arrangement left a hole —
            stats in a row above a tall grid, or a stretched column beside it —
            because a 10x10 grid is simply taller than three one-line cards.
            Pairing the grid with the four barriers instead gives it a
            neighbour of its own height, and nothing has to stretch. */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {PROBLEM.stats.map((stat, i) => (
            <Reveal key={stat.label} delay={i * 0.08}>
              {/* `min-w-0` on the flex child and no `shrink-0` on the figure:
                  at 320px with a large accessibility font the old row could not
                  fit, and pushed the card past the viewport. */}
              <Card className="flex h-full items-center gap-4 !p-5">
                <CountUp
                  value={stat.value}
                  className="text-[30px] font-extrabold leading-none tracking-[-0.03em] text-brand-navy"
                />
                <span className="min-w-0">
                  <span className="block break-words text-[14px] leading-snug text-slate-500">
                    {stat.label}
                  </span>
                  <span className="mt-1 block text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
                    {stat.source}
                  </span>
                </span>
              </Card>
            </Reveal>
          ))}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.05fr]">
          <Reveal>
            <Card className="flex h-full flex-col">
              <p className="text-[13px] font-bold text-brand-navy">
                Of everyone who needs hearing aids
              </p>
              <div className="mt-4 flex flex-1 items-center">
                <div className="mx-auto w-full max-w-[300px]">
                  <DotGrid cells={TREATED_CELLS} />
                </div>
              </div>
              <p className="mt-4 flex items-center gap-2 text-[13px] text-slate-500">
                <span className="h-3 w-3 rounded-[2px] bg-brand-teal" />
                17 in 100 have them
              </p>
            </Card>
          </Reveal>

          {/* The barriers move up beside the figure: they answer the question
              the figure raises ("why only 17?"), so the pairing reads better
              than the stack did, and it fills the row. */}
          <Reveal delay={0.1}>
            <Card className="flex h-full flex-col">
              <p className="text-[13px] font-bold text-brand-navy">
                {PROBLEM.barriersTitle}
              </p>
              <ul className="mt-4 flex flex-1 flex-col justify-between gap-4">
                {PROBLEM.barriers.map((b) => (
                  <li key={b.name}>
                    <p className="text-[15px] font-extrabold text-brand-navy">
                      {b.name}
                    </p>
                    <p className="mt-1 text-[14px] leading-[1.5] text-slate-500">
                      {b.line}
                    </p>
                  </li>
                ))}
              </ul>
            </Card>
          </Reveal>
        </div>
      </section>

      {/* ---------------------------------------------------------- *
       * Market — where Hearfy sits
       * ---------------------------------------------------------- */}
      <section className="mt-16">
        <Reveal>
          <SectionLabel>The market</SectionLabel>
        </Reveal>

        <Reveal>
          <SectionTitle>{MARKET.title}</SectionTitle>
        </Reveal>

        {/* The page's rhythm is a modular grid of small cards: three-up stat
            rows and two-up split rows, every card 345-348px wide. The first
            version of this section was a single 1080px slab at a 6.4:1 aspect
            — the only full-bleed element on the page — which is what read as
            "white space on the right" and as not matching the page (owner,
            2026-09-02). The problem was never the gap; it was that the
            section had abandoned the grid everything else is built on.

            So: the same two-column split the problem section uses above it.
            The figure takes the narrower cell, its qualifiers the wider one,
            and both cards match the height and width of every other card on
            the page. */}
        <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_1.05fr]">
          <Reveal>
            {/* The number, given a card of its own so it reads as a single
                fact rather than a banner. `items-center` + `flex-1` centres
                it optically in whatever height the row settles at. */}
            <Card className="flex h-full flex-col">
              <p className="text-[13px] font-bold text-brand-navy">
                {MARKET.headline}
              </p>
              <div className="flex flex-1 items-center justify-center py-6">
                {/* Capped at 76px, below the 30px section H2's optical weight
                    at display scale. The earlier 88-104px made a supporting
                    statistic louder than the page's own headings. */}
                <p className="text-[clamp(52px,9vw,76px)] font-extrabold leading-[0.9] tracking-[-0.04em] text-brand-navy">
                  {MARKET.figure}
                  {/* Teal on the unit: the "alive or chosen" colour marking
                      the one thing the section exists to say. */}
                  <span className="text-brand-teal">{MARKET.unit}</span>
                </p>
              </div>
              <p className="text-[13px] leading-[1.5] text-slate-500">
                {MARKET.footnote}
              </p>
            </Card>
          </Reveal>

          {/* The qualifiers answer the question the number raises ("$36B of
              what?"), so they pair with it the way the barriers pair with the
              17-in-100 figure above — a neighbour of its own height, nothing
              stretched. */}
          <Reveal delay={0.1}>
            <Card className="flex h-full flex-col">
              <p className="text-[13px] font-bold text-brand-navy">
                {MARKET.breakdownTitle}
              </p>
              <ul className="mt-4 flex flex-1 flex-col justify-between gap-4">
                {MARKET.breakdown.map((item) => (
                  <li key={item.name}>
                    <p className="text-[15px] font-extrabold text-brand-navy">
                      {item.name}
                    </p>
                    <p className="mt-1 text-[14px] leading-[1.5] text-slate-500">
                      {item.line}
                    </p>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
                {MARKET.sources}
              </p>
            </Card>
          </Reveal>
        </div>
      </section>

      {/* ---------------------------------------------------------- *
       * Contrast — clinic today vs. a visit at home
       * ---------------------------------------------------------- */}
      <section className="mt-16">
        <Reveal>
          <SectionLabel>The difference</SectionLabel>
          <SectionTitle>{CONTRAST.title}</SectionTitle>
        </Reveal>

        {/* Three cells of equal size on ONE row: the clinic list, the Hearfy
            list, and the exam running (owner, 2026-09-02: "don't take space,
            put this like three evenly size square on the same row"). The video
            used to sit full-width BELOW the pair, which cost a whole band of
            page height for one picture.

            `auto-rows-fr` equalises them, and the video is positioned
            `absolute inset-0` inside a `relative` cell for the same reason the
            step grid's photo is: media has an intrinsic aspect ratio, and left
            in flow it becomes the floor for the row and pads the two lists out
            with dead space. Out of flow it simply fills whatever the lists
            need. Being a third of the row also holds it near its native 640px
            rather than upscaling it. */}
        <div className="mt-8 grid auto-rows-fr gap-5 md:grid-cols-2 lg:grid-cols-3">
          <Reveal className="h-full">
            <Card className="flex h-full flex-col bg-[#F7FAFB]">
              <p className="text-[15px] font-extrabold text-slate-500">
                {CONTRAST.clinic.label}
              </p>
              <ul className="mt-4 space-y-3.5">
                {CONTRAST.clinic.points.map((p) => (
                  <li key={p} className="flex items-start gap-3 text-[15px] text-slate-500">
                    <Ban aria-hidden className="mt-[3px] h-4 w-4 shrink-0 text-slate-400" />
                    {p}
                  </li>
                ))}
              </ul>
            </Card>
          </Reveal>

          {/* Teal marks what has been chosen, per the colour rule. */}
          <Reveal delay={0.1} className="h-full">
            <Card className="flex h-full flex-col border-[#12AAA5]/35 bg-[#F4FCFC]">
              <p className="text-[15px] font-extrabold text-teal-ink">
                {CONTRAST.home.label}
              </p>
              <ul className="mt-4 space-y-3.5">
                {CONTRAST.home.points.map((p) => (
                  <li key={p} className="flex items-start gap-3 text-[15px] font-medium text-brand-navy">
                    <Ear aria-hidden className="mt-[3px] h-4 w-4 shrink-0 text-brand-teal" />
                    {p}
                  </li>
                ))}
              </ul>
            </Card>
          </Reveal>

          {/* The exam running: the evidence for "tested in your own room", now
              a peer of the two lists rather than a band beneath them. On a
              phone (one column) and a tablet (two) it falls to the end, which
              is the right reading order — the claim, then the proof. */}
          <Reveal delay={0.15} className="h-full">
            {/* `h-full`, not a min-height: the cell has to FILL the row so the
                video matches the two lists exactly (owner, 2026-09-02: "the
                video and the text same size"). A min-height lets it settle at
                its own smaller size and the row reads as ragged. */}
            <div className="relative h-full overflow-hidden rounded-[24px] bg-white p-2 shadow-card print:shadow-none">
              <LoopVideo
                src={MEDIA.visitVideo.src}
                poster={MEDIA.visitVideo.poster}
                alt={MEDIA.visitVideo.alt}
                className="absolute inset-2 h-[calc(100%-1rem)] w-[calc(100%-1rem)] rounded-[18px] object-cover object-[50%_35%]"
              />
              {/* Bottom-left, not top-left: at a third of the row the frame is
                  narrow enough that a top badge lands across the patient's
                  face. The lower band is empty in this footage. */}
              <span className="absolute bottom-5 left-5 z-10 inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-[12px] font-extrabold text-teal-ink shadow-soft">
                <span className="h-2 w-2 rounded-full bg-brand-teal" />
                Exam in progress
              </span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------------------------------------------------- *
       * How a visit works — the spine of the page
       * ---------------------------------------------------------- */}
      <section className="mt-16">
        <Reveal>
          <SectionLabel>How it works</SectionLabel>
          <SectionTitle>{HOW.title}</SectionTitle>
          <p className="mt-3 text-[16px] text-slate-500">{HOW.subtitle}</p>
        </Reveal>

        {/* `auto-rows-fr` makes every row the same height, so all six cells are
            one size regardless of how long a step's copy runs (owner, 2026-09-02:
            "make all these square the same size"). The stretch has to be carried
            all the way down — the `Reveal` wrapper is the actual grid item, so
            without `h-full` on it the cards' own `h-full` resolves against a
            wrapper that never grew, and the row height is set by the video
            alone. */}
        <ol className="mt-8 grid auto-rows-fr gap-4 md:grid-cols-2 lg:grid-cols-3">
          {HOW.steps.map((step, i) => {
            const Icon = HOW_ICONS[i];
            return (
              <Reveal key={step.n} delay={i * 0.06} className="h-full">
                <li className="h-full list-none">
                  <Card className="h-full !p-5">
                    <div className="flex items-center justify-between">
                      <span className="flex h-10 w-10 items-center justify-center rounded-[11px] bg-[#E8F9F8]">
                        <Icon aria-hidden className="h-[18px] w-[18px] text-teal-ink" />
                      </span>
                      <span className="text-[13px] font-extrabold tracking-[0.12em] text-slate-400">
                        {step.n}
                      </span>
                    </div>
                    <p className="mt-3 text-[17px] font-extrabold leading-tight text-brand-navy">
                      {step.name}
                    </p>
                    <p className="mt-1.5 text-[14px] leading-[1.5] text-slate-500">
                      {step.line}
                    </p>
                  </Card>
                </li>
              </Reveal>
            );
          })}

          {/* The sixth cell of a five-step grid: the exam photograph, so the
              row completes instead of ending on a gap.

              `absolute inset-0` inside a `relative` cell is load-bearing. The
              photo has an intrinsic height, and with `auto-rows-fr` that height
              became the floor for EVERY row — five text cards were padded out
              to match a picture, which is the empty space the owner flagged.
              Taken out of flow, the photo contributes no height of its own and
              simply fills whatever the copy asks for. */}
          <Reveal delay={0.3} className="h-full">
            <li className="relative h-full list-none">
              <Photo
                src={MEDIA.examLive.src}
                alt={MEDIA.examLive.alt}
                className="absolute inset-0"
                imgClassName="object-[50%_40%]"
              />
            </li>
          </Reveal>
        </ol>
      </section>

      {/* ---------------------------------------------------------- *
       * The system — who is responsible for what
       * ---------------------------------------------------------- */}
      <section className="mt-16">
        <Reveal>
          <SectionLabel>Behind every visit</SectionLabel>
          <SectionTitle>{SYSTEM.title}</SectionTitle>
          <p className="mt-3 max-w-2xl text-[16px] text-slate-500">
            {SYSTEM.subtitle}
          </p>
        </Reveal>

        {/* The two halves of the visit, side by side.
            Both cells are given the SAME aspect ratio and each image fills its
            frame with object-cover, so the pair aligns on both edges. Before,
            one was a fixed aspect and the other stretched to `h-full`, so the
            two photos ended at different heights — the misalignment the owner
            flagged. object-position is set per image because the subject is
            off-centre in each crop. */}
        <Reveal>
          <div className="mt-8 grid gap-4 sm:grid-cols-[1.55fr_1fr]">
            <Photo
              src={MEDIA.visitHome.src}
              alt={MEDIA.visitHome.alt}
              className="h-full"
              imgClassName="aspect-[16/10] object-[50%_45%]"
            />
            {/* The clinician side is a still, not a video: the only clinician
                footage the demo owns has a fictional persona's name legibly on
                the coat. This crop from the deck carries no name. */}
            {/* The aspect ratio must sit on the IMG, not the wrapper: the
                wrapper is a grid item and `align-items: stretch` overrides its
                own aspect, so the two photos ended at different heights. With
                both images on the same ratio the pair aligns top and bottom. */}
            <div className="relative">
              <Photo
                src={MEDIA.audiologist.src}
                alt={MEDIA.audiologist.alt}
                className="h-full"
                imgClassName="aspect-[16/10] object-[50%_28%]"
              />
              <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-[12px] font-extrabold text-teal-ink shadow-soft">
                <span className="h-2 w-2 rounded-full bg-brand-teal" />
                Supervising live
              </span>
            </div>
          </div>
        </Reveal>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {SYSTEM.parts.map((part, i) => {
            const Icon = SYSTEM_ICONS[i];
            return (
              <Reveal key={part.name} delay={i * 0.08}>
                <Card className="h-full">
                  <span className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-brand-navy">
                    <Icon aria-hidden className="h-5 w-5 text-white" />
                  </span>
                  <p className="mt-4 text-[11px] font-extrabold uppercase tracking-[0.18em] text-teal-ink">
                    {part.name}
                  </p>
                  <p className="mt-2 text-[17px] font-extrabold leading-tight text-brand-navy">
                    {part.role}
                  </p>
                  <p className="mt-2 text-[14px] leading-[1.55] text-slate-500">
                    {part.line}
                  </p>
                </Card>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ---------------------------------------------------------- *
       * Trust + close
       * ---------------------------------------------------------- */}
      <Reveal>
        <section className="mt-16 rounded-[28px] bg-brand-navy px-7 py-10 sm:px-12 sm:py-12">
          <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-14">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-brand-teal">
                What every patient can expect
              </p>
              <ul className="mt-5 space-y-3">
                {TRUST.map((t) => (
                  <li key={t} className="flex items-start gap-3 text-[15px] leading-snug text-white/85">
                    <Ear aria-hidden className="mt-[3px] h-4 w-4 shrink-0 text-brand-teal" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:border-l lg:border-white/15 lg:pl-14">
              <h2 className="text-[26px] font-extrabold leading-[1.12] tracking-[-0.02em] text-white sm:text-[30px]">
                {CTA.title}
              </h2>
              <p className="mt-3 text-[16px] leading-[1.55] text-white/75">
                {CTA.line}
              </p>

              {/* A phone number, not a walkthrough link. The owner removed the
                  "walk through the product" button on 2026-09-02: the page's
                  close should reach a person.

                  MOBILE vs DESKTOP, owner 2026-09-02: "only on mobile (on
                  desktop it will not work)". `tel:` does nothing in a desktop
                  browser — at best it opens an app-picker — so a button there
                  is an affordance that fails when used. The number is the same
                  either way; only its behaviour changes:

                    - phone (< sm): a tappable teal button that dials.
                    - desktop (>= sm): plain selectable text to read or copy.

                  Both stack label-over-number. The button was one row at
                  first, which fitted at desktop widths but broke at 390px:
                  "Contact us" split across two lines and the number wrapped
                  mid-way, as "+972-54- / 3003630". Caught by screenshot, not
                  by the computed styles, which were correct throughout — so
                  the number carries whitespace-nowrap and cannot break again.

                  Done with `sm:` classes rather than JS so it survives the
                  static export and is correct on first paint — a
                  useMediaQuery would render the wrong one until it hydrates.
                  Both branches read the SAME `CTA.contact`, so the number can
                  never drift between them. */}
              <a
                href={`tel:${CTA.contact.tel}`}
                className="mt-6 inline-flex flex-col items-start gap-1 rounded-[16px] bg-brand-teal px-6 py-4 text-[16px] font-extrabold text-brand-navy sm:pointer-events-none sm:mt-7 sm:gap-1 sm:rounded-none sm:bg-transparent sm:p-0"
              >
                <span className="inline-flex items-center gap-2 whitespace-nowrap">
                  <Phone aria-hidden className="h-5 w-5 sm:h-4 sm:w-4 sm:text-brand-teal" />
                  <span className="text-[13px] font-extrabold uppercase tracking-[0.16em] sm:text-[11px] sm:tracking-[0.2em] sm:text-brand-teal">
                    {CTA.contact.label}
                  </span>
                </span>
                {/* select-text re-enables selection on desktop, where the
                    anchor itself is pointer-events-none so the dead tel: link
                    cannot be clicked. */}
                <span
                  dir="ltr"
                  className="whitespace-nowrap text-[22px] font-extrabold leading-tight tabular-nums sm:select-text sm:text-[26px] sm:tracking-[-0.01em] sm:text-white"
                >
                  {CTA.contact.phone}
                </span>
              </a>
            </div>
          </div>
        </section>
      </Reveal>

      <footer className="mt-10 flex flex-col items-center gap-3 text-center">
        <BrandLogo />
        <p className="text-[13px] text-slate-500">
          {BRAND_NAME} — {HERO.eyebrow}
        </p>
      </footer>
    </main>
  );
}
