/**
 * Static asset URLs, basePath-aware.
 *
 * GitHub Pages serves the demo under /hearfy/ (next.config.mjs sets basePath
 * only when GITHUB_ACTIONS=true). Next rewrites its own bundles and `next/image`
 * for us, but a raw `<video src>` or `<img src>` is left untouched — so any URL
 * we hand the browser by hand must go through here, or it 404s in production
 * while working perfectly on localhost.
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
