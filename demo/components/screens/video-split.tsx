"use client";
import { cn } from "@/lib/cn";

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
