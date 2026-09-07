import { defineConfig } from "vite";

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: "../../../node_modules/.vite/libs/shared/design-tokens",
  resolve: { tsconfigPaths: true },
  test: {
    name: "design-tokens",
    watch: false,
    globals: true,
    environment: "jsdom",
    include: ["src/**/*.{test,spec}.{ts,mts,cts}"],
    reporters: ["default"],
    coverage: {
      reportsDirectory: "../../../coverage/libs/shared/design-tokens",
      provider: "v8" as const,
    },
  },
}));
