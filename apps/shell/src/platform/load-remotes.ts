import { registerRemotes } from '@module-federation/runtime';
import { z } from 'zod';

const remoteSchema = z.object({
  name: z.string().min(1),
  entry: z.url(),
});

const remoteRegistrySchema = z.record(z.string(), remoteSchema);

export type RemoteRegistry = z.infer<typeof remoteRegistrySchema>;

function isLocalEntry(entry: URL): boolean {
  return entry.hostname === 'localhost' || entry.hostname === '127.0.0.1';
}

function validateRemoteProtocols(registry: RemoteRegistry): void {
  for (const [alias, remote] of Object.entries(registry)) {
    const entry = new URL(remote.entry);

    if (entry.protocol !== 'https:' && !isLocalEntry(entry)) {
      throw new Error(
        `Remote "${alias}" must use HTTPS outside local development`,
      );
    }
  }
}

export async function loadRemotes(
  registryUrl = '/remotes.json',
): Promise<RemoteRegistry> {
  const response = await fetch(registryUrl, {
    headers: { accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(
      `Unable to load remote registry: ${response.status} ${response.statusText}`,
    );
  }

  const registry = remoteRegistrySchema.parse(await response.json());
  validateRemoteProtocols(registry);

  registerRemotes(
    Object.entries(registry).map(([alias, remote]) => ({
      alias,
      name: remote.name,
      entry: remote.entry,
      type: 'module',
    })),
  );

  return registry;
}
