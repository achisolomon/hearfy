"use client";
import { cn } from "@/lib/cn";
import { TextSize } from "../a11y/text-size";

/**
 * THE video geometry (refined 2026-08-31): on every screen that carries the
 * live call — CMA and audiologist alike — the video is the same size in the
 * same place: a 380px left column, stuck to the top, with the work beside
 * it. Both sides render their feed through this one component so the sizes
 * can never drift apart; nothing else may define the call's column.
 *
 * Below `md` the columns stack, video first. A screen that shows a compact
 * call strip on phones instead (the CMA's) passes `hideVideoBelowMd`.
 */
export function VideoSplit({ video, hideVideoBelowMd = false, children }: {
  video: React.ReactNode; hideVideoBelowMd?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="md:grid md:grid-cols-[minmax(0,380px)_minmax(0,1fr)] md:items-start md:gap-6">
      <div className={cn("mb-4 md:sticky md:top-6 md:mb-0", hideVideoBelowMd && "hidden md:block")}>
        {video}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/**
 * THE page container for a call screen (owner, 2026-09-01: "all the videos in
 * all the slides in exactly the same place and exactly the same size so that
 * they will not jump between one beat to another").
 *
 * `VideoSplit` already guaranteed the tile's SIZE — 380px wide, 4:3 — and it
 * held. What it could not guarantee was its PLACE, because a column that is
 * always 380px still starts wherever its page container starts, and the two
 * roles were measured walking the demo at 1440px landing in three places:
 *
 *   CMA exam screens      x=96   (Shell tablet, xl:max-w-6xl + px-5 → 1296px)
 *   audiologist screens   x=145  (hand-rolled max-w-5xl + p-6      → 1152px)
 *   the device shortlist  x=217  (hand-rolled max-w-4xl + p-6      → 1008px)
 *
 * So the call slid 49px right at the first audiologist beat, another 72px at
 * the shortlist, and back again — a visible jump on a screen whose whole job
 * is to look like ONE synchronized system. The size never drifted; the frame
 * around it did.
 *
 * The container therefore belongs in the same file as the column, under the
 * same rule: one definition, no screen rolling its own. `Shell tablet`'s
 * ramp is the one both roles now use, because the CMA's exam screens are the
 * longest run of call beats and moving them would move the most video.
 *
 * `pt` matches Shell's `pt-6` and the `TextSize` control row rides along, so
 * the header below starts at the same y on both roles — vertical drift is the
 * same defect on the other axis.
 *
 * Which is why the header goes in a SLOT rather than in `children`. Fixing the
 * container put every call at the same x, and the header's own top measured
 * identical (105px) on every beat — but the video still landed at three
 * different heights, because what pushes it down is the header's HEIGHT, and
 * three shapes of header were in use:
 *
 *   PageHeader with a subtitle (the CMA's exam steps)   131px → video y=264
 *   PageHeader + a status pill in a `mb-5` flex wrapper  91px → video y=246
 *   bare PageHeader (the audiologist's sign-off screens) 91px → video y=223
 *
 * A subtitle is one line of real information and a REC pill is a real state;
 * neither should be deleted to make the geometry line up, and neither should
 * be forced onto a screen that has nothing to say in it. So the block is given
 * a floor instead: `CALL_HEADER_MIN` is the tallest of the three, every call
 * screen reserves it, and a shorter header simply leaves the remainder empty.
 * The video then starts at the same y whether or not the beat has a subtitle.
 */

/**
 * The reserved height of a call screen's header block, in px: the tallest
 * header the demo actually uses (eyebrow + 30px title + subtitle line) plus
 * PageHeader's own 24px bottom margin. Every call beat holds this much space
 * for its header, so the video below it cannot move between beats.
 *
 * A number, not a Tailwind class, because the guard test reads it: the value
 * is the invariant, and a screen that hard-codes its own height instead is
 * exactly the drift this exists to stop.
 */
export const CALL_HEADER_MIN = 155;

/**
 * The same floor at phone width, where the columns stack and the titles wrap
 * to more lines in a narrower measure. Measured, not guessed: at 390px the
 * natural header heights across the thirteen call beats run 91 / 123 / 131 /
 * 158px ("Tympanometry" and "Try-on" carry the longest subtitles and wrap to
 * three lines), and PageHeader adds its own 24px bottom margin on top of
 * that, and the last 3px are the header's own margin collapsing against the
 * box — so the tallest beat CONSUMES 185px, and that is the floor. Setting it
 * to the 158px content height instead left those two beats 27px low, which is
 * the whole bug in miniature. Below this floor the call moved 68px between
 * beats; at it, all thirteen measure y=227.
 *
 * It stays under the desktop figure because a phone header sits directly
 * under the TextSize row with no page gutter beside it, and it leaves the
 * whole 4:3 tile (257px at this width) above the fold on an 844px screen.
 */
export const CALL_HEADER_MIN_SM = 185;

export function CallShell({ header, children, className }: {
  /** The screen's PageHeader (plus any status pill beside it). Reserved a
      fixed height so the video below starts at the same y on every beat. */
  header?: React.ReactNode;
  children: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn("min-h-[100dvh] bg-brand-bg text-brand-navy", className)}>
      <div className="mx-auto max-w-md px-5 pb-40 pt-6 md:max-w-3xl md:pb-24 lg:max-w-4xl xl:max-w-6xl">
        <div className="mb-3 flex justify-end"><TextSize /></div>
        {/* Reserved on the phone too, at its own smaller floor. The stacked
            layout jumped just as badly — the call measured y=159 to y=227
            across beats at 390px, because these titles wrap to one, two or
            three lines. `CALL_HEADER_MIN_SM` is the tallest of those, which
            still leaves the whole 4:3 tile above the fold on an 844px screen,
            so nothing is pushed off to buy the stillness.

            Both floors are the height the tallest header CONSUMES, not the
            height it measures: PageHeader ends in its own `mb-6`, and that
            margin lands below the reserved box rather than inside it. Setting
            the phone floor to the 158px content height left those two beats
            27px low — the reservation honoured, then overshot by the very
            margin it was meant to cover. Measure the gap to the video, not
            the header's own box, when either of these is retuned. */}
        {header !== undefined && (
          <div className="min-h-[var(--call-header-sm)] md:min-h-[var(--call-header)]"
               style={{
                 // `em`, so the floor tracks the text it is reserving space
                 // for. A fixed px floor is right at the default rem base and
                 // wrong at every other: at the phone's largest accessibility
                 // font the headers outgrow it (the reservation stops working,
                 // and the beats drift again), while the wasted space below a
                 // SHORT header stays frozen at its 16px size and pushes the
                 // last device card's button under the docked control bar —
                 // caught by `mobile-sweep` at 320px/32px, which is exactly
                 // the extreme a px constant cannot serve.
                 //
                 // Dividing by 16 converts the measured px to the em the
                 // header's own type scale moves with, so one number stays
                 // correct across every text-size setting.
                 "--call-header-sm": `${CALL_HEADER_MIN_SM / 16}em`,
                 "--call-header": `${CALL_HEADER_MIN / 16}em`,
               } as React.CSSProperties}>
            {header}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
