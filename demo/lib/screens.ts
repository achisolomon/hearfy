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
 * Components that call the shell's `next()` from inside a screen.
 *
 * `next()` adopts the landing beat's lead role, so calling it from a control
 * drawn inside a persona's own device switches the viewer to someone else
 * mid-tap. In-screen controls must call `advanceInRole` instead.
 *
 * Returns `file -> [component names]` for every offender found.
 */
export function screensCallingNext(): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const f of componentFiles("components/screens")) {
    const src = stripComments(sourceOf(f));
    const hits: string[] = [];
    for (const part of src.split(/(?=export function )/)) {
      const name = /export function (\w+)/.exec(part)?.[1];
      if (!name) continue;
      // `next` as a bare call or handler reference: onClick={next},
      // onClick={() => next()}, onFoo={() => { ...; next(); }}
      if (/\bnext\(\)/.test(part) || /=\{\s*next\s*\}/.test(part)) hits.push(name);
    }
    if (hits.length) out[f] = hits;
  }
  return out;
}
