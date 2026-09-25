// Exposed by the federation plugin as 'account/App'.
// Consumers render it lazily via `lazyProvider('account', 'App')`.
import { FeatureAuth } from "feature-auth";

export function App() {
  const isUpdateAccountRoute = window.location.pathname === "/updateaccount";

  return (
    <section data-testid="account">
      <FeatureAuth view={isUpdateAccountRoute ? "details" : "auth"} />
    </section>
  );
}

export default App;
