/**
 * Static export for GitHub Pages (spec §4).
 * - The site is served from the apex of its own domain (hearfy.org, set by
 *   `public/CNAME`), so there is no basePath: `/` is the one-pager and
 *   `/demo` is the walkthrough, in CI exactly as on localhost.
 *
 *   It was `/hearfy` until 2026-09-03, when the custom domain replaced the
 *   achisolomon.github.io/hearfy/ project URL. A project-page basePath and a
 *   custom domain are mutually exclusive — with both, every asset 404s — so
 *   this must stay empty for as long as the CNAME file is there.
 * - No server features may be added: no API routes, no runtime images.
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  /**
   * Two sessions have twice run dev servers in this one directory at the same
   * time, sharing a single `.next` — one's rebuild deletes the manifest the
   * other is serving, so both start 500ing with ChunkLoadError / "__webpack_
   * modules__[moduleId] is not a function" (2026-09-02, twice).
   *
   * `DIST_DIR` lets a second server take its own build directory:
   *     DIST_DIR=.next-review npx next dev -p 3000
   * Unset, it is the normal `.next`, so nothing changes for anyone else.
   */
  distDir: process.env.DIST_DIR || ".next",
  output: "export",
  images: { unoptimized: true },
  // Exposed so client code can build raw asset URLs (see lib/asset.ts).
  // Empty now that the site is served from its own apex domain; the helper
  // stays so a future basePath is one edit here, not a sweep of every <video>.
  env: { NEXT_PUBLIC_BASE_PATH: "" },
};

export default nextConfig;
