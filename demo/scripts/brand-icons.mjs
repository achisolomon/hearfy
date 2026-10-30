/**
 * Render the app icon and the link banner from the approved brand files.
 *
 * Owner, 2026-10-30: a transparent mark for the browser tab, the teal mark on
 * a Harbor Navy tile for the iPhone and Android home screens, and one link
 * banner for every page we send (one-pager, demo, deck). Both are generated
 * from `public/brand/hearfy-mark.svg` and `hearfy-logo.svg`, never redrawn, so
 * a logo change is one re-run of this script:
 *
 *     node scripts/brand-icons.mjs icons app public/brand
 *     node scripts/brand-icons.mjs og app/opengraph-image.png hearfy.org
 *     node scripts/brand-icons.mjs og app/demo/opengraph-image.png hearfy.org "Product demo"
 *
 * The deck (private repo) runs the same commands with its own paths, domain
 * and label "Investor overview".
 *
 * Needs Chrome (CHROME_PATH to override), network for the Inter webfont, and
 * ImageMagick (`magick`) for favicon.ico.
 */
import { chromium } from "playwright-core";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const CHROME = process.env.CHROME_PATH
  || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BRAND = path.join(path.dirname(new URL(import.meta.url).pathname), "../public/brand");
const svgBody = (file) => fs.readFileSync(path.join(BRAND, file), "utf8").replace(/<\?xml[^>]*>\s*/, "");

/**
 * The tile: the mark at 64% of the tile width, centred. Android crops icons
 * to a circle of 80% diameter; the mark's farthest point (the dot) sits at 32%
 * from the centre, so one full-bleed square serves as both "any" and
 * "maskable", and iOS applies its own rounded corners to the same square.
 */
function tileSvg() {
  const mark = svgBody("hearfy-mark.svg")
    .replace(/<svg[^>]*>/, '<svg x="16" y="25.6" width="68" height="51.8" viewBox="0 0 42 32">');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="512" height="512">
  <rect width="100" height="100" fill="#0B2340"/>
  ${mark}
</svg>
`;
}

/**
 * The browser-tab favicon: the mark alone, transparent, in a square viewBox
 * (owner, 2026-10-30: "it needs to be transparent"). The navy tile is only for
 * home screens, where iOS would fill transparency with black.
 */
function faviconSvg() {
  return svgBody("hearfy-mark.svg")
    .replace(/viewBox="[^"]*" width="\d+" height="\d+"/, 'viewBox="0 -5 42 42" width="512" height="512"');
}

/** 1200x630 is the size every link preview (iMessage, WhatsApp, Slack, LinkedIn, X) crops from. */
function bannerHtml(domain, label) {
  const logo = svgBody("hearfy-logo.svg").replace(/<svg/, '<svg style="height:96px;width:349px;display:block"');  // 96 * 116.35/32, so the lockup is not stretched and centred
  return `<!DOCTYPE html><html><head>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=block">
<style>
  body { margin:0; width:1200px; height:630px; background:#F4F8F8; font-family:Inter; color:#0B2340;
         display:flex; flex-direction:column; justify-content:center; padding:0 96px; box-sizing:border-box; position:relative; }
  .rule { width:96px; height:6px; background:#12AAA5; border-radius:3px; margin:44px 0 36px; }
  .label { font-size:24px; font-weight:600; letter-spacing:2px; text-transform:uppercase; color:#087D7A; margin-bottom:14px; }
  h1 { font-size:64px; font-weight:800; line-height:1.1; letter-spacing:-1px; margin:0; }
  p { font-size:30px; color:#4a5b6e; margin:20px 0 0; }
  .domain { position:absolute; right:96px; bottom:56px; font-size:24px; font-weight:600; color:#087D7A; }
</style></head><body>
  ${logo}
  <div class="rule"></div>
  ${label ? `<div class="label">${label}</div>` : ""}
  <h1>Bringing hearing care home.</h1>
  <p>The operating platform for at-home hearing care.</p>
  <div class="domain">${domain}</div>
</body></html>`;
}

async function render(page, html, size, out, transparent = false) {
  await page.setViewportSize(size);
  await page.setContent(html, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: out, omitBackground: transparent });
}

const [cmd, ...args] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage();
try {
  if (cmd === "icons") {
    const [appDir, publicDir] = args;
    const tile = tileSvg();
    const favicon = faviconSvg();
    fs.writeFileSync(path.join(appDir, "icon.svg"), favicon);
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "brand-icons-"));
    const at = async (svg, px, out, transparent = false) => render(page,
      `<body style="margin:0;background:transparent">${svg.replace('width="512" height="512"', `width="${px}" height="${px}" style="display:block"`)}</body>`,
      { width: px, height: px }, out, transparent);
    await at(tile, 180, path.join(appDir, "apple-icon.png"));
    await at(tile, 192, path.join(publicDir, "hearfy-app-icon-192.png"));
    await at(tile, 512, path.join(publicDir, "hearfy-app-icon-512.png"));
    // Up to 256px so retina tabs, bookmarks and Windows shortcuts never upscale a 16px bitmap.
    const ICO = [16, 32, 48, 64, 128, 256];
    const ico = ICO.map(px => path.join(tmp, `${px}.png`));
    for (const [i, px] of ICO.entries()) await at(favicon, px, ico[i], true);
    execFileSync("magick", [...ico, path.join(appDir, "favicon.ico")]);
  } else if (cmd === "og") {
    const [out, domain, label = ""] = args;
    await render(page, bannerHtml(domain, label), { width: 1200, height: 630 }, out);
    const inter = await page.evaluate(() => document.fonts.check("800 64px Inter"));
    if (!inter) throw new Error("Inter did not load; the banner would render in a fallback font");
  } else {
    throw new Error("usage: brand-icons.mjs icons <appDir> <publicBrandDir> | og <out.png> <domain> [label]");
  }
} finally {
  await browser.close();
}
