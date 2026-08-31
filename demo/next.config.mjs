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
  output: "export",
  basePath: isPages ? "/hearfy" : "",
  assetPrefix: isPages ? "/hearfy/" : undefined,
  images: { unoptimized: true },
  // Exposed so client code can build raw asset URLs (see lib/asset.ts).
  env: { NEXT_PUBLIC_BASE_PATH: isPages ? "/hearfy" : "" },
};

export default nextConfig;
