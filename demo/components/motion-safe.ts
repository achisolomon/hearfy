/**
 * Spread onto any framer-motion element that fades opacity: `{...jsDriven}`.
 *
 * framer hands a plain opacity animation to the browser (WAAPI). When that
 * animation finishes it is cancelled and the end value is written on framer's
 * NEXT frame-loop tick — so if nothing else is animating, the element shows
 * its pre-animation opacity for one frame: a fade-in blinks to 0, a fade-out
 * flashes back to 1 just before it unmounts (measured headed, 2026-10-05).
 *
 * framer never uses WAAPI for an element with an `onUpdate` handler, because
 * it must report every frame's value — so it drives the animation itself and
 * writes the final frame in the same tick. A no-op handler is enough.
 *
 * Elements that only fade in, with no exit, should use a CSS animation
 * instead (`.screen-in` / `.fade-in` in app/globals.css).
 */
export const jsDriven = { onUpdate: () => {} } as const;
