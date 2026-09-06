# Rustic App

Rustic App is a marketplace monorepo built with Nx, React, Vite, Module
Federation, Hono, Drizzle ORM, PostgreSQL, and pnpm.

The browser experience is composed from independently deployable frontend
applications. The shell owns the top-level page and runtime remote registry;
Account and Commerce are federated providers.

## What it does

Rustic App lets users browse a product catalog, create and publish listings
with images, manage an account, and purchase products with a simulated wallet.
Each purchase is handled atomically: it transfers funds, marks the product as
sold, and records balanced ledger entries. The Account and Commerce user
experiences can be built and deployed independently while the shell composes
them at runtime.

## Architecture

```text
apps/
  shell       Shell consumer; loads federated providers at runtime
  account     Account provider
  commerce    Commerce provider
  api-dev     Hono API
libs/
  shared/     Contracts, UI, API client, configuration, observability
  account/    Account feature and data-access libraries
  commerce/   Catalog, selling, and checkout feature libraries
  backend/    Database, catalog, wallet, order, and authentication modules
```

`libs/shared/contracts` is the shared API/domain boundary. `libs/shared/ui` is
the shared design-system location; reusable Shadcn UI component source belongs
there, not in each application.

## Prerequisites

- Node.js 22 (the version used by CI)
- pnpm 11.24.0 (pinned in `package.json`)
- A PostgreSQL database: local Docker PostgreSQL or Supabase

## Get started

```bash
pnpm install
cp .env.example .env
```

Fill in the database and session values in `.env`:

```text
DATABASE_URL=
DIRECT_DATABASE_URL=
TEST_DATABASE_URL=
SESSION_SECRET=
BLOB_READ_WRITE_TOKEN=
```

Generate and apply database migrations:

```bash
pnpm db:generate
pnpm db:migrate
```

Run each local process in a separate terminal:

```bash
pnpm exec nx serve api-dev
pnpm exec nx serve shell
pnpm exec nx serve account
pnpm exec nx serve commerce
```

| Service           | Local URL               |
| ----------------- | ----------------------- |
| Shell             | `http://localhost:5100` |
| Account provider  | `http://localhost:5101` |
| Commerce provider | `http://localhost:5102` |
| API               | `http://localhost:3333` |

The shell reads its local runtime registry from
`apps/shell/public/remotes.json`, then loads each provider's `remoteEntry.js`.
The shell proxies browser `/api` requests to the local Hono API.

## Common commands

```bash
# Inspect projects and their targets
pnpm exec nx show projects
pnpm exec nx show project shell

# Build the composed frontend
pnpm exec nx run-many -t build -p shell account commerce

# Check formatting, linting, types, tests, and federation
pnpm exec nx format:check
pnpm exec nx affected -t lint,test,build --base=origin/main --head=HEAD
node tools/scripts/typecheck.mjs
pnpm exec nx e2e shell
pnpm exec nx run shell:federation-smoke

# Database
pnpm db:check
pnpm db:generate
pnpm db:migrate

# Production readiness checks
pnpm audit --prod --audit-level=high
pnpm run bundle:check
```

To see what a branch affects before opening a pull request:

```bash
pnpm exec nx show projects --affected --base=origin/main --head=HEAD
```

## Deployment

Vercel deploys three projects from this repository:

| Project           | Root directory  | Build command              | Output directory  |
| ----------------- | --------------- | -------------------------- | ----------------- |
| `market-shell`    | repository root | `pnpm exec nx build shell` | `apps/shell/dist` |
| `market-account`  | `apps/account`  | `pnpm run build`           | `dist`            |
| `market-commerce` | `apps/commerce` | `pnpm run build`           | `dist`            |

The shell build generates `remotes.json` from provider URLs. Set these regular
(non-secret) environment variables on the **market-shell** Vercel project for
both Preview and Production:

```text
ACCOUNT_REMOTE_URL=https://<account-provider-host>
COMMERCE_REMOTE_URL=https://<commerce-provider-host>
```

Do not include `/remoteEntry.js`; the build script appends it. Keep
`DATABASE_URL`, `DIRECT_DATABASE_URL`, `TEST_DATABASE_URL`, and
`SESSION_SECRET` secret and server-side only.

Before deploying the shell, replace the related-project ID placeholders in
`vercel.json` with the Vercel project IDs for Account and Commerce.

## Documentation

- [Technical implementation guide](docs/technical-implementation-guide.md)
- [Enterprise microfrontend plan](docs/enterprise-microfrontend-plan.md)
- [Operational runbooks](docs/runbooks/)
- [Architecture decisions](docs/adr/)

## License

Private and proprietary unless a license is added to this repository.
