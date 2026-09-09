import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { federation } from "@module-federation/vite";
import tailwindcss from "@tailwindcss/vite";

// Port deliberately avoids 5000 (macOS AirTunes binds it on 0.0.0.0, leading
// to silent EADDRINUSE on 127.0.0.1). Override `--port` only if 5000+ is free.
const PORT = 5102;

export default defineConfig({
  define: {
    __RUSTIC_API_BASE_URL__: JSON.stringify(
      process.env.VITE_API_BASE_URL ?? "http://localhost:3006",
    ),
  },
  server: {
    port: PORT,
    strictPort: true,
    origin: `http://localhost:${PORT}`,
    host: "127.0.0.1",
    // Allow cross-origin fetches of mf-manifest.json + chunks from a consumer
    // running on a different port. Vite 8 narrows the default CORS allowlist
    // to specific localhost patterns; setting `cors: true` emits a wildcard
    // `Access-Control-Allow-Origin: *` for dev which is what federation needs.
    cors: true,
  },
  preview: { port: PORT, strictPort: true, cors: true },
  build: { target: "chrome89" },
  resolve: {
    alias: [
      {
        find: "ui/shadcn.css",
        replacement: fileURLToPath(new URL("../../libs/shared/ui/src/shadcn.css", import.meta.url)),
      },
      {
        find: /^ui$/,
        replacement: fileURLToPath(new URL("../../libs/shared/ui/src/index.ts", import.meta.url)),
      },
      {
        find: /^api-client$/,
        replacement: fileURLToPath(
          new URL("../../libs/shared/api-client/src/index.ts", import.meta.url),
        ),
      },
      {
        find: /^product-overview$/,
        replacement: fileURLToPath(
          new URL("../../libs/commerce/product-overview/product-overview.tsx", import.meta.url),
        ),
      },
      {
        find: /^product-list$/,
        replacement: fileURLToPath(
          new URL("../../libs/commerce/product-list/product-list.tsx", import.meta.url),
        ),
      },
      {
        find: /^add-product$/,
        replacement: fileURLToPath(
          new URL("../../libs/commerce/add-product/add-product.tsx", import.meta.url),
        ),
      },
    ],
  },
  plugins: [
    federation({
      name: "commerce",
      filename: "remoteEntry.js",
      exposes: {
        "./App": "./src/App.tsx",
      },
      shared: {
        react: { singleton: true, requiredVersion: "^19.0.0" },
        "react-dom": { singleton: true, requiredVersion: "^19.0.0" },
        "react-router-dom": {
          singleton: true,
          requiredVersion: "^7.18.3",
        },
      },
    }),
    react(),
    tailwindcss(),
  ],
});
