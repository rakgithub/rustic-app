import { useEffect, useState } from 'react';
import { apiClient } from 'api-client';

type Product = {
  id: string;
  title: string;
  description: string;
  priceMinor: number;
  currency: string;
  images: Array<{ blobUrl: string }>;
};

export function FeatureCatalog() {
  const [items, setItems] = useState<Product[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'empty' | 'error'>('loading');

  const load = async (showLoading = true) => {
    if (showLoading) setState('loading');
    try {
      const { data, error } = await apiClient.GET('/products', { params: { query: { page: 1, pageSize: 20 } } });
      if (error || !data) { setState('error'); return; }
      setItems(data.items as Product[]);
      setState(data.items.length ? 'ready' : 'empty');
    } catch {
      setState('error');
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(false); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  if (state === 'loading') return <section aria-live="polite"><h2>Catalog</h2><p>Loading products…</p></section>;
  if (state === 'error') return <section role="alert"><h2>Catalog</h2><p>We couldn’t load products.</p><button type="button" onClick={() => void load()}>Retry</button></section>;
  if (state === 'empty') return <section><h2>Catalog</h2><p>No published products yet.</p></section>;

  return <section aria-label="Product catalog"><h2>Catalog</h2><div className="product-grid">{items.map((product) => (
    <article key={product.id} className="product-card">
      {product.images[0] && <img src={product.images[0].blobUrl} alt="" loading="lazy" />}
      <h3>{product.title}</h3>
      <p>{product.description}</p>
      <strong>{(product.priceMinor / 100).toFixed(2)} {product.currency}</strong>
    </article>
  ))}</div></section>;
}

export default FeatureCatalog;
