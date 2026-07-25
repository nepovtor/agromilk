import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    fileParallelism: false,
    coverage: {
      provider: "v8",
      exclude: ["src/**/*.test.ts", "src/test/**", "src/server.ts", "src/scripts/**"],
      thresholds: { statements: 75, branches: 65, functions: 75, lines: 75 },
    },
  },
});
