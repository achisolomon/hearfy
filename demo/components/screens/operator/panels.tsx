"use client";
import { Card } from "../../ui";
import { opPanels } from "@/lib/mock-data";

/** Deliberately compressed — present and credible, not expanded (spec §3). */
export function SecondaryPanels() {
  const cards: [string, [string, number][]][] = [
    ["Dispatch", [["Visits today", opPanels.dispatch.visitsToday], ["CMAs active", opPanels.dispatch.cmasActive], ["Unassigned", opPanels.dispatch.unassigned]]],
    ["Kit leasing", [["In field", opPanels.kits.inField], ["Calibration due", opPanels.kits.calibrationDue], ["Expired", opPanels.kits.expired]]],
    ["Orders", [["In flight", opPanels.orders.inFlight], ["Fitting due", opPanels.orders.fittingDue], ["Activated today", opPanels.orders.activatedToday]]],
    ["Supplier", [["Open", opPanels.supplier.open], ["Accepted", opPanels.supplier.accepted]]],
    ["Support", [["Open cases", opPanels.support.open], ["Breaching SLA", opPanels.support.breaching]]],
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map(([title, rows]) => (
        <Card key={title} className="p-4">
          <b className="text-xs uppercase tracking-wider text-slate-400">{title}</b>
          <div className="mt-3 space-y-1.5">
            {rows.map(([l, v]) => (
              <div key={l} className="flex justify-between text-xs">
                <span className="text-slate-500">{l}</span>
                <b>{v}</b>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
