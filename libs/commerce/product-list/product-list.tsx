import { useEffect, useState } from "react";
import { apiClient } from "api-client";
import { Search } from "lucide-react";
import { Button, Input } from "ui";
import { ProductCard, type ProductCardProduct } from "product-card";
import styles from "./product-list.module.css";

type LoadingState = "loading" | "ready" | "empty" | "error";

export function ProductList() {
  const [items, setItems] = useState<ProductCardProduct[]>([]);
  const [state, setState] = useState<LoadingState>("loading");
  const [query, setQuery] = useState("");

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
      setItems(data.items);
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
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredItems = items.filter((product) =>
    [product.title, product.description, product.brand, product.category, product.colour]
      .filter(Boolean)
      .some((value) => value!.toLocaleLowerCase().includes(normalizedQuery)),
  );
  if (state === "loading")
    return (
      <section className={styles.state} aria-live="polite">
        <h2>Products</h2>
        <p>Loading products…</p>
      </section>
    );
  if (state === "error")
    return (
      <section className={styles.state} role="alert">
        <h2>Products</h2>
        <p>We couldn’t load products.</p>
        <Button onClick={() => void load()}>Retry</Button>
      </section>
    );
  if (state === "empty")
    return (
      <section className={styles.state}>
        <h2>Products</h2>
        <p>No published products yet.</p>
      </section>
    );

  return (
    <section className={styles.screen} aria-label="Product list">
      <div className={styles.search}>
        <Input
          aria-label="Search products"
          icon={<Search />}
          name="productSearch"
          onChange={(event) => setQuery(event.currentTarget.value)}
          placeholder="Search products"
          value={query}
        />
      </div>
      {filteredItems.length ? (
        <div className={styles.grid}>
          {filteredItems.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <p className={styles.emptySearch} role="status">
          No products match “{query}”.
        </p>
      )}
    </section>
  );
}

export default ProductList;
