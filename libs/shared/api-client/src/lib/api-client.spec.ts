import { describe, expect, it } from 'vitest';
import { apiClient, createApiClient } from './api-client';

describe('API client', () => {
  it('creates a client with typed HTTP methods', () => {
    const client = createApiClient('http://localhost:3333');

    expect(client.GET).toBeTypeOf('function');
  });

  it('exports the browser client', () => {
    expect(apiClient.GET).toBeTypeOf('function');
  });
});
