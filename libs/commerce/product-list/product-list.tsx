import { useEffect, useState } from "react";
import { apiClient } from "api-client";
import { Button } from "ui";

type Product = {
  id: string;
  title: string;
  description: string;
  brand: string | null;
  colour: string | null;
  category: string | null;
  priceMinor: number;
  currency: string;
  images: Array<{ blobUrl: string }>;
};

export function ProductList() {
  const [items, setItems] = useState<Product[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "empty" | "error">("loading");

  async function load(showLoading = true) {
    if (showLoading) setState("loading");
    try {
      const { data, error } = await apiClient.GET("/products", {
        params: { query: { page: 1, pageSize: 20 } },
      });
      if (error || !data) {
        setState("error");
        return;
      }
      setItems(data.items as Product[]);
      setState(data.items.length ? "ready" : "empty");
    } catch {
      setState("error");
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load(false);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  if (state === "loading")
    return (
      <section aria-live="polite">
        <h2>Products</h2>
        <p>Loading products…</p>
      </section>
    );
  if (state === "error")
    return (
      <section role="alert">
        <h2>Products</h2>
        <p>We couldn’t load products.</p>
        <Button onClick={() => void load()}>Retry</Button>
      </section>
    );
  if (state === "empty")
    return (
      <section>
        <h2>Products</h2>
        <p>No published products yet.</p>
      </section>
    );

  return (
    <section aria-label="Product list">
      <h2>Products</h2>
      <div className="product-grid">
        {items.map((product) => (
          <article key={product.id} className="product-card">
            {product.images[0] && <img src={product.images[0].blobUrl} alt="" loading="lazy" />}
            <h3>{product.title}</h3>
            {product.brand && <p>{product.brand}</p>}
            <p>{product.description}</p>
            <strong>
              {(product.priceMinor / 100).toFixed(2)} {product.currency}
            </strong>
          </article>
        ))}
      </div>
    </section>
  );
}

export default ProductList;
