import { serve } from '@hono/node-server';
import { app } from './app.js';

const port = Number(process.env['PORT'] ?? 3333);

serve(
  {
    fetch: app.fetch,
    port,
  },
  ({ port: listeningPort }) => {
    console.log(`API listening on http://localhost:${listeningPort}`);
  },
);
