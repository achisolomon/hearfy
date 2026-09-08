"use client";
import { useEffect, useRef, useState } from "react";

/**
 * The one-pager's pointer-reactive layer.
 *
 * The register is the same one `motion.tsx` defends: calm and clinical. So the
 * rule that module states for entrances — nothing loops, pulses, or drifts once
 * it has arrived — is not weakened here, it is satisfied differently. Every
 * effect below is driven ENTIRELY by the reader's own pointer: move it and the
 * page answers, hold it still and the page is completely static. Nothing has a
 * heartbeat of its own. A page that moves while it is being read is the
 * "toy-like consumer app" anti-reference; a page that responds to where you are
 * pointing is a document with depth.
 *
 * Three mechanical rules hold that line, and each is asserted by
 * `lib/one-pager.test.ts`:
 *
 *   1. **Fine pointers only.** Everything is gated on `(hover: hover) and
 *      (pointer: fine)`. On a touchscreen there is no cursor to react to, and a
 *      "hover" there is a tap that sticks — the glow would strand itself
 *      wherever the reader last touched. Phones get the page exactly as it
 *      shipped before.
 *   2. **Reduced motion means none.** `prefers-reduced-motion: reduce` disables
 *      the listener itself, not just the transition, so no transform is ever
 *      written. Same contract as `Reveal`.
 *   3. **Transform and opacity only.** No layout property is touched by the
 *      pointer, so nothing reflows at pointer rate and the Held Frame Rule is
 *      safe: these effects can never resize the page's chrome.
 *
 * IMPLEMENTATION. One listener for the whole page, writing CSS custom
 * properties on a single root element, and every effect reads those properties
 * in CSS. The alternative — a listener per card, each with its own React state
 * — re-renders a component tree on every mouse move, which is exactly how a
 * calm page starts dropping frames. Here React renders once and then never
 * again; the pointer only ever mutates two numbers on one node.
 *
 * Writes are coalesced into a single `requestAnimationFrame`, so a mouse that
 * reports at 1000Hz still only touches the DOM at the display's refresh rate.
 */

/* ------------------------------------------------------------------ *
 * The shared media query.
 *
 * Named once and reused by every rule below, so a future edit cannot enable an
 * effect on touch by forgetting one of the two conditions. `hover: hover`
 * alone is not enough — some styluses and TV remotes report hover with a
 * coarse pointer, and the tilt reads as a glitch there.
 * ------------------------------------------------------------------ */
const FINE_POINTER = "(hover: hover) and (pointer: fine)";

/**
 * Tracks the pointer and publishes it as CSS custom properties.
 *
 * Wrap the page in this. It writes, on its own wrapper element:
 *   --px, --py   pointer position in px, relative to the wrapper
 *   --pxr, --pyr the same, normalised to 0..1 across the wrapper
 *   --lit        1 while the pointer is over the page, 0 otherwise
 *
 * `--lit` is what makes the exit graceful. Rather than snapping the glow off
 * when the pointer leaves, the opacity multiplies by `--lit` and transitions,
 * so the light fades out over its own duration and the page settles rather
 * than blinking.
 */
export function PointerField({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Gate in state rather than reading the media query during render: the
  // server has no window, and a render-time read would disagree with the
  // client's first paint and throw a hydration mismatch.
  const [live, setLive] = useState(false);

  useEffect(() => {
    // Both conditions in one query. `matchMedia` is the same source of truth
    // the CSS uses, so the listener and the styles can never disagree about
    // whether this pointer counts.
    const fine = window.matchMedia(FINE_POINTER);
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");

    const sync = () => setLive(fine.matches && !still.matches);
    sync();

    // A pointer can change mid-session — a tablet gaining a mouse, or the OS
    // reduced-motion setting being toggled while the page is open — so both
    // queries stay subscribed rather than being read once at mount.
    fine.addEventListener("change", sync);
    still.addEventListener("change", sync);
    return () => {
      fine.removeEventListener("change", sync);
      still.removeEventListener("change", sync);
    };
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || !live) return;

    let frame = 0;
    let pending: { x: number; y: number } | null = null;

    const flush = () => {
      frame = 0;
      if (!pending) return;
      const { x, y } = pending;
      const box = el.getBoundingClientRect();
      el.style.setProperty("--px", `${x - box.left}px`);
      el.style.setProperty("--py", `${y - box.top}px`);
      // Normalised coordinates let an effect react to WHERE across the page
      // the pointer is (the hero parallax uses this) without each consumer
      // having to know the page's width.
      el.style.setProperty("--pxr", `${(x - box.left) / box.width}`);
      el.style.setProperty("--pyr", `${(y - box.top) / box.height}`);
    };

    const onMove = (e: PointerEvent) => {
      // A pointer event from a finger or a pen still fires on a hybrid
      // device; only a mouse-like pointer should light the page.
      if (e.pointerType !== "mouse") return;
      pending = { x: e.clientX, y: e.clientY };
      el.style.setProperty("--lit", "1");
      if (!frame) frame = requestAnimationFrame(flush);
    };

    const onLeave = () => el.style.setProperty("--lit", "0");

    // On `window`, not the element: the glow should keep tracking while the
    // pointer crosses gaps between the page's own children, and the page is
    // narrower than the viewport, so a listener bound to the element alone
    // would drop out in the margins.
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      if (frame) cancelAnimationFrame(frame);
      // Leave no half-lit state behind if the reader turns reduced motion on
      // while the pointer is mid-page.
      el.style.setProperty("--lit", "0");
    };
  }, [live]);

  return (
    <div ref={ref} data-pointer-field className={`relative ${className}`}>
      {children}
    </div>
  );
}

