# Microfrontend architecture improvements

## Purpose

This document records the improvements identified during the architecture
review of the Nx, React, Vite, Module Federation, and pnpm workspace. It is a
prioritized implementation backlog, not a replacement for team ownership or
product decisions.

## Current strengths

- Domain-oriented applications: `shell`, `account`, and `commerce`.
- Runtime remote registration with schema and HTTPS validation.
- React and React DOM configured as federation singletons.
- Nx project graph, affected execution, scope tags, and layer boundaries
  enforced by Oxlint.
- Shared design tokens, UI primitives, and frontend API contract types.
- Remote-entry and hashed-asset caching policies.
- Provider loading and rendering are isolated by error boundaries.
- Bundle budgets and a rollback runbook are present.

## Priority 0: release and security blockers

### Make composition tests reliable and required

The only shell E2E test has stale assertions and does not exercise the actual
routes or remote-failure paths. It should cover:

- `/`, `/commerce`, `/commerce/add-product`, and `/account`.
- Browser refresh and direct navigation to nested routes.
- A missing or invalid remote registry.
- An unavailable provider and recovery behavior.
- A compatibility matrix of current shell/previous provider and previous
  shell/current provider.
- Authentication/session propagation.

Run these tests from a clean checkout in CI and make them a deployment gate.

### Ensure all Commerce tests run through Nx

`add-product`, `product-list`, and `product-checkout` contain spec files but
their projects have no Nx `test` target. Add a shared Vitest configuration or
consolidate the libraries into testable Commerce feature projects.

The root Vitest project discovery should explicitly exclude `dist/**`; after a
build, compiled Vitest configurations can be discovered as duplicate projects.

### Replace browser-controlled identity

Commerce currently takes `x-user-id` from `localStorage`, with a fallback user
identity. This must not be used in production. The backend should derive the
user from a validated session or bearer token. Wire the shell's platform
session interface into the remotes only through a narrow, versioned contract.

### Add CI enforcement

Create a required pull-request workflow that runs, from a clean checkout:

1. Frozen dependency installation.
2. Formatting, linting, and Nx boundary enforcement.
3. Affected typecheck and unit tests.
4. Provider and shell builds.
5. Federation contract and smoke tests.
6. Composed E2E tests.
7. Bundle-budget checks.
8. Dependency and security scanning.

## Priority 1: federation resilience and deployment

### Make remote retry actually reload a provider

Resetting the error boundary alone does not recreate the rejected `React.lazy`
promise. Use a retry key/load factory that creates a new lazy provider, or add
a Module Federation runtime fallback/retry strategy. Capture each attempt in
telemetry.

### Use a manifest-backed remote registry

The current registry points to `remoteEntry.js`. Prefer provider
`mf-manifest.json` entries so the runtime can use asset metadata, shared
dependency information, types, preloading, and better failure diagnostics.

### Separate the runtime registry from the shell build artifact

`generate-remotes.mjs` writes `remotes.json` into the shell build input, so a
registry change normally requires a shell deployment. If operations require a
true no-rebuild provider switch or rollback, serve the registry as independently
managed edge/configuration data with:

- Registry schema version.
- Provider build version and commit SHA.
- Approved hostname allowlist.
- Previous-known-good provider entry.
- Atomic promotion and rollback.
- Short-lived or no-cache policy.

### Tighten remote code policy

A remote is executable code. Restrict CSP `script-src` and `connect-src` to
approved API, remote, and CDN hosts rather than broad `https:` allowances.
Validate registry hostnames as well as protocol. Keep public-asset CORS scoped
to the hosts that need it where possible.

### Establish an explicit provider contract

Define and test a versioned contract for each federated expose:

- Export name and component props.
- Supported shell/platform contract version.
- Routing base path.
- Session/authentication integration.
- Error and telemetry context.
- Provider build/version metadata.

Avoid using a non-null assertion for a loaded remote module without a clear,
observable compatibility failure path.

### Add useful observability

Replace console-only provider failure logging with production telemetry. Record
provider name, URL, build version, route, load phase, duration, retry outcome,
and a correlation/request ID. The shared observability library should either be
implemented for this purpose or removed until it has an owner and a use case.

## Priority 2: monorepo architecture and developer experience

### Choose one dependency/package model

