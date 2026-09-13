import { applyTheme, storeThemePreference, ThemePreference } from "design-tokens";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { AppHeader, Button } from "ui";
import { lazyProvider } from "../mf";
import { ProviderBoundary } from "../platform/provider-boundary";

const ProviderAccount = lazyProvider("account", "App");
const ProviderCommerce = lazyProvider("commerce", "App");

export function ShellRoutes() {
  const navigate = useNavigate();

  function setTheme(theme: ThemePreference) {
    storeThemePreference(theme);
    applyTheme(theme);
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface-canvas)] text-[var(--color-text-primary)]">
      <AppHeader
        endContent={
          <>
            <Button size="sm" variant="ghost" onClick={() => setTheme("light")}>
              Light
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setTheme("dark")}>
              Dark
            </Button>
          </>
        }
        items={[
          {
            label: "Products",
            children: [
              { label: "Product  list", to: "/commerce" },
              { label: "Add product", to: "/commerce/add-product" },
            ],
          },
          { label: "Account", to: "/account" },
        ]}
        onNavigate={navigate}
      />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Routes>
          <Route
            path="/"
            element={
              <ProviderBoundary name="commerce">
                <ProviderCommerce />
              </ProviderBoundary>
            }
          />
          <Route
            path="/account/*"
            element={
              <ProviderBoundary name="account">
                <ProviderAccount />
              </ProviderBoundary>
            }
          />
          <Route
            path="/commerce/*"
            element={
              <ProviderBoundary name="commerce">
                <ProviderCommerce />
              </ProviderBoundary>
            }
          />
          <Route path="*" element={<Navigate replace to="/" />} />
        </Routes>
      </main>
    </div>
  );
}
