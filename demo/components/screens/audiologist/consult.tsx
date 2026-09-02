"use client";
import { useState } from "react";
import { Ban, Lock, Video } from "lucide-react";
import { Card, PageHeader, PrimaryButton, StatusPill } from "../../ui";
import { cn } from "@/lib/cn";
import { createLatch } from "@/lib/latch";
import { devices, deviceDetail, tiers, clinician, patient } from "@/lib/mock-data";
import { HomeFeed } from "./home-feed";
import { VideoSplit, CallShell } from "../video-split";
import { ConfirmButton } from "./confirm-button";

/**
 * Locking the prescription is a separate, irreversible commitment from signing
 * the report — a different latch, on purpose.
 */
const lockedLatch = createLatch();

export function AudConsult({ next }: { next: () => void }) {
  // The audiologist recommends 2–3 and excludes at least one with a rationale.
  const [recommended, setRecommended] = useState<string[]>([devices[0].name, devices[1].name]);
  // The exclusion rationale below describes the Oticon Intent 2 specifically
  // (open fitting vs. the left air–bone gap), so this index and that device
  // must stay married. corrections.test.ts pins the pairing: reorder
  // mock-data's `devices` and the build fails rather than the screen quietly
  // stating something false about a real product.
  const excluded = devices[2].name;

  return (
    <CallShell header={
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <PageHeader eyebrow="Recorded consult" title={`Device shortlist for ${patient.name}`} />
        </div>
        {/* #b91c1c on #fef2f2 is 6.05:1; the shipped red-600 measured 4.41:1
           at this 12px size, just under the floor PRODUCT.md sets. */}
        <span className="mt-1 flex shrink-0 items-center gap-2 rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-[#b91c1c]">
          <span className="h-2 w-2 rounded-full bg-red-500" aria-hidden />
          <span aria-hidden>REC</span>
          <span className="sr-only">This consult is being recorded</span>
        </span>
      </div>
    }>

        {/* She presents the shortlist INTO the room — the call carries the
           consult until the patient is fitted, in the same place and size as
           on every other screen (refined 2026-08-31). */}
        {/* He is trying each one on and telling her how it sounds, so the feed
           is him listening to her and the captions are his feedback — not a
           tone report from the hearing test (owner, 2026-09-01).

           The tile is the ONLY thing in this column, as on every other screen
           of every role. The recording note used to be stacked under it here,
           which made this the one screen whose video column was a different
           height (589px against 492px everywhere else) — so stepping onto and
           off this beat moved the column and everything anchored to it. The
           note is about the consult, not about the video, so it now sits with
           the other consult note in the content pane below. */}
        <VideoSplit video={<HomeFeed beat="fitting" />}>
        <div className="space-y-3">
          {devices.map(d => {
            const isRec = recommended.includes(d.name);
            const isEx = d.name === excluded;
            return (
              <Card key={d.name} className={cn("p-4", isRec && "border-brand-teal", isEx && "opacity-70")}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                      <b className="text-[15px]">{d.name}</b>
                      <span className="text-xs font-bold text-slate-400">{d.price}</span>
                    </div>
                    {/* The fit factors the patient will later see on her own
                       results screen (persona spec §2) — she authors the
                       reasoning, so it has to be the reasoning, not a spec
                       sheet. Generic `features` are marketing copy; these are
                       clinical. */}
                    <ul className="mt-2 space-y-1">
                      {deviceDetail[d.name].fitFactors.map(f => (
                        <li key={f} className="flex gap-2 text-xs leading-5 text-slate-500">
                          <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-brand-teal" aria-hidden />
                          {f}
                        </li>
                      ))}
                    </ul>
                    {isEx && (
                      <p className="mt-2 flex items-start gap-1.5 text-xs leading-5 text-[#9d6514]">
                        <Ban size={13} className="mt-0.5 shrink-0" aria-hidden />
                        Excluded: open fitting is unsuitable with the air–bone gap on the left.
                      </p>
                    )}
                  </div>
                  {!isEx && (
                    <button
                      aria-pressed={isRec}
                      onClick={() => setRecommended(r => isRec ? r.filter(n => n !== d.name) : [...r, d.name])}
                      /* White on Vital Teal measured 2.87:1 — the same fault
                         ui.tsx already fixed for PrimaryButton by moving to
                         Teal Ink, where white reads 4.97:1. */
                      className={cn("min-h-11 shrink-0 rounded-full px-4 text-xs font-bold",
                        isRec ? "bg-teal-ink text-white" : "bg-[#f1f5f6] text-slate-500")}>
                      {isRec ? "Recommended" : "Recommend"}
                    </button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        <Card className="mt-4 flex items-center gap-3 p-4">
          <Video size={18} className="shrink-0 text-teal-ink" aria-hidden />
          <p className="text-sm text-slate-500">
            Recording is visible to the patient throughout, per their consent.
          </p>
        </Card>

        <Card className="mt-4 p-4">
          <p className="text-xs leading-5 text-slate-400">
            The shortlist is clinical. Which device, and which tier
            ({tiers.map(t => `${t.name} $${t.monthly}`).join(" · ")}), stay the
            patient&rsquo;s decision.
          </p>
        </Card>

        {/* A prescription locks a shortlist, so there has to be one. */}
        <div className="mt-5 max-w-sm">
          <PrimaryButton disabled={recommended.length === 0} onClick={next}>
            Continue to prescription
          </PrimaryButton>
          {recommended.length === 0 && (
            <p className="mt-2 text-xs text-[#9d6514]">Recommend at least one device to continue.</p>
          )}
        </div>
        </VideoSplit>
    </CallShell>
  );
}

export function AudPrescription() {
  const locked = lockedLatch.use();
  return (
    // Same page header as every other audiologist screen (consistency,
    // Achi 2026-08-31) — the card below carries the state, not the title.
    <CallShell header={<PageHeader eyebrow="Prescription" title={`${patient.name} — sign & lock`} />}>
      {/* Signing: she walks him through it and he is agreeing, so he listens
         rather than reporting a tone. */}
      <VideoSplit video={<HomeFeed beat="listening" />}>
      <Card className="w-full max-w-lg p-7">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#edf8f7] text-teal-ink">
          <Lock size={21} aria-hidden />
        </span>
        <h2 className="mt-4 text-2xl font-extrabold tracking-[-.02em]">
          {locked ? "Prescription locked" : "Ready to lock"}
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          {locked
            ? "The digital prescription is locked and on the patient record. The CMA can now fulfil the shortlist."
            : "Locking finalises the shortlist and the fitting parameters. This is a second, separate commitment from the results signature."}
        </p>
        <div className="mt-5 rounded-2xl bg-[#f6fafa] p-4">
          <b className="text-sm">{clinician.name}, {clinician.credential}</b>
          <p className="mt-1 text-xs text-slate-500">Licensed in {clinician.licenseState}</p>
        </div>
        {locked && <div className="mt-4"><StatusPill tone="green">Locked &amp; immutable</StatusPill></div>}
        {!locked && (
          <div className="mt-6">
            <ConfirmButton
              label="Sign & lock"
              confirmLabel="Confirm — sign and lock"
              note="The shortlist and fitting parameters are frozen once you confirm."
              onConfirm={lockedLatch.set}
            />
          </div>
        )}
      </Card>
      </VideoSplit>
    </CallShell>
  );
}
