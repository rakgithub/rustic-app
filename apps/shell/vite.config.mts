import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { federation } from '@module-federation/vite';

const PORT = 5100;

export default defineConfig({
  server: {
    port: PORT,
    strictPort: true,
    host: '127.0.0.1',
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3333',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  preview: { port: PORT, strictPort: true },
  build: { target: 'chrome89' },
  plugins: [
    federation({
      name: 'shell',
      // No build-time `remotes:` block - the consumer registers them at
      // runtime in src/mf.ts at module load time.
      shared: {
        react: { singleton: true, requiredVersion: '^19.0.0' },
        'react-dom': { singleton: true, requiredVersion: '^19.0.0' },
        'react-router-dom': {
          singleton: true,
          requiredVersion: '^7.18.3',
        },
      },
    }),
    react(),
  ],
});
