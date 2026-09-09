# Rustic App frontend

Rustic App is a frontend-only microfrontend workspace built with Nx, React,
Vite, Module Federation, and pnpm. The shell composes independently deployable
Account and Commerce providers at runtime.

All application APIs are provided by a separately hosted backend. This repository
does not contain an API server, database, migrations, or server-side credentials.

## Architecture

```text
apps/
  shell       Shell consumer; loads federated providers at runtime
  account     Account provider
  commerce    Commerce provider
libs/
  shared/     Contracts, UI, API client, configuration, observability
  account/    Account feature and data-access libraries
  commerce/   Catalog, selling, and checkout feature libraries
```

`libs/shared/api-client` is the frontend API contract boundary. Regenerate its
types from the separately hosted backend's versioned OpenAPI document; never
import backend implementation code here.

## Get started

Prerequisites: Node.js 22 and pnpm 11.24.0.

```bash
pnpm install
cp .env.example .env
```

The local backend API must be running separately at `http://localhost:3006`.
This is configured by default in `.env.example`:

```text
VITE_API_BASE_URL=http://localhost:3006
```

Run each frontend in a separate terminal:

```bash
pnpm exec nx serve shell
pnpm exec nx serve account
pnpm exec nx serve commerce
```

| Service                   | Local URL               |
| ------------------------- | ----------------------- |
| Shell                     | `http://localhost:5100` |
| Account provider          | `http://localhost:5101` |
| Commerce provider         | `http://localhost:5102` |
| API (separate repository) | `http://localhost:3006` |

## Common commands

```bash
pnpm exec nx run-many -t build -p shell account commerce
pnpm exec nx affected -t lint,test,build --base=origin/main --head=HEAD
node tools/scripts/typecheck.mjs
pnpm exec nx e2e shell
pnpm exec nx run shell:federation-smoke
pnpm run bundle:check
```

## Deployment

Set `VITE_API_BASE_URL` to the public HTTPS backend URL for each preview and
production frontend deployment. It is public configuration and must never hold
credentials. The backend must explicitly allow the deployed shell, account, and
commerce origins through CORS.

The shell also needs these remote URLs:

```text
ACCOUNT_REMOTE_URL=https://<account-provider-host>
COMMERCE_REMOTE_URL=https://<commerce-provider-host>
```

## Documentation

- [Frontend-only extraction plan](docs/frontend-only-extraction.md)

## License

Private and proprietary unless a license is added to this repository.
