"use client";

/**
 * A receiver-in-canal hearing aid, tinted with the device's finish.
 *
 * The demo ships no product photography: the three devices are real, named,
 * trademarked products, so manufacturer or retailer photos of them would be
 * third-party copyrighted assets inside a commercial demo. Every picture of a
 * device is therefore this one drawing, recoloured per `deviceDetail.finish`
 * (corrections review 2026-08-31: the compare screen shows a picture of each
 * device).
 *
 * It is drawn as a real RIC rather than a capsule-and-wire sketch: a shaded
 * behind-the-ear shell, a translucent receiver tube, and a soft silicone dome.
 * `finish` drives a per-instance gradient, so the three devices read as three
 * finishes of one product family instead of three flat colour swatches.
 */
export function DeviceThumb({ finish, className }: { finish: string; className?: string }) {
  // Gradient/clip ids must be unique per finish: three of these render side by
  // side on the compare table, and duplicate ids would make all three adopt
  // whichever definition the browser resolved last.
  const uid = `dt${finish.replace("#", "")}`;

  return (
    <svg viewBox="0 0 64 64" className={className} role="img"
      aria-label="Hearing aid, shown to scale">
      <defs>
        {/* Shell: lit from the upper left, so the form turns rather than flattens. */}
        <linearGradient id={`${uid}s`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".55" />
          <stop offset=".38" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".22" />
        </linearGradient>
        {/* Dome: silicone reads translucent, never solid white. */}
        <linearGradient id={`${uid}d`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".95" />
          <stop offset="1" stopColor="#fff" stopOpacity=".62" />
        </linearGradient>
      </defs>

      {/* Contact shadow — grounds the device so it sits on the tile. */}
      <ellipse cx="34" cy="57" rx="15" ry="2.4" fill="#0B2340" opacity=".08" />

      {/* Receiver tube: clear filament arcing from the shell's top over the ear
          and down into the canal. Drawn under the shell so the join is hidden. */}
      <path d="M25.5 15 C33 5,47 9,48.5 20 C50 30,47.5 38,43 45"
        fill="none" stroke="#0B2340" strokeOpacity=".2" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M25.5 15 C33 5,47 9,48.5 20 C50 30,47.5 38,43 45"
        fill="none" stroke="#fff" strokeOpacity=".65" strokeWidth="1.2" strokeLinecap="round" />

      {/* Behind-the-ear shell: a tapered banana, wide at the top, narrowing to
          the tube outlet — the actual RIC silhouette. */}
      <g transform="rotate(14 24 30)">
        <path d="M24 12 C31 12,33 18,32.5 26 L31.5 40 C31 47,27.5 50,23.5 50
                 C19.5 50,16.5 47,16.5 40 L17 26 C17 18,18 12,24 12 Z"
          fill={finish} />
        <path d="M24 12 C31 12,33 18,32.5 26 L31.5 40 C31 47,27.5 50,23.5 50
                 C19.5 50,16.5 47,16.5 40 L17 26 C17 18,18 12,24 12 Z"
          fill={`url(#${uid}s)`} />
        {/* Specular streak: moulded plastic, not a blob. */}
        <rect x="20" y="17" width="2.6" height="18" rx="1.3" fill="#fff" opacity=".42" />
        {/* Rocker control + programme LED, the two details that read at 48px. */}
        <rect x="21" y="40.5" width="6" height="2.4" rx="1.2" fill="#0B2340" opacity=".28" />
        <circle cx="24" cy="15.5" r="1.5" fill="#0B2340" opacity=".22" />
      </g>

      {/* Silicone dome at the canal tip. */}
      <path d="M43 45 C47.5 45,50 48,50 51 C50 54,47 55.5,43 55.5
               C39 55.5,36 54,36 51 C36 48,38.5 45,43 45 Z"
        fill={`url(#${uid}d)`} stroke={finish} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M40 49.5 C41 48,45 48,46 49.5" fill="none"
        stroke={finish} strokeOpacity=".5" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}
