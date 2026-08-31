/**
 * WCAG relative-luminance contrast, for tests that assert the palette rather
 * than trusting it.
 *
 * The muted-ink bug (2026-08-31) shipped because slate-500 passes on pure
 * white (4.76:1) and was checked there, while the app's ground is Harbor
 * Ground #F4F8F8, where the same colour is 4.45:1. A ratio anyone can run
 * against every ground in use is the only way that stays fixed.
 */

type RGB = [number, number, number];

export function hexToRgb(hex: string): RGB {
  const h = hex.replace("#", "").trim();
  const full = h.length === 3 ? h.split("").map(c => c + c).join("") : h;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) throw new Error(`not a hex colour: ${hex}`);
  return [0, 2, 4].map(i => parseInt(full.slice(i, i + 2), 16)) as RGB;
}

/** WCAG 2.x relative luminance. */
export function luminance(rgb: RGB): number {
  const [r, g, b] = rgb.map(v => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Contrast ratio between two colours, 1..21. */
export function contrastRatio(a: string, b: string): number {
  const L1 = luminance(hexToRgb(a));
  const L2 = luminance(hexToRgb(b));
  return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
}

/**
 * Every ground a muted string actually sits on in the patient journey.
 * Harbor Ground is the app background; white is every Card; #F2F7F7 is the
 * inner tile used by Results and the care record; #E8F9F8 is the teal tint
 * behind status pills and the selected Option.
 */
export const LIGHT_GROUNDS = ["#F4F8F8", "#FFFFFF", "#F2F7F7", "#E8F9F8"] as const;

/** The navy ground of the dispatch and call screens. */
export const DARK_GROUND = "#0B2340";

/** Worst contrast a colour achieves across the light grounds in use. */
export function worstOnLight(color: string): number {
  return Math.min(...LIGHT_GROUNDS.map(g => contrastRatio(color, g)));
}