/**
 * The ambient light that follows the pointer across the page ground.
 *
 * A single fixed radial gradient, pinned behind everything and painted at very
 * low alpha. It is the whole reason the page reads as reactive rather than as
 * a set of cards that happen to tilt: the tilt is local and easy to miss, the
 * light is the thing the eye registers.
 *
 * `pointer-events-none` is mandatory — a full-viewport layer over the document
 * would otherwise swallow every click on the page beneath it, including the
 * one button the page has.
 *
 * Rendered as a plain element rather than a `::before` on the wrapper so its
 * stacking is explicit and it cannot be re-ordered by a future className edit.
 */
export function PointerGlow() {
  return (
    <div
      aria-hidden
      data-pointer-glow
      // `fixed`, not absolute: the light is a property of the viewport the
      // reader is looking through, so it must not scroll away with the
      // document. Absolute positioning left it stranded at the top of a
      // 6000px page as soon as the reader scrolled.
      className="pointer-events-none fixed inset-0 -z-10 hidden opacity-0 transition-opacity duration-500 ease-out"
      style={{
        // Two lights, not one. The teal is small and bright and reads as the
        // cursor's own halo; the navy is wide and faint and does the actual
        // work of giving the ground depth. One light alone reads either as a
        // spotlight (too much) or as nothing at all.
        background: `
          radial-gradient(
            420px circle at var(--px, 50%) var(--py, 50%),
            rgba(18, 170, 165, 0.10),
            rgba(18, 170, 165, 0) 70%
          ),
          radial-gradient(
            900px circle at var(--px, 50%) var(--py, 50%),
            rgba(11, 35, 64, 0.06),
            rgba(11, 35, 64, 0) 72%
          )
        `,
      }}
    />
  );
}

/**
 * The stylesheet for every pointer-driven effect.
 *
 * Kept as one `<style>` block rather than Tailwind classes because all of it
 * is conditional on a media query AND on custom properties that Tailwind has
 * no syntax for — a `hover:` variant cannot express "tilt away from a point
 * measured on this specific element".
 *
 * Everything is nested inside the fine-pointer query, so on a phone this
 * entire block compiles to nothing and the page is byte-for-byte the document
 * it was before.
 */
