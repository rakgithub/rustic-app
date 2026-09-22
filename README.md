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

## Workspace structure and tooling

This is a monorepo: one Git repository containing multiple applications and
internal libraries. A monorepo is a repository structure, not a build tool.

```text
pnpm  -> installs dependencies and links workspace packages
Nx    -> understands projects and their dependencies; runs and caches tasks
Vite  -> serves and builds each frontend application
```

Nx and pnpm have different responsibilities. pnpm manages `node_modules` and
the workspace lockfile. Nx builds a project graph, uses it to run tasks in the
right order, and can run only the projects affected by a change.

### Applications and libraries

`apps/` contains runnable and deployable applications. For example,
`apps/commerce` is the independently deployable Commerce provider and
`apps/shell` is the application that composes providers at runtime.

`libs/` contains internal code boundaries. A library does not have to be shared
by multiple applications and is not automatically an npm package. A domain
feature can live in a library when it needs a clear ownership, testing, or
dependency boundary; otherwise, small app-specific code can remain under the
application's `src/` directory.

```text
apps/commerce                 deployment, federation, routing, bootstrap
libs/commerce/feature-*       Commerce feature implementation
libs/shared/ui                cross-domain UI primitives
libs/shared/api-client        cross-domain frontend API contract
```

`projectType` is broad Nx metadata:

- `application` means a runnable/deployable product, normally with entry
  points such as `serve`, `build`, or `e2e`.
- `library` means code imported by other projects. It may have `lint`, `test`,
  `build`, or Storybook targets, but Nx does not create those automatically
  merely because it is a library.

Project tags express the enforceable architecture. For example, a project can
be tagged `scope:commerce` and `type:feature`; the boundary rules prevent it
from importing incompatible domain or layer code.

### Nx targets

A target is a named operation that Nx can run for a project, similar to a
`package.json` script but graph-aware. Targets may be explicitly declared in a
project's `project.json`, inferred by Nx plugins from tool configuration, or
based on a package script.

```text
pnpm run build              runs a package script
pnpm exec nx build commerce runs the Commerce build target and its dependencies
pnpm exec nx affected -t test,build
                           runs those targets only where a change requires it
```

Targets can declare dependencies, inputs, outputs, and cache settings. This is
how Nx knows, for example, that a shared-library change requires relevant
consumers to be retested or rebuilt.

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
- [Microfrontend architecture improvements](docs/microfrontend-architecture-improvements.md)

## License

Private and proprietary unless a license is added to this repository.
