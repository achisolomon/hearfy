import { DemoShell } from "@/components/shell/demo-shell";
import { StoryProvider } from "@/components/shell/story-context";

/**
 * The demo lives at the root. Demo 1 was retired and the `/demo2` duplicate
 * of this page was removed on 2026-09-02, so there is one route and no
 * chooser: `/` IS the four-persona app.
 *
 * Worth knowing if a second demo ever returns: the app is statically exported
 * (`output: "export"` in next.config.mjs), so a redirect between routes is not
 * available — `redirect()` in next.config.mjs and in `next/navigation` are both
 * server-only, and a `<meta http-equiv="refresh">` would have to be
 * basePath-aware (GitHub Pages serves under /hearfy/, see lib/asset.ts).
 * Rendering the tree directly at the route is what works in both `next dev`
 * and the exported build.
 */
export default function Page() {
  return (
    <StoryProvider>
      <DemoShell />
    </StoryProvider>
  );
}
