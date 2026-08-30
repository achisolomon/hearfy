import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Story logic is framework-free, so the default node environment is enough.
    environment: "node",
    include: ["lib/**/*.test.ts"],
    passWithNoTests: true,
  },
});
