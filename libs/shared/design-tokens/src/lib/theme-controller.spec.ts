import { afterEach, describe, expect, it } from "vitest";

import {
  applyTheme,
  getStoredThemePreference,
  initializeTheme,
  resolveTheme,
  storeThemePreference,
  THEME_PREFERENCE_STORAGE_KEY,
} from "./theme-controller";

afterEach(() => {
  window.localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
  document.documentElement.style.removeProperty("color-scheme");
});

describe("resolveTheme", () => {
  it("uses an explicit light or dark preference", () => {
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
  });

  it("resolves the system preference from the supplied media result", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
  });
});

describe("theme persistence and application", () => {
  it("falls back to the system preference for absent or invalid stored values", () => {
    expect(getStoredThemePreference()).toBe("system");

    window.localStorage.setItem(THEME_PREFERENCE_STORAGE_KEY, "sepia");

    expect(getStoredThemePreference()).toBe("system");
  });

  it("stores and applies an explicit preference to the document root", () => {
    storeThemePreference("dark");

    expect(initializeTheme(document.documentElement)).toEqual({
      preference: "dark",
      resolvedTheme: "dark",
    });
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(document.documentElement.style.colorScheme).toBe("dark");
  });

  it("returns the resolved theme after applying it", () => {
    expect(applyTheme("light", document.documentElement)).toBe("light");
    expect(document.documentElement.dataset.theme).toBe("light");
  });
});
