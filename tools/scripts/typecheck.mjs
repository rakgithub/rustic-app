import { spawnSync } from "node:child_process";

const configs = [
  "apps/account/tsconfig.json",
  "apps/api-dev/tsconfig.app.json",
  "apps/commerce/tsconfig.json",
  "apps/shell/tsconfig.json",
  "libs/account/data-access/tsconfig.lib.json",
  "libs/account/feature-auth/tsconfig.lib.json",
  "libs/backend/auth/tsconfig.lib.json",
  "libs/backend/catalog/tsconfig.lib.json",
  "libs/backend/database/tsconfig.lib.json",
  "libs/backend/orders/tsconfig.lib.json",
  "libs/backend/wallet/tsconfig.lib.json",
  "libs/commerce/feature-catalog/tsconfig.lib.json",
  "libs/commerce/feature-checkout/tsconfig.lib.json",
  "libs/commerce/feature-selling/tsconfig.lib.json",
  "libs/shared/api-client/tsconfig.lib.json",
  "libs/shared/config/tsconfig.lib.json",
  "libs/shared/contracts/tsconfig.lib.json",
  "libs/shared/observability/tsconfig.lib.json",
  "libs/shared/ui/tsconfig.lib.json",
];

for (const config of configs) {
  const result = spawnSync(
    "pnpm",
    ["exec", "tsc", "--noEmit", "--declaration", "false", "--pretty", "false", "-p", config],
    { stdio: "inherit" },
  );
  if (result.status !== 0) process.exit(result.status ?? 1);
}
