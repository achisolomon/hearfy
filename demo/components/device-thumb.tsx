"use client";

/**
 * A stylised behind-the-ear hearing aid, tinted with the device's finish —
 * the demo has no product photos, so every picture of a device is this one
 * drawing recoloured (corrections review 2026-08-31: the compare screen
 * shows a picture of each device).
 */
export function DeviceThumb({ finish, className }: { finish: string; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      {/* Body: the curved capsule that sits behind the ear. */}
      <g transform="rotate(16 27 27)">
        <rect x="20" y="10" width="13" height="32" rx="6.5" fill={finish} />
        {/* Specular streak so the shell reads as moulded plastic, not a blob. */}
        <rect x="23" y="14" width="3" height="17" rx="1.5" fill="#fff" opacity=".35" />
      </g>
      {/* Receiver wire over the top of the ear, down to the canal. */}
      <path d="M29 12 C34 3,45 6,46 15 C47 23,45 30,42 36" fill="none"
        stroke={finish} strokeWidth="2.5" strokeLinecap="round" />
      {/* Dome tip. */}
      <circle cx="41" cy="41" r="6" fill="#fff" stroke={finish} strokeWidth="2.5" />
    </svg>
  );
}
