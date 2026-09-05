import { OpenAPIHono, z } from '@hono/zod-openapi';

const HealthResponseSchema = z
  .object({
    status: z.literal('ok'),
  })
  .openapi('HealthResponse');

export const app = new OpenAPIHono();

app.get('/health', (context) => context.json({ status: 'ok' as const }));

app.openAPIRegistry.registerPath({
  method: 'get',
  path: '/health',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: HealthResponseSchema,
        },
      },
      description: 'Confirms that the API is running',
    },
  },
});

app.doc('/openapi.json', {
  openapi: '3.1.0',
  info: {
    title: 'Rustic API',
    version: '1.0.0',
  },
});

export type App = typeof app;
