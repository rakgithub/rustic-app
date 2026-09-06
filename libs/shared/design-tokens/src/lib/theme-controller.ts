export const THEME_PREFERENCE_STORAGE_KEY = 'rustic.theme-preference';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = Exclude<ThemePreference, 'system'>;

const themePreferences = new Set<ThemePreference>(['light', 'dark', 'system']);

export function isThemePreference(value: unknown): value is ThemePreference {
  return typeof value === 'string' && themePreferences.has(value as ThemePreference);
}

export function resolveTheme(
  preference: ThemePreference,
  systemPrefersDark = getSystemPrefersDark(),
): ResolvedTheme {
  if (preference === 'system') return systemPrefersDark ? 'dark' : 'light';

  return preference;
}

export function getStoredThemePreference(): ThemePreference {
  if (typeof window === 'undefined') return 'system';

  try {
    const storedPreference = window.localStorage.getItem(
      THEME_PREFERENCE_STORAGE_KEY,
    );

    return isThemePreference(storedPreference) ? storedPreference : 'system';
  } catch {
    return 'system';
  }
}

export function storeThemePreference(preference: ThemePreference): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(THEME_PREFERENCE_STORAGE_KEY, preference);
  } catch {
    // Storage can be unavailable in private browsing or restricted contexts.
  }
}

export function applyTheme(
  preference: ThemePreference,
  root: HTMLElement | undefined = getDocumentElement(),
): ResolvedTheme {
  const resolvedTheme = resolveTheme(preference);

  if (root) {
    root.dataset.theme = resolvedTheme;
    root.style.colorScheme = resolvedTheme;
  }

  return resolvedTheme;
}

export function initializeTheme(
  root: HTMLElement | undefined = getDocumentElement(),
): { preference: ThemePreference; resolvedTheme: ResolvedTheme } {
  const preference = getStoredThemePreference();

  return {
    preference,
    resolvedTheme: applyTheme(preference, root),
  };
}

export function watchSystemTheme(
  preference: ThemePreference,
  onChange: (theme: ResolvedTheme) => void,
): () => void {
  if (
    preference !== 'system' ||
    typeof window === 'undefined' ||
    typeof window.matchMedia !== 'function'
  ) {
    return () => undefined;
  }

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const listener = (event: MediaQueryListEvent) => {
    onChange(event.matches ? 'dark' : 'light');
  };

  mediaQuery.addEventListener('change', listener);

  return () => mediaQuery.removeEventListener('change', listener);
}

function getSystemPrefersDark(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
}

function getDocumentElement(): HTMLElement | undefined {
  return typeof document === 'undefined' ? undefined : document.documentElement;
}
