/**
 * Static export for GitHub Pages (spec §4).
 * - Pages serves under /hearfy/, so basePath is set only in CI
 *   (GITHUB_ACTIONS=true) — local `npm run dev` still serves at /.
 * - No server features may be added: no API routes, no runtime images.
 */
const isPages = process.env.GITHUB_ACTIONS === "true";

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
  basePath: isPages ? "/hearfy" : "",
  assetPrefix: isPages ? "/hearfy/" : undefined,
  images: { unoptimized: true },
  // Exposed so client code can build raw asset URLs (see lib/asset.ts).
  env: { NEXT_PUBLIC_BASE_PATH: isPages ? "/hearfy" : "" },
};

export default nextConfig;
