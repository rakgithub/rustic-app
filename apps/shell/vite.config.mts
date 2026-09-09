import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { federation } from "@module-federation/vite";
import tailwindcss from "@tailwindcss/vite";

const PORT = 5100;

export default defineConfig({
  define: {
    __RUSTIC_API_BASE_URL__: JSON.stringify(
      process.env.VITE_API_BASE_URL ?? "http://localhost:3006",
    ),
  },
  server: {
    port: PORT,
    strictPort: true,
    host: "127.0.0.1",
  },
  preview: { port: PORT, strictPort: true },
  build: { target: "chrome89" },
  resolve: { tsconfigPaths: true },
  plugins: [
    federation({
      name: "shell",
      // No build-time `remotes:` block - the consumer registers them at
      // runtime in src/mf.ts at module load time.
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
