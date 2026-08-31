"use client";
import { useEffect, useState } from "react";
import { PrimaryButton, SecondaryButton } from "../../ui";

/**
 * The two-stage gate on an irreversible clinical commitment (critique
 * 2026-08-31, P0).
 *
 * Signing the report and locking the prescription both say in their own copy
 * that they cannot be undone — signing releases results to the patient AND
 * makes the record immutable, in one action. Shipped, both fired on a single
 * tap, which is the same weight the demo gives "Continue monitoring".
 * `lib/latch.ts` already engineers irreversibility carefully at the state
 * layer; this is the missing half at the trigger.
 *
 * Deliberately not a modal: DESIGN.md's product register treats a modal as the
 * lazy first answer, and the confirmation belongs where the action is, not
 * stacked over it. The button becomes its own confirmation — one tap arms it,
 * the second commits, and Escape (or "Keep editing") disarms.
 *
 * The armed state is local and intentionally NOT a latch: it must reset when
 * the viewer walks away from the beat, unlike the commitment itself.
 */
export function ConfirmButton({
  label, confirmLabel, note, onConfirm,
}: {
  /** Resting label, e.g. "Sign & release results". */
  label: string;
  /** Armed label. Names the consequence, so the second tap is informed. */
  confirmLabel: string;
  /** What the commitment does, shown only while armed. */
  note: string;
  onConfirm: () => void;
}) {
  const [armed, setArmed] = useState(false);

  // Escape is the expected way out of a committed-to state; without it the
  // only exit from the armed button is clicking the other control.
  useEffect(() => {
    if (!armed) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setArmed(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [armed]);

  if (!armed) return <PrimaryButton onClick={() => setArmed(true)}>{label}</PrimaryButton>;

  return (
    <div className="space-y-2">
      <p role="status" className="rounded-2xl bg-[#fff6e8] px-4 py-3 text-xs leading-5 text-[#9d6514]">
        {note}
      </p>
      <PrimaryButton onClick={onConfirm}>{confirmLabel}</PrimaryButton>
      <SecondaryButton onClick={() => setArmed(false)}>Not yet</SecondaryButton>
    </div>
  );
}
