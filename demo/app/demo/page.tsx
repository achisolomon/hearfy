import { DemoShell } from "@/components/shell/demo-shell";
import { StoryProvider } from "@/components/shell/story-context";

/**
 * The demo lives at `/demo`. Demo 1 was retired and the `/demo2` duplicate
 * of this page was removed on 2026-09-02, so there is one route and no
 * chooser: `/demo` IS the four-persona app. It sat at `/` until 2026-09-03,
 * when the one-pager took the root of hearfy.org and the demo moved a level
 * down — a visitor arriving cold should meet the document, not the shell.
 *
 * Worth knowing if a second demo ever returns: the app is statically exported
 * (`output: "export"` in next.config.mjs), so a redirect between routes is not
 * available — `redirect()` in next.config.mjs and in `next/navigation` are both
 * server-only, leaving `<meta http-equiv="refresh">` as the only option (see
 * app/one-pager/page.tsx for the one place that is used).
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
