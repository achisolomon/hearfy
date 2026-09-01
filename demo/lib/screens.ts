import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Reads what the screens actually do, from their source.
 *
 * The demo's navigation lives inside JSX — `onClick={()=>go("consent")}` — so
 * there is nothing a unit test can import and assert against. Rather than
 * restructure every screen, these helpers read the files, which is enough to
 * hold the reachability and wiring invariants that real bugs have broken:
 * screens the pointer could not address, forward moves that never handed the
 * story over, and a control the shell never wired up.
 */

const ROOT = join(__dirname, "..");

export function sourceOf(...parts: string[]): string {
  return readFileSync(join(ROOT, ...parts), "utf8");
}

/** Every .tsx under components/, recursively. */
export function componentFiles(dir = "components"): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(join(ROOT, dir), { withFileTypes: true })) {
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) out.push(...componentFiles(rel));
    else if (entry.name.endsWith(".tsx")) out.push(rel);
  }
  return out;
}

/** The screen ids a patient screen's buttons navigate to, in source order. */
export function goTargets(source: string): string[] {
  return [...source.matchAll(/go\("([a-z-]+)"\)/g)].map(m => m[1]);
}

/**
 * Each patient screen component paired with the targets it navigates to.
 * Keyed by component name, e.g. `HomeScreen` -> ["assigned","intake-for","book-date"].
 */
export function patientNavigation(): Record<string, string[]> {
  const files = componentFiles("components/screens/patient");
  const out: Record<string, string[]> = {};
  for (const f of files) {
    const src = sourceOf(f);
    // Split on each exported component so targets are attributed correctly.
    const parts = src.split(/(?=export function )/);
    for (const part of parts) {
      const name = /export function (\w+)/.exec(part)?.[1];
      if (!name) continue;
      const targets = goTargets(part);
      if (targets.length) out[name] = targets;
    }
  }
  return out;
}

/**
 * The patient screen order, read from the registry.
 *
 * `registry.tsx` is a client module, so a node test cannot import it. Parsing
 * keeps one source of truth rather than a second list here that could drift
 * from the one the app actually uses.
 */
export function screenOrder(): string[] {
  const src = sourceOf("components/screens/registry.tsx");
  const list = /export const order\s*:\s*ScreenId\[\]\s*=\s*\[([^\]]+)\]/.exec(src);
  if (!list) throw new Error("could not read `order` from screens/registry.tsx");
  return [...list[1].matchAll(/"([a-z-]+)"/g)].map(m => m[1]);
}

/**
 * Strips block comments (including JSDoc) and line comments from source, so
 * prose mentioning code (e.g. a doc comment that explains what `next()` would
 * do) can never be mistaken for a real call. A guard a comment can silence is
 * not a guard: a later edit that merely rewords a comment must not turn a red
 * test green, and a comment that documents `next()` must not trip it either.
 */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

/**
 * Components outside the shell that pull `next` out of the story context.
 *
 * A screen prop happening to be NAMED `next` is not the danger — the shell
 * hands every in-screen control `advanceInRole` through that same prop name,
 * and that is correct: `CmaOtoscopy({ next })` calling `next()` just calls
 * whatever forward function its caller gave it. The actual danger is a
 * component reaching into `useStory()`/`useStoryOptional()` and destructuring
 * the context's own `next`, which is the one function that reassigns `role` —
 * so a screen that got hold of it, not the shell, could switch persona out
 * from under itself no matter what its own props are called. `components/shell/`
 * is the one legitimate place to hold that: it is the chrome, not a persona's
 * device, so its own top nav is allowed to switch persona at a handoff.
 *
 * Returns `file -> [offending destructure lines]` for every offender found.
 */
export function screensReachingContextNext(): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  const DESTRUCTURE = /const\s*\{([^}]*)\}\s*=\s*useStory(?:Optional)?\(\)/g;
  for (const f of componentFiles("components")) {
    if (f.startsWith("components/shell/")) continue;
    const src = stripComments(sourceOf(f));
    const hits: string[] = [];
    for (const m of src.matchAll(DESTRUCTURE)) {
      const names = m[1].split(",").map(s => s.trim());
      if (names.some(n => /^next$/.test(n.split(":")[0].trim()))) hits.push(m[0]);
    }
    if (hits.length) out[f] = hits;
  }
  return out;
}
