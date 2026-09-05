import { FeatureCatalog } from 'feature-catalog';
import { FeatureCheckout } from 'feature-checkout';
import { FeatureSelling } from 'feature-selling';

// Exposed by the federation plugin as 'commerce/App'.
// Consumers render it lazily via `lazyProvider('commerce', 'App')`.
export function App() {
  return (
    <section data-testid="commerce">
      <h1>Rustic marketplace</h1>
      <FeatureSelling />
      <FeatureCatalog />
      <FeatureCheckout />
    </section>
  );
}

export default App;
