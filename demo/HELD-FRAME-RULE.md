# The Held Frame Rule

> **Furniture holds still; only content moves.**

Anything the layout pins in place — the top bar, a docked nav, a sticky call
panel, the video inside it — must occupy the same box on every screen it
survives. A viewer reads persistent chrome once and then stops looking at it;
when it drifts they have to re-find it, and a control that shifts under a
moving cursor gets mis-clicked.

The rule is about the **frame**, not the pixels in it. A caption may say
something new on every beat. It may not change how tall it is while doing so.

This document is the *why*. The enforcement is
[`scripts/stability-sweep.mjs`](scripts/stability-sweep.mjs) and
[`lib/chrome-stability.test.ts`](lib/chrome-stability.test.ts); if the two ever
disagree, the code is right and this file is stale.

## The fix: reserve, never resize

**When content genuinely varies, reserve the widest or tallest case and let the
short case leave the remainder empty.** Never let the layout resize to fit. In
practice that is one of two shapes.

### Reserve a floor

Export the measured maximum as a named constant and apply it as a `min-height`
— in `em`, so it survives the in-app text-size control. Never a fixed `height`,
which clips the long case instead.

```tsx
// components/screens/video-split.tsx
export const CALL_HEADER_MIN = 155;      // desktop header block
export const CALL_HEADER_MIN_SM = 185;   // the same floor at phone width
export const CALL_NOTE_MIN = 131;        // the caption below the call tile
```

A number, not a Tailwind class, because the guard tests read it: the value is
the invariant, and a screen that hard-codes its own height instead is exactly
the drift this exists to stop.

### Stack the variants

Where a control swaps between two labels, put both in the same grid cell and
mark the inactive one `invisible`:

```tsx
<button className="grid ...">
  <span className={cn("col-start-1 row-start-1", !atEnd && "invisible")}>
    End of this persona's day
  </span>
  <span className={cn("col-start-1 row-start-1", atEnd && "invisible")}>
    Next
  </span>
</button>
```

`invisible` keeps the element in layout so the wider label reserves the width.
**`hidden` removes it and collapses the very width you were trying to reserve** —
that is the failure mode, not a stylistic preference.

### Measure the maximum; do not guess it

Every floor above was set from real measurements. The one that was guessed came
out 27px short, which is the whole bug in miniature. Run the layout, read the
numbers, then write the constant.

## Why this file exists

The rule has been broken **four times**, each in a different element:

| # | Element | What happened |
|---|---|---|
| 1 | Call video | Changed size between beats; `CallShell` now owns both axes |
| 2 | Audiologist caption | 1–3 lines inside a sticky panel, so the panel and video grew and shrank |
| 3 | Top bar | Slid sideways when the Next button swapped its label for a sentence 5× wider |
| 4 | Whole chrome row | A beat that scrolls centres 7.5px left of one that does not — the scrollbar is taken out of the centring width, dragging logo, pills and buttons with it |

They are **one defect, not four**. The first three were each fixed with a test
naming that one element, which is precisely why the next one still shipped.

Assume the fifth is somewhere nobody has looked.

## Enforcement

```bash
npm run stability-sweep     # needs a running dev server
npm test                    # includes the static half
```

`stability-sweep.mjs` walks every beat of all four personas in a real browser
and fails on any sticky or fixed element that changes position or size. **It
names no elements** — that is the entire point, and the reason it catches cases
nobody thought to test. Two rules keep it signal rather than noise:

- **Key elements by DOM path, not by text.** A button whose label changes is the
  same button — and that is exactly the case that caused defect #3. Keying on
  text would treat the two labels as different elements and compare neither.
- **Skip elements mid-animation, and elements present in only one snapshot.** A
  transform in flight is not a resting position, and appearing is not drifting.

It needs a browser and a dev server, so it cannot run inside `npm test`. That is
what `lib/chrome-stability.test.ts` is for: it fails on the source *shapes* that
cause the drift (a long/short label ternary inside sticky chrome, a call beat
with no reserved header) on every commit. It cannot prove the chrome holds
still — only the sweep can.

**A sweep that walks zero screens must exit non-zero.** A bad selector silently
walking nothing and printing a green tick is a failure mode that has actually
shipped here (`role-lock-sweep.mjs`), so both sweeps assert a minimum screen
count before reporting success.

### One trap worth knowing

Headless Chrome draws **overlay** scrollbars that take no space, so `clientWidth`
never changes and no element appears to move. Defect #4 survived a green sweep
for exactly that reason. The sweep now measures the centring width separately
rather than trusting the element map alone. If you extend this, be suspicious of
anything that looks stable *only* in headless.

## Scope

Written for this demo, but nothing here is specific to it. The same rule and the
same sweep shape apply to any multi-screen UI with persistent chrome. It is also
captured in the `responsive-guard` skill as a fourth axis — **time/navigation** —
alongside viewport width and font size, because every other responsive axis
varies the *viewport* while this one varies the *screen*: each screen is correct
on its own and the defect exists only in the transition, which is why
screenshot-per-screen review structurally cannot find it.
