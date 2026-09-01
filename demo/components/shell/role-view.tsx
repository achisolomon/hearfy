"use client";
import { PatientApp2 } from "../patient-app-2";
import { ROLE_LABELS, STAGES } from "@/lib/story";
import { useStory } from "./story-context";
import { CmaDay, CmaEnroute } from "../screens/cma/day";
import { CmaArrival, CmaConsent } from "../screens/cma/arrival";
import { CmaCalibration } from "../screens/cma/setup";
import { CmaOtoscopy, CmaTympanometry, CmaPureTone, CmaSpeech, CmaBone } from "../screens/cma/exam";
import { CmaHandoff } from "../screens/cma/handoff";
import { AudPanel, AudMonitor } from "../screens/audiologist/supervision";
import { AudReview, AudSign } from "../screens/audiologist/review";
import { AudConsult, AudPrescription } from "../screens/audiologist/consult";
import { CmaStock, CmaTryOn, CmaSigning, CmaActivate, CmaCloseout } from "../screens/cma/suitcase";
import { OperatorDashboard } from "../screens/operator/dashboard";

/** Placeholder for screens Plan D has not built yet. */
function Stub({ screen }: { screen: string }) {
  const { role, stage } = useStory();
  const stageName = STAGES.find(s => s.n === stage)?.name ?? "";
  return (
    <div className="grid min-h-[100dvh] place-items-center bg-brand-bg px-6 text-center">
      <div className="max-w-sm">
        <p className="text-[11px] font-extrabold uppercase tracking-[.25em] text-brand-teal">{ROLE_LABELS[role]}</p>
        <h2 className="mt-3 text-2xl font-extrabold text-brand-navy">Stage {stage} — {stageName}</h2>
        <p className="mt-4 text-sm text-slate-500">
          Screen <code className="rounded bg-white px-1.5 py-0.5 font-bold text-brand-navy">{screen}</code> is not built yet.
        </p>
      </div>
    </div>
  );
}

export function RoleView() {
  // `advanceInRole`, not `next`: everything below is a control drawn inside a
  // persona's own device, and those never switch persona. The chrome keeps
  // `next()` for the cross-persona story. See story-context.tsx.
  const { role, screen, advanceInRole } = useStory();
  const id = String(screen);

  if (role === "patient") return <PatientApp2 />;

  if (role === "cma") {
    switch (id) {
      case "cma-day": return <CmaDay next={advanceInRole} />;
      case "cma-enroute": return <CmaEnroute next={advanceInRole} />;
      case "cma-arrival": return <CmaArrival next={advanceInRole} />;
      case "cma-consent": return <CmaConsent next={advanceInRole} />;
      case "cma-calibration": return <CmaCalibration next={advanceInRole} />;
      case "cma-otoscopy": return <CmaOtoscopy next={advanceInRole} />;
      case "cma-tympanometry": return <CmaTympanometry next={advanceInRole} />;
      case "cma-puretone": return <CmaPureTone next={advanceInRole} />;
      case "cma-speech": return <CmaSpeech next={advanceInRole} />;
      case "cma-bone": return <CmaBone next={advanceInRole} />;
      case "cma-handoff": return <CmaHandoff />;
      case "cma-stock": return <CmaStock next={advanceInRole} />;
      case "cma-tryon": return <CmaTryOn next={advanceInRole} />;
      case "cma-signing": return <CmaSigning next={advanceInRole} />;
      case "cma-activate": return <CmaActivate next={advanceInRole} />;
      case "cma-closeout": return <CmaCloseout />;
      default: return <Stub screen={id} />;
    }
  }

  if (role === "audiologist") {
    switch (id) {
      case "aud-panel": return <AudPanel />;
      case "aud-monitor": return <AudMonitor next={advanceInRole} />;
      case "aud-review": return <AudReview next={advanceInRole} />;
      case "aud-sign": return <AudSign next={advanceInRole} />;
      case "aud-consult": return <AudConsult next={advanceInRole} />;
      case "aud-prescription": return <AudPrescription />;
      default: return <Stub screen={id} />;
    }
  }

  if (role === "operator") return <OperatorDashboard />;

  return <Stub screen={id} />;
}
