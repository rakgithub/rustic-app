import { useEffect, useState } from "react";
import { apiClient } from "api-client";
import { Search } from "lucide-react";
import { Button, Input } from "ui";
import { ProductCard, type ProductCardProduct } from "../product-card/product-card";
import styles from "./product-list.module.css";

type LoadingState = "loading" | "ready" | "empty" | "error";

type ProductListProps = {
  onAddProduct?: () => void;
};

export function ProductList({ onAddProduct }: ProductListProps) {
  const [items, setItems] = useState<ProductCardProduct[]>([]);
  const [state, setState] = useState<LoadingState>("loading");

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
      {/* <header className={styles.heading}>
        {onAddProduct && <Button variant="default" onClick={onAddProduct}>Add a product</Button>}
      </header> */}
      <div className={styles.search}>
        <Input
          aria-label="Search products"
          icon={<Search />}
          name="productSearch"
          placeholder="Search products"
        />
      </div>
      <div className={styles.grid}>
        {items.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

export default ProductList;
