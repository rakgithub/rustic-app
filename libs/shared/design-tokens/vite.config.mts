import { defineConfig } from "vite";
import { nxViteTsPaths } from "@nx/vite/plugins/nx-tsconfig-paths.plugin";

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: "../../../node_modules/.vite/libs/shared/design-tokens",
  plugins: [nxViteTsPaths()],
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
