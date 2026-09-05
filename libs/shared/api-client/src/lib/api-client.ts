import createClient from 'openapi-fetch';
import type { paths } from './generated';

export function createApiClient(baseUrl = '/api') {
  return createClient<paths>({ baseUrl });
}

export type ApiClient = ReturnType<typeof createApiClient>;

export const apiClient = createApiClient();
