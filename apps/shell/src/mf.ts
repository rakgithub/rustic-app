import { lazy, type ComponentType } from "react";
import { loadRemote } from "@module-federation/runtime";

// Providers are registered from /remotes.json by platform/load-remotes before
// React renders. Keeping URLs out of this bundle lets a deployment switch
// providers (or roll back the registry) without rebuilding the shell.

export function lazyProvider<Props = unknown>(alias: string, exposeName: string) {
  return lazy(async () => {
    const mod = await loadRemote<{ default: ComponentType<Props> }>(`${alias}/${exposeName}`);
    return { default: mod!.default };
  });
}
