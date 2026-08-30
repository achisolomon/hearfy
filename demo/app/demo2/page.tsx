import { DemoShell } from "@/components/shell/demo-shell";
import { StoryProvider } from "@/components/shell/story-context";

/** Demo 2 — the four-persona app. */
export default function Page() {
  return (
    <StoryProvider>
      <DemoShell />
    </StoryProvider>
  );
}
