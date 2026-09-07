import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nxCopyAssetsPlugin } from "@nx/vite/plugins/nx-copy-assets.plugin";
export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: "../../../node_modules/.vite/libs/commerce/feature-checkout",
  resolve: { tsconfigPaths: true },
  plugins: [react(), nxCopyAssetsPlugin(["*.md"])],
  // Uncomment this if you are using workers.
  // worker: {
  //   plugins: () => [],
  // },
  test: {
    name: "feature-checkout",
    watch: false,
    globals: true,
    environment: "jsdom",
    include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    reporters: ["default"],
    coverage: {
      reportsDirectory: "../../../coverage/libs/commerce/feature-checkout",
      provider: "v8" as const,
    },
  },
}));
