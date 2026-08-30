"use client";
import { personaFor } from "@/lib/personas";
import type { Role } from "@/lib/story";
import { cn } from "@/lib/cn";

const SIZES = { sm: 28, md: 40, lg: 64 } as const;

/**
 * The one avatar component. Used in the role switcher, the handoff
 * interstitial, and anywhere one role appears inside another's screen.
 */
export function PersonaAvatar({
  role,
  size = "md",
  ring = false,
  className = "",
}: {
  role: Role;
  size?: keyof typeof SIZES;
  /** White ring — for avatars sitting on a coloured or busy background. */
  ring?: boolean;
  className?: string;
}) {
  const p = personaFor(role);
  const px = SIZES[size];
  const id = `pa-${role}-${size}`;

  return (
    <svg
      width={px} height={px} viewBox="0 0 64 64"
      className={cn("shrink-0", className)}
      role="img" aria-label={`${p.name}, ${p.title}`}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={p.color} />
          <stop offset="100%" stopColor={p.colorAlt} />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="32" fill={`url(#${id})`} />
      {ring && <circle cx="32" cy="32" r="30" fill="none" stroke="#fff" strokeWidth="3" />}
      <text
        x="32" y="32" textAnchor="middle" dominantBaseline="central"
        fill="#fff" fontSize="24" fontWeight="800" letterSpacing="0.5"
      >
        {p.initials}
      </text>
    </svg>
  );
}

/** Avatar plus name and title — for list rows and headers. */
export function PersonaChip({ role, size = "md" }: { role: Role; size?: keyof typeof SIZES }) {
  const p = personaFor(role);
  return (
    <div className="flex items-center gap-2.5">
      <PersonaAvatar role={role} size={size} />
      <div className="min-w-0">
        <b className="block truncate text-sm leading-tight">{p.name}</b>
        <span className="block truncate text-xs text-slate-500">{p.title}</span>
      </div>
    </div>
  );
}
