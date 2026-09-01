"use client";
import { Card } from "../ui";
import { cn } from "@/lib/cn";
import { devices, deviceDetail, compareCategories, compareRecommendation } from "@/lib/mock-data";
import { tierFor } from "@/lib/commerce";
import { DeviceThumb } from "../device-thumb";
import { useSelectedDevice } from "@/lib/selection";

/**
 * The three service packages, side by side — ONE component, so the patient's
 * phone and the CMA's tablet can never show different comparisons of the same
 * three devices (2026-08-31).
 *
 * The layout is chosen by ROLE, not by viewport width (2026-08-31). The
 * patient is on a phone and the CMA on a tablet — those are facts about the
 * product, not about the browser window. Gating on `lg` meant a wide window
 * rendered the six-across table inside the patient's `max-w-md` column, which
 * clipped the third device off the screen.
 *
 * - `layout="cards"` — the patient: one package at a time, six rows each.
 * - `layout="table"` — the CMA: the wide side-by-side comparison.
 *
 * `selectable` is the other difference. The patient chooses, so their copy
 * carries live Select controls; the CMA's is a read-only mirror, because the
 * CMA neither recommends nor decides.
 */
export function CompareTable({ layout = "cards", selectable = true, onSelect }: {
  layout?: "cards" | "table"; selectable?: boolean; onSelect?: (name: string) => void;
}) {
  const shortlist = devices.slice(0, 3);
  const selected = useSelectedDevice();

  return (
    <>
      {/* The CMA's tablet: the side-by-side comparison.

          The wide table is for the width that can hold it — the CMA's tablet
          and up. Below `md` it would need either a crushed rightmost column
          or a horizontal scrollbar, and the owner already ruled on that one:
          "It looks bad. Lose this. Lose the scroll." So the phone gets the
          `cards` layout below instead, which stacks the same three devices
          one per row and needs no width it does not have. Both are rendered
          and the breakpoint picks; nothing is lost at either size. */}
      {layout === "table" && <div className="hidden md:block">
        <Card className="overflow-hidden p-0">
          <div className="grid grid-cols-[9rem_repeat(3,1fr)]">
            <div />
            {shortlist.map(d => {
              const isSel = d.name === selected.name;
              const detail = deviceDetail[d.name];
              return (
                <div key={d.name} className={cn("border-l border-[#eef4f5] p-4 text-left transition",
                  isSel ? "bg-brand-teal/10" : "")}>
                  <div className="mb-3 grid h-20 place-items-center rounded-xl bg-gradient-to-br from-[#eef6f6] to-white">
                    <DeviceThumb finish={detail.finish} className="h-16 w-16" />
                  </div>
                  <b className="block text-[15px] leading-tight">{d.name}</b>
                  <span className="mt-1 block text-[12px] text-slate-500">
                    ${tierFor(detail.tier).monthly}/mo · {tierFor(detail.tier).name}
                  </span>
                  <span className={cn("mt-2 block text-[11px] font-semibold leading-4",
                    d.name === compareRecommendation.device ? "text-teal-ink" : "text-slate-500")}>
                    {compareRecommendation.reasons[d.name]}
                  </span>
                  {selectable ? (
                    <button type="button" aria-pressed={isSel} onClick={() => onSelect?.(d.name)}
                      className={cn("mt-3 flex min-h-11 w-full items-center justify-center rounded-full px-3 text-[11px] font-bold uppercase tracking-wider transition",
                        isSel ? "bg-teal-ink text-white" : "bg-[#f1f5f6] text-slate-500 hover:bg-[#e4eef0]")}>
                      {isSel ? "Selected" : "Select"}
                    </button>
                  ) : (
                    /* The CMA sees the patient's choice land; they cannot make it. */
                    <span className={cn("mt-3 flex min-h-11 w-full items-center justify-center rounded-full px-3 text-[11px] font-bold uppercase tracking-wider",
                      isSel ? "bg-brand-teal/15 text-teal-ink" : "bg-[#f6f8f9] text-slate-400")}>
                      {isSel ? "Patient’s choice" : "—"}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          {compareCategories.map(cat => (
            <div key={cat} className="grid grid-cols-[9rem_repeat(3,1fr)] border-t border-[#eef4f5]">
              <div className="p-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{cat}</span>
              </div>
              {shortlist.map(d => {
                const isSel = d.name === selected.name;
                const detail = deviceDetail[d.name];
                return (
                  <div key={d.name} className={cn("border-l border-[#eef4f5] p-4 transition", isSel ? "bg-brand-teal/5" : "")}>
                    <p className="text-[13px] leading-5 text-slate-600">{detail.compare[cat]}</p>
                  </div>
                );
              })}
            </div>
          ))}
        </Card>
      </div>}

      {/* The patient's phone: one card per package, the same six rows.
          Also what the CMA's `table` falls back to below `md`, where the
          four-column grid cannot fit — same content, stacked, no scrollbar.

          The role still chooses the layout; the breakpoint only supplies the
          narrow rendering of the CMA's own choice, the same way BottomNav's
          siblings do it. Both trees stay in the DOM, so nothing waits on JS. */}
      {(layout === "cards" || layout === "table") && <div className={cn("space-y-4", layout === "table" && "md:hidden")}>
        {shortlist.map(d => {
          const isSel = d.name === selected.name;
          const detail = deviceDetail[d.name];
          const head = (
            <>
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#eef6f6] to-white">
                <DeviceThumb finish={detail.finish} className="h-12 w-12" />
              </span>
              <span className="min-w-0 flex-1">
                <b className="block text-[15px] leading-tight">{d.name}</b>
                <span className="mt-1 block text-[12px] text-slate-500">
                  ${tierFor(detail.tier).monthly}/mo · {tierFor(detail.tier).name}
                </span>
                <span className={cn("mt-1 block text-[11px] font-semibold leading-4",
                  d.name === compareRecommendation.device ? "text-teal-ink" : "text-slate-500")}>
                  {compareRecommendation.reasons[d.name]}
                </span>
              </span>
              <span className={cn("shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider",
                selectable
                  ? (isSel ? "bg-teal-ink text-white" : "bg-[#f1f5f6] text-slate-500")
                  : (isSel ? "bg-brand-teal/15 text-teal-ink" : "bg-[#f6f8f9] text-slate-400"))}>
                {selectable ? (isSel ? "Selected" : "Select") : (isSel ? "Patient’s choice" : "—")}
              </span>
            </>
          );
          return (
            <Card key={d.name} className={cn("overflow-hidden p-0 transition",
              isSel ? "border-brand-teal ring-2 ring-brand-teal" : "border-[#e4eef0]")}>
              {selectable ? (
                <button type="button" aria-pressed={isSel} onClick={() => onSelect?.(d.name)}
                  className={cn("flex w-full items-center justify-between gap-3 p-4 text-left transition",
                    isSel ? "bg-brand-teal/10" : "hover:bg-[#f8fafb]")}>
                  {head}
                </button>
              ) : (
                <div className={cn("flex w-full items-center justify-between gap-3 p-4 text-left",
                  isSel ? "bg-brand-teal/10" : "")}>
                  {head}
                </div>
              )}
              <div className="space-y-3 border-t border-[#eef4f5] p-4">
                {compareCategories.map(cat => (
                  <div key={cat}>
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">{cat}</span>
                    <p className="mt-0.5 text-[13px] leading-5 text-slate-600">{detail.compare[cat]}</p>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>}
    </>
  );
}
