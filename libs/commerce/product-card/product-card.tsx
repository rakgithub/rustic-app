import styles from "./product-card.module.css";

export type ProductCardProduct = {
  id: string;
  title: string;
  description: string;
  brand: string | null;
  colour: string | null;
  category: string | null;
  priceMinor: number;
  currency: string;
  images?: Array<{ blobUrl: string }>;
};

type ProductCardProps = {
  product: ProductCardProduct;
};

function formatPrice(priceMinor: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
  }).format(priceMinor / 100);
}

export function ProductCard({ product }: ProductCardProps) {
  const image = product.images?.[0];

  return (
    <article className={styles.card}>
      <div className={styles.media}>
        {image ? (
          <img src={image.blobUrl} alt={product.title} loading="lazy" />
        ) : (
          <div className={styles.placeholder} aria-hidden="true">
            <span>{product.title.charAt(0).toUpperCase()}</span>
          </div>
        )}
        {product.category && <span className={styles.category}>{product.category}</span>}
      </div>

      <div className={styles.content}>
        {product.brand && <p className={styles.brand}>{product.brand}</p>}
        <h3 className={styles.title}>{product.title}</h3>
        <p className={styles.description}>{product.description}</p>
        <div className={styles.footer}>
          <strong className={styles.price}>
            {formatPrice(product.priceMinor, product.currency)}
          </strong>
          {product.colour && <span className={styles.colour}>{product.colour}</span>}
        </div>
      </div>
    </article>
  );
}
