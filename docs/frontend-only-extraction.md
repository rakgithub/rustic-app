# Frontend-only extraction plan

## Goal

Turn this repository into a frontend microfrontend workspace. The API, database,
authentication implementation, migrations, and server-side upload-token issuance
will live in a separate backend repository and deployment.

The frontend will continue to call the backend through a public HTTPS API. It must
not contain database credentials, session secrets, storage write tokens, or any
server-side business logic.

For local development, every microfrontend must use the separately hosted API at
`http://localhost:3006`. This is the single development origin for all API
endpoints; do not run or reintroduce an API application in this repository.

## Removed backend inventory

The following backend assets have been removed from this repository. They must be
maintained in the separately hosted backend repository instead:

| Area                              | Paths                                                                                                                                                                                                                                   |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Local API application             | `apps/api-dev/`                                                                                                                                                                                                                         |
| Backend modules                   | `libs/backend/` (`auth`, `catalog`, `database`, `orders`, `wallet`)                                                                                                                                                                     |
| Database migrations               | `drizzle/` and `drizzle.config.ts`                                                                                                                                                                                                      |
| Database environment template     | `DATABASE_URL`, `DIRECT_DATABASE_URL`, and `TEST_DATABASE_URL` in `.env.example`                                                                                                                                                        |
| Backend operational documentation | `docs/runbooks/database-restore.md`, `docs/runbooks/failed-migration.md`, `docs/runbooks/wallet-invariant-failure.md`, `docs/runbooks/blob-upload-abuse.md`, `docs/runbooks/login-outage.md`, and `docs/runbooks/remote-unavailable.md` |

Also update or remove backend-specific content in `README.md`,
`docs/enterprise-microfrontend-plan.md`, and `docs/technical-implementation-guide.md`.

## Frontend API configuration

1. `libs/shared/api-client/src/lib/api-client.ts` uses a browser-safe build-time
   API origin with a `http://localhost:3006` fallback.
2. The shell no longer proxies `/api` requests; all microfrontends call the
   separately hosted API directly.
3. The product upload-token URL derives from the same API configuration.
4. Keep `libs/shared/api-client/` in this repository as the frontend contract
   boundary. Regenerate `generated.ts` from the backend's versioned OpenAPI
   document whenever the API changes, rather than importing backend code.
5. Confirm the backend permits the shell, account, and commerce deployment origins
   with CORS. If authentication uses cookies, configure credentialed CORS,
   `SameSite=None; Secure` cookies, and `credentials: 'include'` intentionally.
   Prefer a shared parent domain or an approved BFF/edge proxy where feasible.
6. Decide how the frontend receives the authenticated user identity. The current
   contract sends `x-user-id`; a public frontend must not treat that header as
   trustworthy. The new backend should derive identity from a validated session or
   bearer token.

The completed changes replaced the hard-coded default API base URL in
`libs/shared/api-client/src/lib/api-client.ts` (`/api`) with a browser-safe
configuration value, such as `VITE_API_BASE_URL`. Use
`VITE_API_BASE_URL=http://localhost:3006` locally.

## Package and Nx cleanup

After removing the backend source, remove these root dependencies if they are not
used elsewhere:

- Runtime: `@hono/node-server`, `@hono/zod-openapi`, `@node-rs/argon2`,
  `drizzle-orm`, `hono`, and `postgres`.
- Development: `@nx/esbuild`, `@nx/node`, `drizzle-kit`, and `testcontainers`.

Then update `package.json`, `pnpm-lock.yaml`, `tsconfig.base.json`, and
`tools/scripts/typecheck.mjs` to remove the backend scripts, path aliases, and
projects. Verify no remaining frontend project imports a `libs/backend` module.

## Deployment changes

- Remove backend-only Vercel environment variables from this frontend project:
  `DATABASE_URL`, `DIRECT_DATABASE_URL`, `TEST_DATABASE_URL`, `SESSION_SECRET`,
  and `BLOB_READ_WRITE_TOKEN`.
- Add `VITE_API_BASE_URL` to each frontend deployment environment. It is public,
  so never place secrets in it. Use `http://localhost:3006` for local development
  and the separately deployed HTTPS API URL for preview and production.
- Update the frontend Content Security Policy `connect-src` in `vercel.json` to
  allow the exact backend API origin. Do not use a broad wildcard for the API.
- Configure CORS, authentication, rate limits, upload-token issuance, and storage
  credentials only in the backend deployment.

## Safe extraction order

1. Create the backend repository and move/copy the API, backend libraries, Drizzle
   schema/migrations, and server-only environment configuration into it.
2. Deploy a non-production backend and publish its OpenAPI document.
3. Point a frontend preview at that API using `VITE_API_BASE_URL`; exercise product
   listing, product creation, upload, publishing, purchase, and error states.
4. Configure production API origin, CORS, authentication, and CSP.
5. Remove the backend inventory from this repository and regenerate the lockfile.
6. Run `pnpm exec nx run-many -t build test` and the shell end-to-end tests using
   the separately deployed API (or an explicit test API environment).

## Completion checks

- No `apps/api-dev`, `libs/backend`, `drizzle`, or `drizzle.config.ts` remains.
- `rg -n "DATABASE_URL|DIRECT_DATABASE_URL|TEST_DATABASE_URL|drizzle|postgres"`
  produces no frontend runtime references.
- All microfrontends obtain their API origin from one documented public setting.
- Local shell, account, and commerce development all call
  `http://localhost:3006`; no frontend starts an API server.
- Browser requests succeed against the external API and are accepted only from
  approved origins.
- No credential or database setting is exposed in a `VITE_*` environment variable.
