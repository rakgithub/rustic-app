# Implementation agent

Use this file as the working instructions for an agent implementing a requested change in Rustic App. The task request defines the feature and scope; this file defines how to fit the change into this repository. Inspect the touched area before editing, and prefer current code and configuration over examples in older documentation when they disagree.

## Working approach

1. Identify the owning app or library, its neighboring files, public exports, Nx `project.json`, and relevant tests. Check `git status` before editing; preserve unrelated work.
2. Make the smallest cohesive change that meets the request. Keep app entry points focused on bootstrap, routing, and federation. Put domain behavior in the existing account or commerce library when that boundary already exists; do not create a new library for a small local component.
3. Follow the naming and structure used in the touched area. Files and directories are generally kebab-case (`product-card.tsx`, `product-card.module.css`, `feature-auth.spec.tsx`); React components and types use PascalCase; functions and variables use camelCase. Place tests next to the code they exercise. Export reusable library APIs through their existing `src/index.ts` where present.
4. Preserve user-visible states and behavior: loading, empty, error, success, direct navigation, and keyboard interaction as applicable. Add or change tests for behavior that carries real regression risk.
5. Run the relevant available checks, inspect the diff, and report what changed, what passed, and any remaining limitation. Do not claim a check ran if it did not.

## Architecture and data boundaries

- `apps/shell` composes the providers and owns composed routing, session and theme selection. `apps/account` and `apps/commerce` must also work as standalone providers.
- `libs/shared` owns cross-domain contracts, UI, design tokens, API client, configuration, and observability. `libs/account` and `libs/commerce` own their domain features and data access. Use existing TypeScript aliases from `tsconfig.base.json` and public entry points; avoid deep imports into another library's internals.
- Respect the `scope:*` and `type:*` tags in each `project.json` and the enforced rules in `.oxlintrc.json`. Shared libraries depend only on shared libraries; domain code can depend on its own scope and shared scope. UI libraries depend on UI, util, or contract libraries; data-access libraries depend on data-access, util, or contract libraries. Run lint when changing imports or project boundaries.
- The backend is in a separate repository. Keep API calls behind the frontend API client or domain data-access layer. Treat `libs/shared/api-client/src/lib/generated.ts` as generated OpenAPI output; regenerate from the backend's versioned OpenAPI document rather than hand-editing it. Never place credentials in `VITE_*` variables or client code.
- Keep federation exposes, remote URLs, and shared dependency behavior compatible across shell and providers. Changes to route ownership, provider exports, platform contracts, or theme initialization need a composed and standalone check.

## Design system and UI

- Reuse components from `libs/shared/ui` before creating another shared primitive. Add a shared component only when it has a cross-domain use; keep feature-specific UI in its domain.
- Use the token source in `libs/shared/design-tokens/tokens/` for new design decisions. Components should consume semantic or component CSS variables; avoid hard-coded palette values. Generated CSS in `libs/shared/design-tokens/src/generated/` is output, so change token JSON and run `pnpm run tokens:build` when tokens change.
- Match the styling method already used by the touched component: shared UI uses its existing component styling and stories, while many domain features use colocated CSS modules. Maintain light and dark theme behavior, visible focus, readable contrast, responsive layout, and reduced-motion behavior. Add or update Storybook stories for meaningful states of shared UI components.
- Use semantic HTML, accessible names, labels, and keyboard-operable controls. Check relevant [WCAG 2.2 criteria](https://www.w3.org/WAI/WCAG22/quickref/) for new interactive UI.

## Verification

Use Node 22 and pnpm 11.24.0. Discover actual targets with `pnpm exec nx show project <name>` because some libraries have inferred targets and some Commerce projects currently lack a test target. Choose checks that cover the changed behavior:

```bash
pnpm exec nx lint <project>
pnpm exec nx test <project> --run
node tools/scripts/typecheck.mjs
pnpm exec nx run-many -t build -p shell account commerce
pnpm exec nx run shell:federation-smoke
pnpm exec nx e2e shell
pnpm run bundle:check
```

For token changes, also run `pnpm run tokens:build` and review generated CSS. For shared UI changes, run its Storybook build and inspect light and dark states. If a command fails because of an existing repository issue, distinguish that from a regression introduced by the change and include the evidence in the handoff.

## Repository references

- [Workspace architecture and commands](README.md)
- [Design token implementation guide](docs/theme-and-design-tokens-guide.md)
- [Architecture review and known gaps](docs/microfrontend-architecture-improvements.md)
- [Nx module boundary guidance](https://nx.dev/docs/features/enforce-module-boundaries)

Keep these instructions focused on the requested implementation. Recheck the live repository when it evolves instead of treating this document as a frozen inventory.
