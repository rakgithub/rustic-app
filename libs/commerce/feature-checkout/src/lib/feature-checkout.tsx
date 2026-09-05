import { useState } from 'react';
import { apiClient } from 'api-client';

const userId = () => localStorage.getItem('rustic.userId') ?? 'local-user';

export function FeatureCheckout() {
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  async function purchase(form: HTMLFormElement) {
    const productId = String(new FormData(form).get('productId') ?? '').trim();
    if (!productId) return;
    setBusy(true);
    setStatus('Completing purchase…');
    const { data, error } = await apiClient.POST('/products/{productId}/purchase', {
      params: { path: { productId }, header: { 'x-user-id': userId() } },
      body: { idempotencyKey: crypto.randomUUID() },
    });
    setStatus(data ? `Order ${data.id} confirmed.` : error ? 'Purchase could not be completed.' : 'Purchase failed. Please retry.');
    setBusy(false);
  }

  return <section aria-label="Checkout">
    <h2>Checkout</h2>
    <form onSubmit={(event) => { event.preventDefault(); void purchase(event.currentTarget); }}>
      <label>Product ID <input name="productId" required /></label>
      <button type="submit" disabled={busy}>Buy item</button>
    </form>
    {status && <p aria-live="polite">{status}</p>}
  </section>;
}

export default FeatureCheckout;
