import { DemoShell } from "@/components/shell/demo-shell";
import { StoryProvider } from "@/components/shell/story-context";

/**
 * With Demo 1 retired, Demo 2 is the only demo — so `/` renders it directly
 * instead of a "choose a demo" chooser. This mirrors app/demo2/page.tsx
 * exactly (rather than a client-side redirect to it) because the app is
 * statically exported (`output: "export"` in next.config.mjs): Next's
 * `redirect()` config in next.config.mjs and `next/navigation`'s `redirect()`
 * in a page are both server-only features unsupported by static export, and
 * a `<meta http-equiv="refresh">` would need to be basePath-aware (GitHub
 * Pages serves under /hearfy/, see lib/asset.ts) for a target that is just
 * the sibling page below. Rendering the same tree at both routes needs none
 * of that and works identically in `next dev` and the exported build.
 */
export default function Page() {
  return (
    <StoryProvider>
      <DemoShell />
    </StoryProvider>
  );
}
