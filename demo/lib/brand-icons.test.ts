import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import manifest from "../app/manifest";

const ROOT = join(__dirname, "..");

/** Width and height from a PNG's IHDR chunk. */
function pngSize(rel: string): [number, number] {
  const buf = readFileSync(join(ROOT, rel));
  return [buf.readUInt32BE(16), buf.readUInt32BE(20)];
}

// Owner, 2026-10-30: every link we send (one-pager, demo) shows a banner, and
// the site has one icon for the tab, iPhone and Android. Before this the site
// had no favicon and links previewed as bare text.
describe("app icon and link banner", () => {
  it("gives every sent page a 1200x630 banner", () => {
    for (const page of ["app/opengraph-image.png", "app/demo/opengraph-image.png"]) {
      expect(pngSize(page), page).toEqual([1200, 630]);
    }
  });

  it("ships the iPhone home screen icon", () => {
    expect(pngSize("app/apple-icon.png")).toEqual([180, 180]);
  });

  // Owner, 2026-10-30: the first tab icon was the navy tile, and blurry.
  it("draws the tab icon transparent, with no background tile", () => {
    const svg = readFileSync(join(ROOT, "app/icon.svg"), "utf8");
    expect(svg).toContain('stroke="#12AAA5"');
    expect(svg).not.toMatch(/<rect[^>]*width="(100|42)"/);
    expect(svg).not.toContain("#0B2340");
  });

  it("packs favicon.ico up to 256px, with an alpha channel", () => {
    const ico = readFileSync(join(ROOT, "app/favicon.ico"));
    const count = ico.readUInt16LE(4);
    // ICONDIRENTRY: byte 0 is the width, 0 meaning 256; bytes 6-7 bits per pixel.
    const entries = Array.from({ length: count }, (_, i) => ico.subarray(6 + 16 * i, 22 + 16 * i));
    const widths = entries.map(e => e[0] || 256);
    expect(widths).toEqual(expect.arrayContaining([16, 32, 256]));
    for (const e of entries) expect(e.readUInt16LE(6)).toBe(32);
  });

  it("points the Android manifest only at icons that exist, at their stated size", () => {
    const icons = manifest().icons ?? [];
    expect(icons.some(i => i.purpose === "maskable")).toBe(true);
    for (const icon of icons) {
      const [w, h] = pngSize(join("public", icon.src));
      expect(`${w}x${h}`, icon.src).toBe(icon.sizes);
    }
  });

  it("makes the banner URL absolute, and the preview's own on a branch build", () => {
    const layout = readFileSync(join(ROOT, "app/layout.tsx"), "utf8");
    expect(layout).toMatch(/metadataBase:\s*new URL\(siteUrl\)/);
    expect(layout).toMatch(/CF_PAGES_BRANCH !== "main" && CF_PAGES_URL \? CF_PAGES_URL : "https:\/\//);
  });
});
