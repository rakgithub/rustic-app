# Technical implementation guide

Companion to: [Enterprise microfrontend plan](./enterprise-microfrontend-plan.md)  
Baseline: Nx 23.2, React 19.2, TypeScript 6, Vite 8, Node 24 LTS, pnpm  
Architecture: shell consumer + account provider + commerce provider + modular API

## How to use this guide

Run commands from the repository root unless a phase says otherwise. Commands containing `<...>` require a real value. Commit after every phase so that each phase is independently reviewable and reversible.

Every command is explained where it is introduced, and the consolidated [command-by-command reference](#command-by-command-reference) near the end explains the purpose and practical benefit of each command without requiring you to infer unfamiliar CLI syntax.

The commands use Nx 23's `consumer` and `provider` terminology. Do not substitute older tutorials using `@nx/react:host` or `@nx/react:remote`; those generators are deprecated in Nx 23.

Before executing a generator, inspect its installed options:

```bash
pnpm exec nx g @nx/react:consumer --help
pnpm exec nx g @nx/react:provider --help
```

Patch releases occasionally rename secondary flags. The architecture and generator names are the stable part of this guide.

## Phase 0 — Prerequisites and decisions

### Goal

Install a reproducible runtime and document the decisions that should not be hidden inside code.

### Verify local tools

```bash
node --version
pnpm --version
git --version
docker --version
```

Expected baseline:

```text
Node.js: 24.x LTS
pnpm: pinned in package.json
Git: recent supported version
Docker: required for a local PostgreSQL integration-test database
```

Use a Node version manager and add this file:

```text
.nvmrc
24
```

Pin pnpm in the root `package.json` after initialization:

```json
{
  "packageManager": "pnpm@<exact-version>",
  "engines": {
    "node": ">=24 <25"
  }
}
```

The exact package-manager version plus `pnpm-lock.yaml` gives developers and CI the same dependency graph.

### Create initial architecture records

```bash
mkdir -p docs/adr docs/runbooks
touch docs/adr/0001-use-module-federation.md
touch docs/adr/0002-domain-provider-boundaries.md
touch docs/adr/0003-session-authentication.md
touch docs/adr/0004-simulated-wallet-ledger.md
touch docs/adr/0005-vercel-deployment-topology.md
```

Each ADR should contain: context, decision, alternatives, consequences, and a review date.

### Exit check

- Node and pnpm versions are pinned.
- The five architecture decisions exist as ADRs.
- The MVP exclusions are copied from the architecture plan.

## Phase 1 — Initialize Nx and Module Federation

### Goal

Create the workspace and the smallest composed system: one consumer and two independently runnable providers.

### Initialize Nx in this repository

The repository already contains documentation, so initialize Nx in place rather than creating another directory:

```bash
pnpm init
pnpm add --save-dev nx@23.2.0 @nx/workspace@23.2.0
pnpm exec nx init
pnpm exec nx add @nx/react@23.2.0
```

After installation, update all Nx packages together to the latest compatible 23.2 patch and commit the resulting lockfile. All `nx` and `@nx/*` packages should remain on the same version.

### Generate the consumer and providers

```bash
pnpm exec nx g @nx/react:consumer apps/shell \
  --bundler=vite \
  --providerNames=account,commerce
```

This produces:

```text
apps/shell       Module Federation consumer
apps/account     Module Federation provider
apps/commerce    Module Federation provider
```

Nx configures each provider to expose `./App`. Keep that as the initial public federation contract.

### Install application libraries

```bash
pnpm add react-router-dom @tanstack/react-query react-hook-form zod
pnpm add --save-dev @testing-library/react @testing-library/user-event msw
```

Use the shell for the top-level browser router. Providers render below shell-owned routes and must not create another `BrowserRouter` when composed.

### Run the generated system

Open separate terminals:

```bash
pnpm exec nx serve shell
```

```bash
pnpm exec nx serve account
```

```bash
pnpm exec nx serve commerce
```

Nx 23 provider development tasks can start their consumer dependency automatically. Running them separately is useful initially because the ports and failure behavior stay visible.

### Verify the workspace

```bash
pnpm exec nx show projects
pnpm exec nx graph
pnpm exec nx run-many -t build --projects=shell,account,commerce
```

### Exit check

- Shell loads both provider applications.
- Each provider works standalone.
- Stopping one provider produces a controlled error boundary rather than a blank page.
- All three production builds pass.

## Phase 2 — Create libraries and enforce boundaries

### Goal

Turn architectural diagrams into rules that fail during development and CI.

### Generate shared libraries

```bash
pnpm exec nx g @nx/react:library libs/shared/ui \
  --bundler=none \
  --unitTestRunner=vitest \
  --tags=scope:shared,type:ui

pnpm exec nx g @nx/js:library libs/shared/contracts \
  --unitTestRunner=vitest \
  --tags=scope:shared,type:contract

pnpm exec nx g @nx/js:library libs/shared/api-client \
  --unitTestRunner=vitest \
  --tags=scope:shared,type:data-access

pnpm exec nx g @nx/js:library libs/shared/config \
  --unitTestRunner=vitest \
  --tags=scope:shared,type:util

pnpm exec nx g @nx/js:library libs/shared/observability \
  --unitTestRunner=vitest \
  --tags=scope:shared,type:util
```

### Generate domain libraries

```bash
pnpm exec nx g @nx/react:library libs/account/feature-auth \
  --bundler=none --unitTestRunner=vitest \
  --tags=scope:account,type:feature

pnpm exec nx g @nx/js:library libs/account/data-access \
  --unitTestRunner=vitest \
  --tags=scope:account,type:data-access

pnpm exec nx g @nx/react:library libs/commerce/feature-catalog \
  --bundler=none --unitTestRunner=vitest \
  --tags=scope:commerce,type:feature

pnpm exec nx g @nx/react:library libs/commerce/feature-selling \
  --bundler=none --unitTestRunner=vitest \
  --tags=scope:commerce,type:feature

pnpm exec nx g @nx/react:library libs/commerce/feature-checkout \
  --bundler=none --unitTestRunner=vitest \
  --tags=scope:commerce,type:feature

pnpm exec nx g @nx/js:library libs/commerce/data-access \
  --unitTestRunner=vitest \
  --tags=scope:commerce,type:data-access
```

The applications should mostly compose feature libraries. This keeps application entry points thin and makes Nx's project graph meaningful.

### Tag deployable applications

Add these tags to each generated application's `package.json` or `project.json`:

```text
shell:    scope:shell, type:app
account:  scope:account, type:app
commerce: scope:c, type:app
```

### Configure module-boundary rules

Add `@nx/enforce-module-boundaries` to the root ESLint flat configuration. The policy should enforce:

```text
scope:account  -> scope:account | scope:shared
scope:commerce -> scope:commerce | scope:shared
scope:shell    -> scope:shell | scope:shared
scope:shared   -> scope:shared
type:ui        -> type:ui | type:util | type:contract
type:data-access -> type:data-access | type:util | type:contract
```

Also enable `enforceBuildableLibDependency` and ban imports from one provider application into another.

### Verify the boundary

```bash
pnpm exec nx run-many -t lint
```

Temporarily import commerce code from account, confirm lint fails, and then remove the invalid import. This is an architecture fitness test, not just a configuration check.

### Exit check

- Apps contain composition rather than most business code.
- Provider-to-provider imports fail lint.
- Shared libraries cannot import domain code.
- Every library exports a deliberate public API from its root entry point.

## Phase 3 — Runtime federation and shell platform services

### Goal

Replace development-only remote addresses with an environment-specific runtime registry and add failure isolation.

### Files to introduce

```text
apps/shell/public/remotes.json
apps/shell/src/platform/load-remotes.ts
apps/shell/src/platform/provider-boundary.tsx
apps/shell/src/platform/session-provider.tsx
libs/shared/contracts/src/lib/platform-contract.ts
```

Example local `remotes.json`:

```json
{
  "account": {
    "name": "account",
    "entry": "http://localhost:5101/remoteEntry.js"
  },
  "commerce": {
    "name": "commerce",
    "entry": "http://localhost:5102/remoteEntry.js"
  }
}
```

At shell startup:

1. Fetch and validate `remotes.json` with Zod.
2. Reject non-HTTPS URLs outside local development.
3. Call Module Federation `registerRemotes`.
4. Load each provider with `React.lazy`/`loadRemote`.
5. Render each provider inside `Suspense` and a provider-specific error boundary.

### Configure shared dependencies

In all three Vite federation configurations, explicitly share only:

```text
react
react-dom
react-router-dom
```

Configure them as singletons with matching required versions. Do not share Zod, forms, query libraries, or design-system code until bundle analysis demonstrates a real reason.

### Shell routes

```text
/register, /login, /account          -> account/App
/, /products/*, /sell                -> commerce/App
/checkout/*, /orders, /wallet        -> commerce/App
/error, /maintenance, *              -> shell
```

### Verification commands

```bash
pnpm exec nx build account
pnpm exec nx build commerce
pnpm exec nx build shell
```

Then verify both entry files are produced:

```bash
find apps -path '*/dist/remoteEntry.js' -print
```

If the generator uses a workspace-level output directory, inspect the build target and replace the path accordingly:

```bash
pnpm exec nx show project account
pnpm exec nx show project commerce
```

### Exit check

- Remote URLs come from runtime configuration.
- Production configuration accepts only allowlisted HTTPS origins.
- Only three dependencies are shared as singletons.
- Remote load failures include provider name, version, URL, and support/request ID.

## Phase 4 — API and PostgreSQL foundation

### Goal

Create one modular API, a real integration-test database, migrations, and a generated client contract.

### Add the Node application and backend libraries

```bash
pnpm exec nx add @nx/node@23.2.0
pnpm exec nx g @nx/node:application apps/api-dev --bundler=esbuild

pnpm exec nx g @nx/js:library libs/backend/database \
  --unitTestRunner=vitest \
  --tags=scope:backend,type:data-access

pnpm exec nx g @nx/js:library libs/backend/auth \
  --unitTestRunner=vitest \
  --tags=scope:backend,type:feature

pnpm exec nx g @nx/js:library libs/backend/catalog \
  --unitTestRunner=vitest \
  --tags=scope:backend,type:feature

pnpm exec nx g @nx/js:library libs/backend/orders \
  --unitTestRunner=vitest \
  --tags=scope:backend,type:feature

pnpm exec nx g @nx/js:library libs/backend/wallet \
  --unitTestRunner=vitest \
  --tags=scope:backend,type:feature
```

### Install API and database dependencies

```bash
pnpm add hono @hono/node-server @hono/zod-openapi zod
pnpm add drizzle-orm postgres
pnpm add @node-rs/argon2
pnpm add --save-dev drizzle-kit testcontainers openapi-typescript openapi-fetch
```

`apps/api-dev` starts the same Hono application used by the production Vercel adapter. The production file `api/[...route].ts` should contain only adapter/bootstrap code and import the backend composition root.

### Local database

Add a `compose.yaml` containing PostgreSQL, then run:

```bash
docker compose up -d postgres
docker compose ps
```

Use separate databases or schemas for development and tests. Never run tests against the development or production database.

Example local environment names:

```text
DATABASE_URL=postgres://app:app@localhost:5432/marketplace_dev
TEST_DATABASE_URL=postgres://app:app@localhost:5432/marketplace_test
SESSION_SECRET=<at-least-32-random-bytes>
```

Do not commit their values. Commit an `.env.example` containing names and descriptions only.

### Create and run migrations

Add root scripts that invoke `drizzle-kit`, then use:

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:check
```

The first migration should create users, sessions, products, product images, orders, wallet accounts, ledger transactions, ledger entries, and audit events.

### Run the API

```bash
pnpm exec nx serve api-dev
curl --fail http://localhost:3333/health
curl --fail http://localhost:3333/openapi.json
```

Configure the shell development server to proxy `/api` to port `3333`. Providers should always call relative `/api/...` URLs rather than knowing the backend hostname.

### Generate the client

```bash
pnpm exec openapi-typescript \
  http://localhost:3333/openapi.json \
  --output libs/shared/api-client/src/lib/generated.ts
```

Commit the OpenAPI document and generated client. CI should regenerate and fail when there is an uncommitted difference.

### Exit check

- Migrations apply to an empty database.
- `/health` and `/openapi.json` respond successfully.
- Frontend code uses the generated client rather than handwritten response types.
- Frontend libraries cannot import backend implementation code.

## Phase 5 — Account vertical slice

### Goal

Deliver registration, login, logout, session bootstrap, and protected routes end to end.

### API endpoints

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/session
GET  /api/auth/csrf
```

### Implementation order

1. Normalize and uniquely constrain email addresses.
2. Hash passwords with Argon2id.
3. Create opaque server sessions; store only a hash of the session token.
4. Set a `Secure`, `HttpOnly`, `SameSite`, `Path=/` session cookie.
5. Require a CSRF token for state-changing authenticated requests.
6. Add per-IP and per-account login/register rate limits.
7. Bootstrap session state once in the shell and pass a stable session interface to providers.
8. Implement account routes and accessible forms.

### Targeted test commands

```bash
pnpm exec nx test backend-auth
pnpm exec nx test account-data-access
pnpm exec nx test account-feature-auth
pnpm exec nx build account
```

Use the exact project names returned by `pnpm exec nx show projects`; generator naming can include directory prefixes.

### Required negative tests

- Duplicate email.
- Invalid credentials without revealing whether an account exists.
- Expired and revoked sessions.
- Missing/invalid CSRF token.
- Login rate limit.
- Session cookie cannot be read from browser JavaScript.

### Exit check

Account works standalone with mocks and composed with the real API. Refreshing the page preserves a valid session, logout revokes it, and protected routes redirect safely.

## Phase 6 — Listings and product images

### Goal

Let one user publish a product and another user browse it.

### API endpoints

```text
GET    /api/products
GET    /api/products/:productId
POST   /api/products
PATCH  /api/products/:productId
POST   /api/products/:productId/publish
DELETE /api/products/:productId
POST   /api/uploads/product-image-token
GET    /api/me/products
```

### Add Blob storage

```bash
pnpm add @vercel/blob
pnpm exec vercel env pull .env.local
```

Use browser-to-Blob client uploads. The API issues a short-lived upload token after authenticating the user and validating filename, content type, and size. Store only the verified Blob metadata in PostgreSQL.

### Implementation order

1. Product draft with server-side owner and price validation.
2. Direct image upload and ordered product-image records.
3. Publish transition only when required fields and at least one image are valid.
4. Public paginated list and product detail.
5. Seller-only edit/remove operations with object-level authorization.
6. Loading, empty, error, retry, and responsive states.

### Verification commands

```bash
pnpm exec nx test backend-catalog
pnpm exec nx test commerce-feature-catalog
pnpm exec nx test commerce-feature-selling
pnpm exec nx build commerce
```

### Exit check

- Seller ownership is checked in the API for every mutation.
- Product price is stored as integer minor units plus currency.
- Image upload bypasses the Function request-body path.
- Catalog pagination is stable and deterministic.

## Phase 7 — Simulated wallet and atomic purchase

### Goal

Implement the highest-risk workflow with database guarantees rather than client-side assumptions.

### API endpoints

```text
GET  /api/wallet
GET  /api/wallet/transactions
POST /api/dev/wallet/top-up       development/test only
POST /api/products/:productId/purchase
GET  /api/orders
GET  /api/orders/:orderId
```

### Purchase transaction requirements

Inside one PostgreSQL transaction:

```text
validate session and idempotency key
lock product and wallet rows
verify active product, buyer != seller, matching currency, sufficient balance
create order from server-side product price
mark product sold
append balanced buyer-debit and seller-credit ledger entries
commit everything or roll back everything
```

The client sends a product ID and idempotency key. It does not send the authoritative price, seller, balance, or ledger amounts.

### Required tests

```bash
pnpm exec nx test backend-wallet
pnpm exec nx test backend-orders
pnpm exec nx test commerce-feature-checkout
```

Add database integration tests for:

- Same idempotency key submitted twice.
- Two buyers purchasing the same product concurrently.
- Insufficient funds.
- Seller attempting to buy their own product.
- Failure after order creation but before ledger insert.
- Every ledger transaction sums to zero.

### Exit check

- One product can produce at most one successful order.
- Ledger entries are append-only.
- Retrying after a network timeout returns the original result.
- Wallet balance and order history agree after every tested failure.

## Phase 8 — Test infrastructure

### Goal

Cover public contracts and risky journeys without creating slow duplicate test suites.

### Add Playwright

```bash
pnpm exec nx add @nx/playwright@23.2.0
pnpm exec nx g @nx/playwright:configuration --project=shell
pnpm exec playwright install --with-deps chromium
```

Inspect the generator help if the configuration target name differs:

```bash
pnpm exec nx g @nx/playwright:configuration --help
```

### Add Storybook to shared UI

```bash
pnpm exec nx add @nx/storybook@23.2.0
pnpm exec nx g @nx/react:storybook-configuration shared-ui
pnpm exec nx storybook shared-ui
```

### Test commands

```bash
pnpm exec nx run-many -t test
pnpm exec nx e2e shell-e2e
pnpm exec nx run-many -t lint,typecheck,build
```

### Federation contract smoke test

Create an Nx target that:

1. Fetches each `remoteEntry.js`.
2. Verifies HTTP 200 and JavaScript content type.
3. Loads `account/App` and `commerce/App` in a browser.
4. Confirms the provider version metadata.
5. Compiles generated remote declarations.
6. Fails on incompatible React or router singleton versions.

Run it with:

```bash
pnpm exec nx run shell:federation-smoke
```

### Critical composed journey

```text
register seller
top up buyer in test setup
seller publishes product
buyer logs in
buyer purchases product
assert product sold
assert buyer debit and seller credit
```

### Exit check

- Critical Chromium E2E is reliable locally.
- Account and commerce provider failures are explicitly tested.
- API integration tests use real PostgreSQL.
- Shared UI has keyboard and accessibility-focused component tests.

## Phase 9 — GitHub Actions and Nx caching

### Goal

Run only necessary work while keeping all merge gates deterministic.

### Connect Nx Cloud

```bash
pnpm exec nx connect
```

Use read-only cache access for untrusted pull requests and write access only for trusted branches. Do not configure the obsolete `@vercel/remote-nx` task runner.

### Core CI commands

```bash
pnpm install --frozen-lockfile
pnpm exec nx format:check
pnpm exec nx affected -t lint,typecheck,test,build --parallel=3
pnpm exec nx affected -t federation-smoke
```

GitHub checkout must fetch full history so Nx can calculate the correct base and head:

```yaml
- uses: actions/checkout@v7
  with:
    fetch-depth: 0
```

Use the current supported major or a reviewed commit SHA for every action. Pin third-party actions rather than using moving `main` tags.

### Required workflows

```text
ci.yml                  format, boundaries, typecheck, unit, build
security.yml            dependency review, CodeQL, secret scanning
database.yml            migration and database integration tests
preview-e2e.yml         composed tests after Vercel preview readiness
nightly.yml             Chromium + Firefox + WebKit, resilience tests
```

### Branch protection

Require:

```text
quality
unit
build
security
database
preview-e2e
```

### Exit check

- A documentation-only change does not rebuild every application.
- A shared-contract change rebuilds/tests all affected consumers.
- A provider contract break fails before merge.
- Untrusted PRs cannot write to the shared cache or access production secrets.

## Phase 10 — Vercel projects and preview composition

### Goal

Deploy the shell and providers independently while testing the exact set of preview artifacts together.

### Install and authenticate the CLI

```bash
pnpm add --save-dev vercel
pnpm exec vercel login
pnpm exec vercel link --repo
```

Use Vercel Git integration for composed previews. Related Projects does not support CLI-created deployments.

### Create three projects

Import the same Git repository three times in Vercel:

| Project | Root directory | Build command | Output directory |
|---|---|---|---|
| `market-shell` | repository root | `pnpm exec nx build shell` | inspect `nx show project shell` |
| `market-account` | `apps/account` | package build script | `dist` |
| `market-commerce` | `apps/commerce` | package build script | `dist` |

Do not guess output paths. Confirm them after a local production build:

```bash
pnpm exec nx build shell
pnpm exec nx build account
pnpm exec nx build commerce
pnpm exec nx show project shell
pnpm exec nx show project account
pnpm exec nx show project commerce
```

The shell project stays rooted at the repository root so Vercel can detect the root `api/` Function adapter. Provider projects can use their application directories as roots.

### Connect related providers

Add both provider project IDs to the shell project's `vercel.json`:

```json
{
  "relatedProjects": [
    "<ACCOUNT_VERCEL_PROJECT_ID>",
    "<COMMERCE_VERCEL_PROJECT_ID>"
  ]
}
```

Add `@vercel/related-projects` to generate the shell's preview remote map:

```bash
pnpm add @vercel/related-projects
```

Create `tools/scripts/generate-remotes.mjs`. It should use related preview hosts when available and fall back to explicit production variables:

```text
ACCOUNT_REMOTE_URL
COMMERCE_REMOTE_URL
```

Add remote CORS headers for `remoteEntry.js` and generated chunks. Remote assets do not receive credentials; API calls execute from the shell page and use relative same-origin `/api` requests.

### Add environment variables

```bash
pnpm exec vercel env add DATABASE_URL production
pnpm exec vercel env add SESSION_SECRET production
pnpm exec vercel env add ACCOUNT_REMOTE_URL production
pnpm exec vercel env add COMMERCE_REMOTE_URL production
pnpm exec vercel env pull .env.local
```

Repeat sensitive values for Preview using preview-specific resources. Never connect arbitrary pull requests to the production database.

### Cache rules

```text
remoteEntry.js:   Cache-Control: no-cache
mf-manifest.json: Cache-Control: no-cache
hashed chunks:    Cache-Control: public, max-age=31536000, immutable
```

### Deployment sequence

```text
push branch
-> Vercel builds account and commerce previews
-> shell build receives related project hosts
-> generate remotes.json
-> shell preview deploys
-> GitHub preview-e2e tests the composed URL
-> required check passes
-> merge to main
-> providers promote before shell remote map
```

### Exit check

- Every pull request has one composed shell preview.
- Preview shell loads the matching provider previews or a declared fallback.
- Production uses stable provider aliases.
- Restoring the previous remote map rolls back federation without rebuilding provider code.

## Phase 11 — Production readiness

### Goal

Make failures observable, recoverable, and safe to operate.

### Security and dependency checks

```bash
pnpm audit --prod
pnpm exec nx run-many -t lint,typecheck,test,build
```

Also enable GitHub dependency review, Dependabot, CodeQL, secret scanning, and protected environments.

### Performance inspection

```bash
pnpm exec nx build shell
pnpm exec nx build account
pnpm exec nx build commerce
```

Record gzip sizes for the shell bootstrap and each provider. Fail CI when a change exceeds the agreed budget without an approved explanation.

### Operational runbooks

Create and rehearse:

```text
docs/runbooks/remote-unavailable.md
docs/runbooks/login-outage.md
docs/runbooks/failed-migration.md
docs/runbooks/wallet-invariant-failure.md
docs/runbooks/blob-upload-abuse.md
docs/runbooks/vercel-rollback.md
docs/runbooks/database-restore.md
```

### Release rehearsal

1. Disable the account provider and verify commerce/public shell behavior.
2. Point the shell at a missing remote entry and verify the fallback.
3. Deploy a backward-compatible provider change before the shell.
4. Roll the shell back to its previous remote map.
5. Restore a database backup into a non-production environment.
6. Confirm request IDs connect browser errors, API logs, and deployment versions.

### Exit check

- Remote and API failures have user-safe behavior and diagnostic metadata.
- Security headers and the remote-origin CSP allowlist are verified.
- WCAG 2.2 AA checks cover every critical flow.
- Database backup restoration and deployment rollback have been rehearsed.

## Daily development commands

### Work on account

```bash
pnpm exec nx serve account
pnpm exec nx test account-feature-auth --watch
pnpm exec nx lint account
```

### Work on commerce

```bash
pnpm exec nx serve commerce
pnpm exec nx test commerce-feature-catalog --watch
pnpm exec nx lint commerce
```

### Work across the composed application

```bash
docker compose up -d postgres
pnpm exec nx serve api-dev
pnpm exec nx serve shell
pnpm exec nx serve account
pnpm exec nx serve commerce
```

Replace the multiple terminal commands with an Nx `dev` target after the individual processes are understood and stable.

### Before opening a pull request

```bash
pnpm exec nx format:check
pnpm exec nx affected -t lint,typecheck,test,build
pnpm exec nx affected -t federation-smoke
pnpm exec nx e2e shell-e2e
```

## Command-by-command reference

This reference explains executable commands from the guide. Repeated commands have the same mechanics but are listed by the different purpose they serve in each phase.

### Command syntax used throughout

| Syntax | What it does | Why it helps |
|---|---|---|
| `pnpm exec <command>` | Runs a binary installed in this repository's dependencies. | Every developer and CI job uses the same tool version instead of an unknown global installation. |
| `nx g <plugin>:<generator>` | Runs an Nx code generator. `g` is short for `generate`. | Creates projects and configuration consistently and registers them in the Nx project graph. |
| `nx add <plugin>` | Installs an Nx plugin and runs its initialization generator. | A plugin is installed and configured together rather than leaving partial manual configuration. |
| `nx run <project>:<target>` | Runs one named target for one project. | Provides an explicit form that works for custom targets such as `federation-smoke`. |
| `nx <target> <project>` | Shorthand for running a standard project target. | Makes common local commands such as `nx test account` easier to read. |
| `nx run-many -t <targets>` | Runs one or more targets across several projects. | Nx respects dependencies, parallelizes safe work, and uses its cache. |
| `nx affected -t <targets>` | Runs targets only for projects changed relative to a Git base plus their dependants. | Keeps pull-request CI fast as the monorepo grows. |

### Discovery and prerequisite commands

| Command | Why we use it | How it helps |
|---|---|---|
| `pnpm exec nx g @nx/react:consumer --help` | Displays the installed consumer-generator options. | Prevents copying flags from an older Nx release. |
| `pnpm exec nx g @nx/react:provider --help` | Displays the installed provider-generator options. | Confirms the current federation and bundler options before modifying the workspace. |
| `node --version` | Shows the active Node.js runtime. | Detects a runtime mismatch before installation or build failures occur. |
| `pnpm --version` | Shows the active package-manager version. | Confirms that local development matches the version pinned in `packageManager`. |
| `git --version` | Confirms Git is installed. | Nx affected calculations and the CI workflow rely on Git history. |
| `docker --version` | Confirms Docker is available. | Local PostgreSQL and database integration tests require a reproducible container runtime. |
| `mkdir -p docs/adr docs/runbooks` | Creates documentation directories and does nothing if they already exist. | Gives architectural decisions and operational procedures stable, discoverable locations. |
| `touch docs/adr/<file>.md` | Creates an empty ADR file if it does not exist. | Establishes one reviewable record per important architectural decision. |

The five `touch` commands create separate records for federation, domain boundaries, authentication, the wallet ledger, and deployment. They use the same shell operation but intentionally represent independent decisions.

### Workspace initialization commands

| Command | Why we use it | How it helps |
|---|---|---|
| `pnpm init` | Creates the root `package.json`. | Gives pnpm and Nx a JavaScript workspace manifest without replacing the existing documentation directory. |
| `pnpm add --save-dev nx@23.2.0 @nx/workspace@23.2.0` | Installs the Nx CLI and workspace plugin as development dependencies. | Pins the build system locally and makes the workspace reproducible. `--save-dev` keeps build tooling out of runtime dependencies. |
| `pnpm exec nx init` | Creates/updates `nx.json` and initializes Nx task discovery and caching. | Converts the repository into an Nx-managed workspace. |
| `pnpm exec nx add @nx/react@23.2.0` | Installs and initializes Nx's React plugin. | Makes React application, library, consumer, and provider generators available. Keep its version aligned with `nx`. |
| `pnpm exec nx g @nx/react:consumer apps/shell --bundler=vite --providerNames=account,commerce` | Generates the shell consumer and two provider applications using Vite. | Creates the federation skeleton, remote entries, standalone provider apps, and Nx tasks in one consistent operation. |
| `pnpm add react-router-dom @tanstack/react-query react-hook-form zod` | Installs browser runtime dependencies. | Provides routing, server-state handling, forms, and runtime validation used by shipped application code. |
| `pnpm add --save-dev @testing-library/react @testing-library/user-event msw` | Installs component and API-mocking test tools. | Enables user-focused tests without increasing production bundles. |
| `pnpm exec nx serve shell` | Starts the shell development server. | Exercises the application frame and composed routing with fast refresh. |
| `pnpm exec nx serve account` | Starts the account provider in development mode. | Allows account development and verifies its standalone/provider contract. |
| `pnpm exec nx serve commerce` | Starts the commerce provider in development mode. | Allows commerce development and verifies its standalone/provider contract. |
| `pnpm exec nx show projects` | Lists projects known to Nx. | Confirms generated names before those names are used in test and CI commands. |
| `pnpm exec nx graph` | Opens or generates the Nx dependency graph. | Makes unintended cross-domain dependencies visible. |
| `pnpm exec nx run-many -t build --projects=shell,account,commerce` | Builds all three frontend deployables. | Proves the generated federation topology works in production mode, not only in dev servers. |

### Library-generation commands

All library generators create an Nx project, TypeScript configuration, a public entry point, and optional test configuration. These shared options mean:

| Option | Meaning | Benefit |
|---|---|---|
| `@nx/react:library` | Creates a library allowed to contain React components and hooks. | Keeps view code in a properly configured React compilation boundary. |
| `@nx/js:library` | Creates a framework-independent TypeScript/JavaScript library. | Prevents contracts, API code, or utilities from depending on React accidentally. |
| `--bundler=none` | Does not create a separately published package bundle. | The consuming app bundles the source, avoiding unnecessary library build/publish complexity. |
| `--unitTestRunner=vitest` | Adds a Vitest test target. | Makes every meaningful library independently testable and cacheable. |
| `--tags=scope:...,type:...` | Adds architectural metadata to the Nx project. | Enables automated module-boundary rules based on domain ownership and library role. |

| Generated library | Why we create it | How it helps |
|---|---|---|
| `libs/shared/ui` | Holds reusable presentational components and design tokens. | Account and commerce share visual consistency without sharing workflows. |
| `libs/shared/contracts` | Holds stable shell/provider and API boundary types. | Teams integrate through a deliberate public contract rather than implementation imports. |
| `libs/shared/api-client` | Holds the generated OpenAPI client and request helpers. | Avoids duplicated handwritten request/response types. |
| `libs/shared/config` | Holds public environment parsing and pure configuration utilities. | Centralizes safe configuration while keeping secrets on the server. |
| `libs/shared/observability` | Defines telemetry interfaces and common metadata. | Providers report errors consistently without coupling to a vendor implementation. |
| `libs/account/feature-auth` | Holds registration, login, logout, and account UI workflows. | Keeps the account application entry point thin and the feature independently testable. |
| `libs/account/data-access` | Holds account API calls and account server-state logic. | Separates remote data access from presentation. |
| `libs/commerce/feature-catalog` | Holds browsing and product-detail workflows. | Creates a cohesive catalog feature boundary. |
| `libs/commerce/feature-selling` | Holds product creation, editing, and publishing workflows. | Keeps seller behavior separate from browsing concerns. |
| `libs/commerce/feature-checkout` | Holds checkout, orders, and wallet presentation. | Isolates the highest-risk commerce flow for focused tests. |
| `libs/commerce/data-access` | Holds commerce API calls and server-state logic. | Gives all commerce features one typed integration layer. |
| `pnpm exec nx run-many -t lint` | Runs lint targets for all projects that define them. | Tests code-quality rules and the architectural boundary policy across the workspace. |

### Federation inspection commands

| Command | Why we use it | How it helps |
|---|---|---|
| `pnpm exec nx build account` | Creates the account production artifact. | Generates the deployable provider code and its remote entry. |
| `pnpm exec nx build commerce` | Creates the commerce production artifact. | Generates the deployable provider code and its remote entry. |
| `pnpm exec nx build shell` | Creates the shell production artifact. | Verifies that the consumer compiles against the public provider contracts. |
| `find apps -path '*/dist/remoteEntry.js' -print` | Searches generated application output for provider entry files. | Quickly confirms that the federation artifacts expected by deployments actually exist. |
| `pnpm exec nx show project account` | Prints account project targets and configuration. | Reveals its real build command and output directory instead of relying on assumptions. |
| `pnpm exec nx show project commerce` | Prints commerce project targets and configuration. | Reveals the provider's build metadata for Vercel and CI configuration. |

### Backend and database commands

| Command | Why we use it | How it helps |
|---|---|---|
| `pnpm exec nx add @nx/node@23.2.0` | Installs and initializes Nx's Node plugin. | Adds Node application/build generators and lets the API participate in the Nx graph. |
| `pnpm exec nx g @nx/node:application apps/api-dev --bundler=esbuild` | Generates a local Node API application compiled with esbuild. | Provides a fast local adapter for the same Hono composition root used in Vercel Functions. |
| `nx g @nx/js:library libs/backend/database ...` | Generates the persistence boundary. | Centralizes connection creation, schema, migrations, and transaction helpers. |
| `nx g @nx/js:library libs/backend/auth ...` | Generates the authentication backend module. | Isolates passwords, sessions, CSRF, and authentication policies. |
| `nx g @nx/js:library libs/backend/catalog ...` | Generates the product backend module. | Owns listing rules and product persistence. |
| `nx g @nx/js:library libs/backend/orders ...` | Generates the order backend module. | Owns order lifecycle and purchase references. |
| `nx g @nx/js:library libs/backend/wallet ...` | Generates the wallet backend module. | Isolates ledger invariants and balance calculations for stronger testing. |
| `pnpm add hono @hono/node-server @hono/zod-openapi zod` | Installs the API framework, local Node adapter, OpenAPI integration, and validation. | Produces one validated API implementation that works locally and on Vercel. |
| `pnpm add drizzle-orm postgres` | Installs the ORM/query layer and PostgreSQL driver. | Gives the API typed SQL access and transactional database operations. |
| `pnpm add @node-rs/argon2` | Installs an Argon2 password-hashing implementation. | Protects stored passwords with a memory-hard algorithm and server-compatible binaries. |
| `pnpm add --save-dev drizzle-kit testcontainers openapi-typescript openapi-fetch` | Installs migration, integration-test, and contract-generation tools. | Keeps schema generation and test tooling out of production dependency declarations. |
| `docker compose up -d postgres` | Starts PostgreSQL from `compose.yaml` in detached mode. | Gives every developer a repeatable local database without a manual installation. |
| `docker compose ps` | Shows Compose service status. | Confirms PostgreSQL is running before debugging application connection errors. |
| `pnpm db:generate` | Runs the repository script that generates a migration from schema changes. | Turns model changes into reviewable SQL migration files. |
| `pnpm db:migrate` | Applies pending migrations to the configured database. | Advances the schema in a controlled, repeatable order. |
| `pnpm db:check` | Runs the repository's schema/migration validation script. | Detects drift or invalid migrations before deployment. |
| `pnpm exec nx serve api-dev` | Starts the local API through Nx. | Enables caching/task orchestration metadata and gives the frontend a local `/api` target. |
| `curl --fail http://localhost:3333/health` | Calls the health endpoint and exits non-zero for an HTTP error. | Provides a scriptable readiness check for local work and CI. |
| `curl --fail http://localhost:3333/openapi.json` | Fetches the generated API description and fails on HTTP errors. | Confirms that the API contract is available before generating a client. |
| `pnpm exec openapi-typescript http://localhost:3333/openapi.json --output .../generated.ts` | Converts the OpenAPI document into TypeScript definitions. | Keeps frontend types synchronized with the server contract. |

### Feature verification commands

| Command | Why we use it | How it helps |
|---|---|---|
| `pnpm exec nx test backend-auth` | Runs authentication backend tests. | Verifies password, session, CSRF, and negative security behavior in isolation. |
| `pnpm exec nx test account-data-access` | Runs account API-integration client tests. | Detects request/response and error-handling regressions. |
| `pnpm exec nx test account-feature-auth` | Runs account UI feature tests. | Confirms registration and login behavior from the user's perspective. |
| `pnpm add @vercel/blob` | Installs the Blob SDK as a runtime dependency. | Enables direct product-image uploads without routing large files through a Function. |
| `pnpm exec vercel env pull .env.local` | Downloads the linked Vercel project's development environment into a local ignored file. | Reproduces cloud integration configuration locally without committing secrets. |
| `pnpm exec nx test backend-catalog` | Runs server-side catalog tests. | Verifies listing validation and ownership policies. |
| `pnpm exec nx test commerce-feature-catalog` | Runs catalog UI tests. | Verifies browsing, product details, pagination, and failure states. |
| `pnpm exec nx test commerce-feature-selling` | Runs seller workflow tests. | Verifies draft, upload, publish, edit, and remove behavior. |
| `pnpm exec nx test backend-wallet` | Runs ledger and balance tests. | Protects the monetary invariants of the simulated wallet. |
| `pnpm exec nx test backend-orders` | Runs order lifecycle tests. | Verifies that products and orders transition consistently. |
| `pnpm exec nx test commerce-feature-checkout` | Runs checkout UI tests. | Checks duplicate submission, errors, and success behavior before E2E tests. |

The repeated `nx build account` and `nx build commerce` commands after feature tests confirm that passing unit tests have not hidden a production-bundling or federation error.

### Test-platform commands

| Command | Why we use it | How it helps |
|---|---|---|
| `pnpm exec nx add @nx/playwright@23.2.0` | Installs and initializes the Nx Playwright plugin. | Registers cacheable E2E tasks and project-aware Playwright configuration. |
| `pnpm exec nx g @nx/playwright:configuration --project=shell` | Creates Playwright configuration for the composed shell. | Gives the whole user journey one browser-level test project. |
| `pnpm exec playwright install --with-deps chromium` | Downloads Chromium and required operating-system packages. | Makes browser tests runnable in clean developer and CI environments. |
| `pnpm exec nx g @nx/playwright:configuration --help` | Shows the installed generator's accepted options. | Resolves version-specific flag differences without guesswork. |
| `pnpm exec nx add @nx/storybook@23.2.0` | Installs and initializes Storybook's Nx plugin. | Adds cacheable Storybook serve/build tasks to the project graph. |
| `pnpm exec nx g @nx/react:storybook-configuration shared-ui` | Configures Storybook for the shared UI library. | Creates an isolated environment to review component states and accessibility. |
| `pnpm exec nx storybook shared-ui` | Starts the shared UI Storybook server. | Enables rapid visual development without running the complete application. |
| `pnpm exec nx run-many -t test` | Runs unit/component tests across all testable projects. | Uses Nx parallelism and cache instead of calling Vitest separately in every library. |
| `pnpm exec nx e2e shell-e2e` | Runs the shell's composed Playwright suite. | Verifies user behavior across shell, providers, API, and database. |
| `pnpm exec nx run-many -t lint,typecheck,build` | Runs static quality checks and production builds across the workspace. | Detects import, type, and bundling failures together. |
| `pnpm exec nx run shell:federation-smoke` | Runs the custom remote-entry compatibility target. | Detects missing providers, invalid exposures, and dependency-version mismatches before E2E. |

### CI commands

| Command | Why we use it | How it helps |
|---|---|---|
| `pnpm exec nx connect` | Connects the workspace to Nx Cloud. | Shares trusted task results between developers and CI and enables later distribution. |
| `pnpm install --frozen-lockfile` | Installs exactly the dependency graph recorded in the lockfile and fails if manifests disagree. | Prevents CI from silently resolving versions different from those reviewed. |
| `pnpm exec nx format:check` | Checks repository formatting without rewriting files. | Makes formatting a deterministic merge gate. |
| `pnpm exec nx affected -t lint,typecheck,test,build --parallel=3` | Runs four quality targets for affected projects with at most three concurrent processes. | Reduces CI work while limiting memory/CPU pressure on the runner. |
| `pnpm exec nx affected -t federation-smoke` | Runs federation smoke checks only where the project graph says they are affected. | Avoids unnecessary browser/network checks while protecting runtime contracts. |

In the GitHub Actions snippet, `actions/checkout` downloads the repository and `fetch-depth: 0` retains full history. Nx needs that history to calculate the correct affected base and head.

### Vercel commands

| Command | Why we use it | How it helps |
|---|---|---|
| `pnpm add --save-dev vercel` | Installs the Vercel CLI locally. | Pins deployment tooling without shipping it in application runtime dependencies. |
| `pnpm exec vercel login` | Authenticates the local CLI. | Authorizes non-CI setup operations without putting a token in source code. |
| `pnpm exec vercel link --repo` | Links monorepo directories to Vercel project metadata. | Allows local environment pulls and project-aware Vercel commands. |
| `pnpm exec nx build shell/account/commerce` | Builds each deployment locally. | Reveals output paths and production errors before configuring Vercel projects. |
| `pnpm exec nx show project shell/account/commerce` | Displays each project's resolved targets and outputs. | Prevents incorrect Vercel build/output-directory configuration. |
| `pnpm add @vercel/related-projects` | Installs the API for reading related preview/production project hosts. | Lets the shell generate a remote map for the exact provider deployments associated with a commit. |
| `pnpm exec vercel env add DATABASE_URL production` | Adds the production pooled PostgreSQL connection as an encrypted Vercel variable. | Keeps database credentials outside Git and makes them available only at deployment/runtime. |
| `pnpm exec vercel env add SESSION_SECRET production` | Adds the production session secret. | Separates cryptographic secrets from source and development environments. |
| `pnpm exec vercel env add ACCOUNT_REMOTE_URL production` | Adds the stable account provider URL. | Lets production change or roll back the account deployment without editing source code. |
| `pnpm exec vercel env add COMMERCE_REMOTE_URL production` | Adds the stable commerce provider URL. | Gives the commerce provider the same environment-controlled release behavior. |
| `pnpm exec vercel env pull .env.local` | Pulls development values for the currently linked project. | Makes local behavior match Vercel while keeping the file ignored by Git. |

### Security, daily-work, and final-check commands

| Command | Why we use it | How it helps |
|---|---|---|
| `pnpm audit --prod` | Checks production dependency versions against known vulnerability advisories. | Focuses the deployment gate on packages that can reach production; it complements, not replaces, GitHub dependency review. |
| `pnpm exec nx test <project> --watch` | Re-runs one project's tests when its files change. | Shortens the feedback loop while implementing a feature. |
| `pnpm exec nx lint <project>` | Lints one actively edited project. | Gives fast local boundary and code-quality feedback before running the whole workspace. |
| `docker compose up -d postgres` followed by the four `nx serve` commands | Starts the complete local system. | Supports manual composed testing while keeping every process and ownership boundary visible. |
| `pnpm exec nx affected -t lint,typecheck,test,build` before a PR | Reproduces the primary CI quality gate locally. | Catches most merge-blocking failures before consuming CI time. |
| `pnpm exec nx e2e shell-e2e` before a PR | Runs the critical composed journey locally. | Detects cross-provider, API, cookie, and database integration failures. |
| Final `pnpm install --frozen-lockfile` | Revalidates that the repository can be installed reproducibly from scratch. | Detects an uncommitted or inconsistent lockfile. |
| Final `nx run-many`, federation smoke, E2E, and audit commands | Runs the complete technical release gate. | Produces evidence that static checks, builds, runtime composition, user journeys, and dependency security all pass together. |

## Phase completion summary

| Phase | Deliverable | Proof |
|---|---|---|
| 0 | Runtime and ADR baseline | Pinned versions and accepted decisions |
| 1 | Shell + two providers | Standalone and composed builds |
| 2 | Enforced domain libraries | Invalid dependencies fail lint |
| 3 | Runtime remote registry | Provider outage is isolated |
| 4 | API, database, OpenAPI | Real DB integration test passes |
| 5 | Account journey | Secure register/login/logout E2E |
| 6 | Listings | Seller publishes; buyer browses |
| 7 | Simulated purchase | Concurrent purchase and ledger invariants pass |
| 8 | Test platform | Contract, E2E, resilience tests pass |
| 9 | CI | Required affected checks gate merge |
| 10 | Vercel previews | Exact preview artifacts compose |
| 11 | Operations | Rollback and restore drills succeed |

## Final architecture verification

Run this before declaring the MVP technically complete:

```bash
pnpm install --frozen-lockfile
pnpm exec nx format:check
pnpm exec nx run-many -t lint,typecheck,test,build
pnpm exec nx run shell:federation-smoke
pnpm exec nx e2e shell-e2e
pnpm audit --prod
```

Then manually verify:

- No provider imports another provider.
- The shell contains no commerce/account workflow logic.
- The browser never receives or calculates an authoritative wallet balance mutation.
- Every object-based API route performs authorization.
- Every provider can fail without unmounting the complete application.
- Every deployment can identify the exact shell, provider, API, and migration versions in use.
