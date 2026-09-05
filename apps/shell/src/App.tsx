import { lazyProvider } from "./mf";
import { ProviderBoundary } from "./platform/provider-boundary";

const ProviderAccount = lazyProvider("account", "App");
const ProviderCommerce = lazyProvider("commerce", "App");

export function App() {
  return (
    <main>
      <h1>shell</h1>
      <ProviderBoundary name="account">
        <ProviderAccount />
      </ProviderBoundary>
      <ProviderBoundary name="commerce">
        <ProviderCommerce />
      </ProviderBoundary>
    </main>
  );
}

export default App;
