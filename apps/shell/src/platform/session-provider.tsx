import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { PlatformSession } from 'contracts';

type SessionContextValue = {
  session: PlatformSession | null;
  setSession: (session: PlatformSession | null) => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

type SessionProviderProps = {
  children: ReactNode;
  initialSession?: PlatformSession | null;
};

export function SessionProvider({
  children,
  initialSession = null,
}: SessionProviderProps) {
  const [session, setSession] = useState<PlatformSession | null>(initialSession);
  const value = useMemo(() => ({ session, setSession }), [session]);

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }

  return context;
}
