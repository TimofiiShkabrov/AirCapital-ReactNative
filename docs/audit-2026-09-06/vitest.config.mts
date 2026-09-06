import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["src/test/setup.ts"],
    include: ["docs/audit-2026-09-06/reproductions.test.ts"],
  },
});
