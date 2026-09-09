import createClient from "openapi-fetch";
import type { paths } from "./generated";

declare const __RUSTIC_API_BASE_URL__: string | undefined;

export const apiBaseUrl =
  typeof __RUSTIC_API_BASE_URL__ === "string" ? __RUSTIC_API_BASE_URL__ : "http://localhost:3006";

export function createApiClient(baseUrl = apiBaseUrl) {
  return createClient<paths>({ baseUrl });
}

export function apiUrl(path: string): string {
  return new URL(path, `${apiBaseUrl}/`).toString();
}

export type ApiClient = ReturnType<typeof createApiClient>;

export const apiClient = createApiClient();