The workspace currently mixes root-owned dependencies, per-app package
manifests, TypeScript path aliases, and a subset of package-based libraries.
Select one deliberate model:

- An integrated Nx workspace, with dependencies centrally managed at the root,
  or
- A package-based workspace, where every app/library declares its direct
  dependencies and local packages use the `workspace:` protocol.

Do not rely on packages being available only because Node resolves them from
the workspace root.

### Align project size with ownership

Some Commerce projects are single wrappers or components without independent
build, test, or ownership value. Consolidate them into cohesive vertical
features, for example:

- `commerce/feature-catalog`
- `commerce/feature-selling`
- `commerce/feature-checkout`
- `commerce/data-access`
- `commerce/ui`

Keep a separate project only when it has an owner, reuse boundary, or release
reason.

### Standardize typecheck coverage

The explicit typecheck script does not directly cover all Commerce libraries.
Create an Nx `typecheck` target for every app and library, then run
`nx affected -t typecheck` in CI.

### Share only necessary federation dependencies

Keep React and React DOM as singletons. Review `react-router-dom`: Account
declares it as shared although it does not use routing. Minimize the shared set
to reduce version-skew surface area and unnecessary federation output.

### Define ownership

Add `CODEOWNERS` (or Nx ownership configuration) for:

- Account domain.
- Commerce domain.
- Shell/platform.
- Shared UI and design tokens.
- API contracts.
- Deployment and federation configuration.

## Performance governance

### Current implementation

`tools/bundle-budgets.json` defines the current gzip limits:

| Measurement               |         Limit |
| ------------------------- | ------------: |
| Shell bootstrap chunk     |  30,000 bytes |
| Account total JavaScript  | 300,000 bytes |
| Commerce total JavaScript | 350,000 bytes |

`tools/scripts/check-bundle-budgets.mjs` reads generated JavaScript files,
compresses them in memory with Node's built-in `node:zlib`, compares the result
to these limits, and exits non-zero when a limit is exceeded. It uses no
external bundle-analysis package.

Run it after builds:

```bash
pnpm exec nx run-many -t build -p shell account commerce
pnpm run bundle:check
```

### Current finding

The shell bootstrap measured 37,340 bytes gzip against the 30,000-byte budget,
so the current check fails. Account and Commerce were within their configured
limits.

### Improve the budget model

The repository history does not document how the 30,000-byte shell threshold
was calculated. Treat it as an initial policy value, not a validated user
performance requirement.

Derive future values from an explicit page-level target:

1. Define target devices, networks, and Web Vitals goals.
2. Measure the complete initial route payload, including federation runtime,
   shared dependencies, CSS, remote entry, and initial provider assets.
3. Allocate an agreed portion of that payload to shell-owned code.
4. Set the budget from the measured baseline plus limited, documented headroom.
5. Require an approved performance decision for budget increases.

The current shell check measures only a `bootstrap-*.js` chunk, not the full
initial network payload. Retain the fast gzip check, but add route-level
Lighthouse CI/Web Vitals budgets, request-count limits, CSS/image/font limits,
and bundle-diff reporting for failed checks.

## Recommended implementation order

1. Repair E2E tests, Commerce test targets, and the CI pipeline.
2. Replace browser-controlled identity with validated authentication.
3. Resolve the failed shell budget and establish an evidence-based budget model.
4. Implement retry-safe remote loading and production telemetry.
5. Introduce a versioned manifest-backed registry and compatibility tests.
6. Normalize package/dependency ownership and consolidate low-value projects.
7. Add code ownership and a provider promotion/rollback process.

## Reference guidance

- [Nx: microfrontend architecture](https://nx.dev/docs/kb/micro-frontend-architecture)
- [Nx: enforce module boundaries](https://nx.dev/docs/features/enforce-module-boundaries)
- [Module Federation: shared dependencies](https://module-federation.io/configure/shared)
- [Module Federation: manifests and snapshots](https://module-federation.io/guide/basic/manifest-snapshot)
- [Module Federation: runtime plugins](https://module-federation.io/guide/runtime/runtime-plugins)
- [pnpm: workspace protocol](https://pnpm.io/workspaces)
- [web.dev: performance budgets](https://web.dev/articles/performance-budgets-101)