export function PointerStyles() {
  return (
    <style
      // The rules are static; dangerouslySetInnerHTML is how a <style> child
      // is written in React without it escaping the `>` in selectors.
      dangerouslySetInnerHTML={{
        __html: `
@media ${FINE_POINTER} {
  /* The glow is display:none by default (see the className) so that a touch
     device never paints a full-viewport layer it will never light. */
  [data-pointer-glow] { display: block; opacity: var(--lit, 0); }

  /* ---------------------------------------------------------------- *
   * Cards: lift, and a sheen that tracks the pointer across the face.
   *
   * The sheen is a ::after so it needs no extra element in the markup and
   * cannot be dropped by an edit to the card's own classes. It is masked to
   * the card's border radius by the card's own overflow, and sits above the
   * card's background but below its text, so copy never dims.
   * ---------------------------------------------------------------- */
  [data-lift] {
    /* transform and box-shadow only. Never margin, padding, width or height:
       a layout property here would reflow the page at pointer rate and could
       resize the chrome, which the Held Frame Rule forbids. */
    transition: transform 260ms cubic-bezier(0.22, 0.61, 0.36, 1),
                box-shadow 260ms cubic-bezier(0.22, 0.61, 0.36, 1);
    will-change: transform;
  }

  [data-lift]:hover {
    /* 3px, and no scale. A scale on a card full of text resamples every
       glyph and the copy visibly softens for the duration of the hover —
       on a page whose whole claim is clinical precision, that reads as a
       rendering fault. A translate is resolution-independent. */
    transform: translateY(-3px);
    box-shadow: 0 24px 55px rgba(11, 35, 64, 0.13);
  }

  /* The sheen. Positioned from the pointer's location WITHIN the card, which
     is why each card publishes its own --mx/--my rather than reusing the
     page-level --px/--py: the page coordinates would put the highlight in
     the same screen position on every card at once. */
  [data-sheen] { position: relative; }

  [data-sheen]::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    pointer-events: none;
    opacity: 0;
    transition: opacity 260ms ease-out;
    background: radial-gradient(
      320px circle at var(--mx, 50%) var(--my, 50%),
      rgba(18, 170, 165, 0.09),
      rgba(18, 170, 165, 0) 68%
    );
  }

  [data-sheen]:hover::after { opacity: 1; }

  /* ---------------------------------------------------------------- *
   * Imagery: a few pixels of parallax against the pointer.
   *
   * The frame does not move; the picture moves INSIDE it, which is what makes
   * it read as depth rather than as a wobbling element. The image is already
   * object-cover and therefore already overflows its frame, so there is spare
   * pixel to slide and no edge is ever exposed.
   * ---------------------------------------------------------------- */
  [data-parallax] > img,
  [data-parallax] > video {
    transition: transform 400ms cubic-bezier(0.22, 0.61, 0.36, 1);
    will-change: transform;
  }

  [data-parallax]:hover > img,
  [data-parallax]:hover > video {
    /* Scale first so the translate has cover to move into. 1.04 on a
       photograph is invisible as a size change but yields ~2% of the frame in
       every direction to travel, which is more than the 8px asked for below. */
    transform: scale(1.04)
               translate(calc((var(--mx-r, 0.5) - 0.5) * -16px),
                         calc((var(--my-r, 0.5) - 0.5) * -16px));
  }

  /* ---------------------------------------------------------------- *
   * The pull quote and the closing panel: navy grounds, so the light on them
   * is teal and slightly stronger — the same glow at 9% is invisible against
   * #0B2340.
   * ---------------------------------------------------------------- */
  [data-sheen="dark"]::after {
    background: radial-gradient(
      460px circle at var(--mx, 50%) var(--my, 50%),
      rgba(18, 170, 165, 0.22),
      rgba(18, 170, 165, 0) 70%
    );
  }
}

/* Belt and braces. The whole block above is already gated on a fine pointer,
   and the listener refuses to run under reduced motion — but a hover
   transition is a CSS effect that would still fire from the stylesheet alone
   if the query above were ever widened. This turns all of it off at the
   source, and is the rule lib/one-pager.test.ts pins. */
@media (prefers-reduced-motion: reduce) {
  [data-lift], [data-lift]:hover,
  [data-parallax] > img, [data-parallax]:hover > img,
  [data-parallax] > video, [data-parallax]:hover > video {
    transform: none;
    transition: none;
  }
  [data-sheen]::after, [data-pointer-glow] { display: none; }
}
`,
      }}
    />
  );
}

/**
 * Publishes the pointer's position *within one element* as `--mx`/`--my`.
 *
 * The card sheen and the photo parallax both need element-local coordinates,
 * not page coordinates. Rather than making every card a client component, this
 * attaches one delegated listener at the document level and writes the
 * properties onto whichever `[data-sheen]` or `[data-parallax]` element the
 * pointer is currently over.
 *
 * Delegation matters more than it looks: this page has roughly two dozen cards
 * and photos. Twenty-four mounted listeners, each with its own React state and
 * its own `getBoundingClientRect`, is the difference between a page that
 * glides and one that stutters on a laptop trackpad. One listener, one
 * `closest()` call, one rect per frame.
 */
export function PointerLocals() {
  useEffect(() => {
    const fine = window.matchMedia(FINE_POINTER);
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!fine.matches || still.matches) return;

    let frame = 0;
    let pending: PointerEvent | null = null;
    // The element currently lit, so it can be cleaned when the pointer moves
    // off it — otherwise a card keeps the sheen position it last saw and the
    // highlight reappears in a stale spot on the next hover.
    let active: HTMLElement | null = null;

    const flush = () => {
      frame = 0;
      const e = pending;
      pending = null;
      if (!e) return;

      const target = (e.target as Element | null)?.closest<HTMLElement>(
        "[data-sheen], [data-parallax]",
      );

      if (target !== active) {
        active?.style.removeProperty("--mx");
        active?.style.removeProperty("--my");
        active?.style.removeProperty("--mx-r");
        active?.style.removeProperty("--my-r");
        active = target ?? null;
      }
      if (!target) return;

      const box = target.getBoundingClientRect();
      const x = (e.clientX - box.left) / box.width;
      const y = (e.clientY - box.top) / box.height;
      target.style.setProperty("--mx", `${x * 100}%`);
      target.style.setProperty("--my", `${y * 100}%`);
      // Unitless twins for the parallax, which multiplies rather than
      // positions and so cannot use a percentage.
      target.style.setProperty("--mx-r", `${x}`);
      target.style.setProperty("--my-r", `${y}`);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      pending = e;
      if (!frame) frame = requestAnimationFrame(flush);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
