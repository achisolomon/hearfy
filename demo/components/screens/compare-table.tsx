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
 * Two trees, toggled by width, both always in the DOM: stacked cards below
 * `lg`, the real table from `lg`. Device columns are `fr` units on purpose —
 * no px floor — so the table narrows with its container instead of scrolling.
 *
 * `selectable` is the difference between the two surfaces. The patient chooses,
 * so their copy carries live Select controls; the CMA's tablet is a read-only
 * mirror of the same table, because the CMA neither recommends nor decides.
 */
export function CompareTable({ selectable = true, onSelect }: {
  selectable?: boolean; onSelect?: (name: string) => void;
}) {
  const shortlist = devices.slice(0, 3);
  const selected = useSelectedDevice();

  return (
    <>
      {/* From lg: the side-by-side table. */}
      <div className="hidden lg:block">
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
      </div>

      {/* Below lg: one card per package, the same six rows. */}
      <div className="space-y-4 lg:hidden">
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
      </div>
    </>
  );
}
