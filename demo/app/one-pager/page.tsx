import type { Metadata } from "next";

/**
 * A redirect stub for the one-pager's old address.
 *
 * The one-pager lived at `/one-pager` until 2026-09-03, when it took the root
 * of hearfy.org. That URL had already been shared, so it must not 404.
 *
 * A `<meta http-equiv="refresh">` because the export is static: `redirect()`
 * from `next/navigation` and a `redirects()` block in next.config.mjs are both
 * server-only and are silently dropped by `output: "export"`. The canonical
 * link is what tells a crawler the destination is the real page — the meta
 * refresh alone is a weak, ambiguous signal to a search engine.
 *
 * The href is a bare "/" rather than an `asset()` call on purpose: this is a
 * route, not an asset, and routes are basePath-rewritten by Next itself.
 *
 * The `<meta>` is rendered in the returned tree, and React hoists it into the
 * document head. Two dead ends, so nobody retries them:
 *   - `metadata.other` emits `<meta name="http-equiv:refresh">` — a `name`,
 *     never an `http-equiv`, so it redirects nobody. Next's Metadata API has
 *     no http-equiv field at all.
 *   - Returning an `<html>`/`<head>` pair from this page nests a second
 *     document inside the one app/layout.tsx already supplies. The refresh
 *     does fire, but the exported HTML is invalid — the sort of thing that
 *     works until a crawler or an embed preview parses it strictly.
 *
 * Nothing here should grow. If this page ever needs content, the redirect has
 * outlived its purpose and should be deleted instead.
 */
export const metadata: Metadata = {
  title: "Moved",
  robots: { index: false, follow: true },
  alternates: { canonical: "/" },
};

export default function Page() {
  return (
    <>
      <meta httpEquiv="refresh" content="0; url=/" />
      {/* Seen only if the refresh is blocked, or by tooling that does not follow it. */}
      <p style={{ font: "16px/1.5 system-ui, sans-serif", padding: "3rem 1.5rem" }}>
        This page has moved to <a href="/">hearfy.org</a>.
      </p>
    </>
  );
}
