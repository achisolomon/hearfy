"use client";
import { PatientApp2 } from "../patient-app-2";
import { ROLE_LABELS, STAGES } from "@/lib/story";
import { useStory } from "./story-context";

/**
 * Placeholder for screens later plans have not built yet. It names the
 * screen id so the remaining work is visible while the shell is driveable.
 */
function Stub({ screen }: { screen: string }) {
  const { role, stage } = useStory();
  const stageName = STAGES.find(s => s.n === stage)?.name ?? "";
  return (
    <div className="grid min-h-[100dvh] place-items-center bg-brand-bg px-6 text-center">
      <div className="max-w-sm">
        <p className="text-[11px] font-extrabold uppercase tracking-[.25em] text-brand-teal">
          {ROLE_LABELS[role]}
        </p>
        <h2 className="mt-3 text-2xl font-extrabold text-brand-navy">Stage {stage} — {stageName}</h2>
        <p className="mt-4 text-sm text-slate-500">
          Screen <code className="rounded bg-white px-1.5 py-0.5 font-bold text-brand-navy">{screen}</code> is
          not built yet.
        </p>
      </div>
    </div>
  );
}

export function RoleView() {
  const { role, screen } = useStory();
  if (role === "patient") return <PatientApp2 />;
  return <Stub screen={String(screen)} />;
}
