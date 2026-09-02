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
 * Finds every way a piece of source could reach the story context's own
 * `next` — the one function that reassigns `role` (story-context.tsx).
 *
 * A screen prop happening to be NAMED `next` is not the danger — the shell
 * hands every in-screen control `advanceInRole` through that same prop name,
 * and that is correct: `CmaOtoscopy({ next })` calling `next()` just calls
 * whatever forward function its caller gave it. The actual danger is a
 * component reaching into `useStory()`/`useStoryOptional()` and getting hold
 * of the context's own `next`, however it does that — so a screen that got
 * hold of it, not the shell, could switch persona out from under itself no
 * matter what its own props are called.
 *
 * Three shapes all reach the same function and are all flagged:
 *
 *   const { next } = useStory();            // destructure
 *   const { next: goForward } = useStory();  // destructure, renamed
 *   const story = useStory();
 *   story.next();                            // whole-object capture, then property access
 *   useStory().next();                       // direct chain, no intermediate binding
 *
 * `components/shell/` is the one legitimate place to hold `next`: it is the
 * chrome, not a persona's device, so its own top nav is allowed to switch
 * persona at a handoff. Callers exclude that directory before invoking this.
 *
 * Returns `[offending line/snippet]` for every offence found in `src`. Takes
 * already-comment-stripped source, so a doc comment that merely explains
 * what `next()` does can never trip it.
 */
export function findContextNextOffences(src: string): string[] {
  const hits: string[] = [];

  const DESTRUCTURE = /const\s*\{([^}]*)\}\s*=\s*useStory(?:Optional)?\(\)/g;
  for (const m of src.matchAll(DESTRUCTURE)) {
    const names = m[1].split(",").map(s => s.trim());
    if (names.some(n => /^next$/.test(n.split(":")[0].trim()))) hits.push(m[0]);
  }

  // Direct chaining: useStory().next / useStoryOptional().next — no
  // intermediate binding, so there is no identifier to track separately.
  // `useStoryOptional()` can return null, so the idiomatic call site uses
  // optional chaining (`?.`) — an offender is not exempt just because it
  // guarded the null case, so the dot may optionally be `?.`.
  const DIRECT_CHAIN = /useStory(?:Optional)?\(\)\s*\??\s*\.\s*next\b/g;
  for (const m of src.matchAll(DIRECT_CHAIN)) hits.push(m[0]);

  // Whole-object capture: const <name> = useStory(); ... <name>.next
  // Track every identifier bound this way, then scan the rest of the file
  // for `<name>.next` property access anywhere after (or before) the bind —
  // order doesn't matter for a hazard that just needs to exist in the file.
  // Same `?.` allowance as above for names bound from useStoryOptional().
  const BIND = /const\s+(\w+)\s*=\s*useStory(?:Optional)?\(\)/g;
  const boundNames = new Set<string>();
  for (const m of src.matchAll(BIND)) boundNames.add(m[1]);
  for (const name of boundNames) {
    const ACCESS = new RegExp(`\\b${name}\\s*\\??\\s*\\.\\s*next\\b`, "g");
    for (const m of src.matchAll(ACCESS)) hits.push(m[0]);
  }

  return hits;
}

/**
 * Components outside the shell that can reach `next` out of the story
 * context, in any of the shapes `findContextNextOffences` recognizes.
 *
 * Returns `file -> [offending snippets]` for every offender found.
 */
export function screensReachingContextNext(): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const f of componentFiles("components")) {
    if (f.startsWith("components/shell/")) continue;
    const src = stripComments(sourceOf(f));
    const hits = findContextNextOffences(src);
    if (hits.length) {
      out[f] = hits.map(
        h => `${f}: reaches the story context's next() via \`${h}\` — only components/shell/ may do this`,
      );
    }
  }
  return out;
}

/**
 * Every source file the brand-name rule applies to: all of `app/`,
 * `components/`, `lib/`, plus the demo's own README.
 *
 * Deliberately a walk, not a list. The naming guard in `regressions.test.ts`
 * used to enumerate its files by hand and missed `lib/one-pager.ts`, which is
 * where the public one-pager's copy lives — the company name shipped
 * intercapped on a public page under a green suite. Anything that opts out
 * has to say so here, in the open, rather than by being forgotten.
 *
 * Build output and dependencies are skipped: they are generated or vendored,
 * and neither is ours to spell.
 */
export function brandScopeFiles(): string[] {
  const SKIP = new Set([".next", "node_modules", "out", "public", ".git"]);
  const EXT = /\.(tsx?|css|md)$/;
  const walk = (dir: string): string[] => {
    const out: string[] = [];
    for (const entry of readdirSync(join(ROOT, dir), { withFileTypes: true })) {
      if (SKIP.has(entry.name)) continue;
      const rel = `${dir}/${entry.name}`;
      if (entry.isDirectory()) out.push(...walk(rel));
      else if (EXT.test(entry.name)) out.push(rel);
    }
    return out;
  };
  return [...walk("app"), ...walk("components"), ...walk("lib"), "README.md"];
}
