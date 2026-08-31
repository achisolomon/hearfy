"use client";
import { ROLES } from "@/lib/story";
import { personaFor } from "@/lib/personas";
import { cn } from "@/lib/cn";
import { PersonaAvatar } from "../persona-avatar";
import { useStory } from "./story-context";

/**
 * Short labels for the narrow desktop bar; the sheet uses names.
 *
 * Also reused by the phone docked bar (demo-shell.tsx) for its role line —
 * the full `personaFor(role).title` ("Certified Medical Assistant", "Cloud
 * Audiologist, Au.D.") does not fit the phone bar's measured width budget at
 * any text size, but this short set does.
 */
export const SHORT: Record<string, string> = {
  patient: "Patient",
  cma: "CMA",
  audiologist: "Audiologist",
  operator: "Operator",
};

/**
 * The role switcher. Every tab carries its persona's avatar, so the viewer can
 * always see WHOSE view they are in — the "who is acting" cue.
 */
export function RoleTabs({ full = false }: { full?: boolean }) {
  const { role, setRole } = useStory();
  return (
    <div className={cn("flex gap-1", full && "flex-col gap-2")} role="tablist" aria-label="Demo role">
      {ROLES.map(r => {
        const p = personaFor(r);
        const active = role === r;
        return (
          <button
            key={r}
            role="tab"
            aria-selected={active}
            onClick={() => setRole(r)}
            className={cn(
              "flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-xs font-bold transition",
              full && "w-full gap-3 py-2 pl-2 pr-4 text-left text-sm",
              active ? "bg-brand-navy text-white" : "bg-white text-slate-500 hover:text-brand-navy"
            )}
          >
            <PersonaAvatar role={r} size={full ? "md" : "sm"} ring={active} />
            {full
              ? <span className="min-w-0"><b className="block truncate">{p.name}</b>
                  <span className={cn("block truncate text-xs font-normal", active ? "text-white/60" : "text-slate-400")}>{p.title}</span></span>
              : SHORT[r]}
          </button>
        );
      })}
    </div>
  );
}
