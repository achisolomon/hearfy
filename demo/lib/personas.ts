/**
 * Who each role is, as a person (spec §9: illustrated, never photographic).
 *
 * The avatar is drawn from these values — no image files, no fetching, so the
 * static export stays self-contained.
 */
import type { Role } from "./story";

export interface Persona {
  role: Role;
  /** The person's name, as shown to other roles. */
  name: string;
  /** What they are, in one short phrase. */
  title: string;
  /** Initials drawn on the avatar. */
  initials: string;
  /** Avatar background; foreground is always white. */
  color: string;
  /** Second colour for the avatar's gradient. */
  colorAlt: string;
}

export const PERSONAS: Record<Role, Persona> = {
  patient: {
    role: "patient", name: "Alex Rivera", title: "Patient",
    initials: "AR", color: "#12AAA5", colorAlt: "#0d8a86",
  },
  cma: {
    role: "cma", name: "Maya Lewis", title: "Certified Medical Assistant",
    initials: "ML", color: "#2788c8", colorAlt: "#1d6b9e",
  },
  audiologist: {
    role: "audiologist", name: "Dr. Susan Reed", title: "Cloud Audiologist, Au.D.",
    initials: "SR", color: "#0B2340", colorAlt: "#183b5e",
  },
  operator: {
    role: "operator", name: "Jordan Pike", title: "Operations",
    initials: "JP", color: "#9d6514", colorAlt: "#7a4e10",
  },
};

export function personaFor(role: Role): Persona {
  return PERSONAS[role];
}
