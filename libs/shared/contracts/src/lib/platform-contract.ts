export type ProviderName = 'account' | 'commerce';

export type PlatformUser = {
  id: string;
  displayName: string;
  email: string;
};

export type PlatformSession = {
  user: PlatformUser;
  expiresAt: string;
};

export type RemoteDefinition = {
  name: ProviderName;
  entry: string;
  version?: string;
};

export type RemoteRegistry = Record<ProviderName, RemoteDefinition>;
