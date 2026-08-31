/**
 * Tailwind's default spacing scale, and a check against it.
 *
 * A bug shipped `pb-38` — there is no `38` on Tailwind's scale (it jumps
 * `36` -> `40`) — so the utility compiled to NO CSS at all and the element
 * silently fell back to zero padding. A clearance test still "passed"
 * because it parsed the integer out of the class string and did correct
 * arithmetic on a number the browser never applied. This module is the one
 * place that knows which bare numeric steps Tailwind's JIT actually
 * recognizes, so every test that reads a spacing class shares the same
 * scale rather than re-typing (and risking drift on) its own copy.
 *
 * `tailwind.config.ts`'s `theme.extend` only adds colors and boxShadow —
 * no custom spacing step — so this set is the complete scale. If that ever
 * changes, extend this set to match rather than letting a test drift from
 * the real config.
 */
export const TAILWIND_SPACING_SCALE = new Set([
  0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 20,
  24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 72, 80, 96,
]);

/** One rem per spacing step. */
export const SPACING_UNIT_REM = 0.25;

/** Whether a bare numeric spacing step (the `38` in `pb-38`) is on Tailwind's default scale. */
export function isOnSpacingScale(raw: number): boolean {
  return TAILWIND_SPACING_SCALE.has(raw);
}

/**
 * Every bare-numeric Tailwind spacing utility in `src`, for the properties
 * this codebase actually uses (padding, margin, gap, width/height, and the
 * position/inset family).
 *
 * Deliberately skipped, because they are not a step on the numeric scale at
 * all and cannot be "off" it:
 *  - fraction utilities (`w-1/2`) — a different Tailwind feature entirely;
 *  - keyword utilities (`w-full`, `h-screen`, `inset-0` is numeric and fine,
 *    but `h-screen`/`h-auto`/`h-fit`/... carry no digits to check);
 *  - arbitrary-value syntax (`pb-[9.5rem]`) — an explicit escape hatch that
 *    always emits real CSS, so it is never the `pb-38` failure mode.
 */
export function spacingUtilitiesIn(src: string): { className: string; prop: string; raw: number }[] {
  const PROPS = "p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|gap|gap-x|gap-y|w|h|inset|inset-x|inset-y|top|right|bottom|left";
  const SPACING_UTILITY = new RegExp(`(?<![\\w-])(${PROPS})-(\\d+(?:\\.\\d+)?)(?![\\w.\\/-])`, "g");
  const out: { className: string; prop: string; raw: number }[] = [];
  for (const m of src.matchAll(SPACING_UTILITY)) {
    out.push({ className: m[0], prop: m[1], raw: Number(m[2]) });
  }
  return out;
}
