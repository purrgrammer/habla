import { defineConfig } from "vitest/config";

export default defineConfig({
  // Same as vite.config.ts: `~/` resolves from tsconfig natively now.
  resolve: { tsconfigPaths: true },
  test: {
    include: ["app/**/*.test.ts"],
  },
});
