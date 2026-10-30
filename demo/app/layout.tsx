import type { Metadata } from "next";
import "./globals.css";
import { BRAND_NAME } from "@/lib/mock-data";

const title = `${BRAND_NAME} — hearing diagnostics, at home`;
const description = `${BRAND_NAME} patient demo — at-home hearing care`;

/**
 * Icons and the link banner come from the file conventions in this folder
 * (icon.svg, favicon.ico, apple-icon.png, opengraph-image.png, manifest.ts),
 * all rendered by scripts/brand-icons.mjs. metadataBase makes the banner URL
 * absolute, which link previews require. A Cloudflare branch preview points it
 * at its own URL; pointing at hearfy.org would preview a banner not yet live.
 */
const { CF_PAGES_BRANCH, CF_PAGES_URL } = process.env;
const siteUrl = CF_PAGES_BRANCH && CF_PAGES_BRANCH !== "main" && CF_PAGES_URL ? CF_PAGES_URL : "https://hearfy.org";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  openGraph: { title, description, siteName: BRAND_NAME, type: "website" },
  twitter: { card: "summary_large_image" },
  appleWebApp: { title: BRAND_NAME },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
