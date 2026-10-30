import type { MetadataRoute } from "next";
import { BRAND_NAME } from "../lib/mock-data"; // relative: lib/brand-icons.test.ts imports this file, and vitest has no "@/" alias

export const dynamic = "force-static";

/**
 * Android's "Add to home screen" icon. One full-bleed square serves both
 * purposes: scripts/brand-icons.mjs keeps the mark inside the 80% safe circle
 * that Android's mask crops to.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: BRAND_NAME,
    short_name: BRAND_NAME,
    start_url: "/",
    display: "standalone",
    background_color: "#F4F8F8",
    theme_color: "#0B2340",
    icons: [
      { src: "/brand/hearfy-app-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/brand/hearfy-app-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/brand/hearfy-app-icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
