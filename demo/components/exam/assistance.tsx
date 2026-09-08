"use client";
import { Hand } from "lucide-react";
import { cn } from "@/lib/cn";
import { examiner } from "@/lib/mock-data";

/**
 * What the examiner asks the CMA to physically do (Exam Engine spec §8.2).
 *
 * The spec draws a hard line through this card: it carries "visual steps and
 * confirmation — not full clinical interpretation". So it states an ACTION
 * and nothing else. It never says what a finding means, never names a
 * pathway, and never gives Maya a reading to act on — that is the
 * audiologist's, and §3 lists interpreting results among the things the CMA
 * must not do.
 *
 * It is attributed, because an unattributed instruction on a shared screen
 * is one nobody owns: Maya can see the request came from the examiner, which
 * is also what makes "the examiner asked me to" a legible thing for her to
 * say out loud to the patient.
 */
export function AssistanceRequest({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-[#cfe3f5] bg-[#edf4fb] p-4", className)}>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-[#235f98]">
          <Hand size={16} />
        </span>
        <div className="min-w-0">
          <b className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#235f98]">
            {examiner.name} asks
          </b>
          <p className="mt-1 text-sm font-semibold leading-6 text-brand-navy">{children}</p>
        </div>
      </div>
    </div>
  );
}
