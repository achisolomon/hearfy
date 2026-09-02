# Hearfy brand assets

Standalone logo files for use outside the app — decks, documents, email, social,
partner sites. **The app itself does not read these**; it draws the mark as
inline SVG in `components/ui.tsx` so it can follow the brand tokens and animate.
These are exports of that same artwork, generated 2026-09-02.

If the logo changes, regenerate these — they will not update themselves.

## Which file do I want?

| Need | Use |
|---|---|
| Anything that can take a vector | `hearfy-logo.svg` |
| Slide deck, doc, email signature | `hearfy-logo-512h.png` |
| Social avatar, favicon source | `hearfy-mark-512h.png` |
| A tool that rejects transparency | `hearfy-logo-512h-white.jpg` |
| Showing the logo animating | `hearfy-logo-animated.gif` |
| Animation, but smooth edges | `hearfy-logo-animated.webp` or `.mp4` |

## What is in here

**Vector** — infinitely scalable, smallest files. Text is converted to outlines,
so no font needs to be installed anywhere.

- `hearfy-logo.svg` — full lockup (mark + wordmark), 116.35 × 32
- `hearfy-mark.svg` — mark only, 42 × 32

**PNG, transparent background** — heights of 64/128/256/512px, plus a 2000px-wide
version for print or large displays.

- `hearfy-logo-{64,128,256,512}h.png`, `hearfy-logo-2000w.png`
- `hearfy-mark-{64,128,256,512}h.png`

**JPEG** — **JPEG has no alpha channel, so these cannot be transparent.** They are
flattened onto a background, which is why a PNG is better nearly everywhere. Use
these only where JPEG is genuinely required.

- `hearfy-logo-512h-white.jpg` — on white
- `hearfy-logo-512h-bg.jpg` — on Cloud White `#F4F8F8`, the app's own ground
- `hearfy-mark-512h-white.jpg` — mark only, on white

**Animated** — the entry animation the cover screen plays: arc, then each bar,
then the dot, left to right, 110ms apart, then the wordmark. About 1.9s, loops.

- `hearfy-logo-animated.gif` (880×300) and `-440w.gif` (440×150) — transparent,
  but GIF alpha is 1-bit, so edges fringe slightly against non-white backgrounds
- `hearfy-logo-animated.webp` — transparent with smooth edges; use where WebP works
- `hearfy-logo-animated.mp4` — smallest and smoothest, but **no transparency**

## Colours

| Token | Hex | Where |
|---|---|---|
| Vital Teal | `#12AAA5` | the mark — arc, bars, dot |
| Harbor Navy | `#0B2340` | "Hear" |
| Teal Ink | `#087D7A` | "fy" |

The wordmark's tail is Teal Ink, not the Vital Teal of the original logo file:
Vital Teal measures 2.87:1 on white, below the 4.5:1 floor for text. Teal Ink is
4.97:1 and is the colour the product already uses for teal type. The mark keeps
Vital Teal — it is decoration, not text.

## Clear space and minimum size

Leave clear space of at least the mark's cap height on every side. Do not place
the lockup below 24px tall (the wordmark stops being legible); below that, use
the mark on its own.

Do not recolour, rotate, stretch, add effects to, or rebuild the lockup — scale
the provided files, or take the vector.

## Typeface

The wordmark is **Inter ExtraBold (800)**, outlined in the vector files, so
nothing needs Inter installed to render these correctly. Inter is licensed under
the SIL Open Font License.
