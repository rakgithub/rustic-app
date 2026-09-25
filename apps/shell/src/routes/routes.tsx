import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { AppHeader, Button } from "ui";
import { lazyProvider } from "../mf";
import { ProviderBoundary } from "../platform/provider-boundary";

const ProviderAccount = lazyProvider("account", "App");
const ProviderCommerce = lazyProvider("commerce", "App");

export function ShellRoutes() {
  const location = useLocation();
  const navigate = useNavigate();
  const isAccountRoute =
    location.pathname.startsWith("/account") || location.pathname === "/updateaccount";
  const isSignedIn = window.localStorage.getItem("rustic.session") === "true";
  const signInPath = `/account?returnTo=${encodeURIComponent(`${location.pathname}${location.search}`)}`;

  return (
    <div className="min-h-screen bg-[var(--color-surface-canvas)] text-[var(--color-text-primary)]">
      {!isAccountRoute && (
        <AppHeader
          endContent={
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                window.localStorage.removeItem("rustic.userId");
                window.localStorage.removeItem("rustic.session");
                navigate("/account");
              }}
            >
              Log out
            </Button>
          }
          items={[
            {
              label: "Products",
              children: [
                { label: "Product  list", to: "/commerce" },
                { label: "Add product", to: "/commerce/add-product" },
              ],
            },
            { label: "Account", to: isSignedIn ? "/updateaccount" : "/account" },
          ]}
          onNavigate={navigate}
        />
      )}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Routes>
          <Route
            path="/"
            element={
              isSignedIn ? (
                <ProviderBoundary name="commerce">
                  <ProviderCommerce />
                </ProviderBoundary>
              ) : (
                <Navigate replace to={signInPath} />
              )
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
            path="/updateaccount"
            element={
              isSignedIn ? (
                <ProviderBoundary name="account">
                  <ProviderAccount />
                </ProviderBoundary>
              ) : (
                <Navigate replace to={signInPath} />
              )
            }
          />
          <Route
            path="/commerce/*"
            element={
              isSignedIn ? (
                <ProviderBoundary name="commerce">
                  <ProviderCommerce />
                </ProviderBoundary>
              ) : (
                <Navigate replace to={signInPath} />
              )
            }
          />
          <Route path="*" element={<Navigate replace to={isSignedIn ? "/" : signInPath} />} />
        </Routes>
      </main>
    </div>
  );
}
