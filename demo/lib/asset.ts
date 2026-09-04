/**
 * Static asset URLs, basePath-aware.
 *
 * The site serves from the apex of hearfy.org, so the base is empty and this
 * is a no-op today (it was `/hearfy` until 2026-09-03, while Pages served the
 * project URL). It stays because Next rewrites its own bundles and
 * `next/image` but leaves a raw `<video src>` or `<img src>` untouched: every
 * URL we hand the browser by hand goes through here, so restoring a basePath
 * is one edit in next.config.mjs rather than a sweep of every raw tag.
 *
 * The env reference must be written as a full literal
 * `process.env.NEXT_PUBLIC_BASE_PATH` for Next to inline it at build time;
 * destructuring it, or aliasing it to a module constant with `??`, leaves an
 * undefined lookup in the bundle and silently drops the prefix.
 */
export function asset(path: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
