import { useState } from 'react';
import { upload } from '@vercel/blob/client';
import { apiClient } from 'api-client';

const userId = () => localStorage.getItem('rustic.userId') ?? 'local-user';

export function FeatureSelling() {
  const [productId, setProductId] = useState<string>();
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  async function createDraft(form: HTMLFormElement) {
    const values = new FormData(form);
    setBusy(true); setStatus('Creating draft…');
    const { data, error } = await apiClient.POST('/products', {
      params: { header: { 'x-user-id': userId() } },
      body: {
        title: String(values.get('title') ?? ''),
        description: String(values.get('description') ?? ''),
        priceMinor: Math.round(Number(values.get('price')) * 100),
        currency: String(values.get('currency') ?? 'EUR').toUpperCase(),
      },
    });
    if (error || !data) { setStatus('Could not create the draft. Check the fields and retry.'); setBusy(false); return; }
    setProductId(data.id); setStatus('Draft created. Add an image to publish it.'); setBusy(false);
  }

  async function addImage(file: File) {
    if (!productId) return;
    setBusy(true); setStatus('Uploading image…');
    try {
      await upload(`products/${productId}/${file.name}`, file, {
        access: 'public',
        contentType: file.type,
        handleUploadUrl: '/api/uploads/product-image-token',
        headers: { 'x-user-id': userId() },
      });
      const { error } = await apiClient.POST('/products/{productId}/publish', {
        params: { path: { productId }, header: { 'x-user-id': userId() } },
      });
      setStatus(error ? 'Image uploaded, but the product is not ready to publish.' : 'Product published.');
    } catch { setStatus('Image upload failed. Please retry.'); }
    setBusy(false);
  }

  return <section aria-label="Sell a product">
    <h2>Sell an item</h2>
    <form onSubmit={(event) => { event.preventDefault(); void createDraft(event.currentTarget); }}>
      <label>Title <input name="title" minLength={3} maxLength={120} required /></label>
      <label>Description <textarea name="description" maxLength={5000} required /></label>
      <label>Price <input name="price" type="number" min="0.01" step="0.01" required /></label>
      <label>Currency <input name="currency" defaultValue="EUR" pattern="[A-Za-z]{3}" required /></label>
      <button type="submit" disabled={busy}>Create draft</button>
    </form>
    {productId && <label>Product image <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={busy} onChange={(event) => { const file = event.target.files?.[0]; if (file) void addImage(file); }} /></label>}
    {status && <p aria-live="polite">{status}</p>}
  </section>;
}

export default FeatureSelling;
