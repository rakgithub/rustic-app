import { and, asc, count, desc, eq, max } from 'drizzle-orm';
import { z } from 'zod';
import type { DatabaseConnection } from 'database';
import { productImages, products } from 'database';

export const productInputSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(1).max(5000),
  priceMinor: z.number().int().positive().max(100_000_000),
  currency: z.string().regex(/^[A-Z]{3}$/),
});

export const productPatchSchema = productInputSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  'At least one product field is required',
);

export type ProductInput = z.infer<typeof productInputSchema>;
export type ProductPatch = z.infer<typeof productPatchSchema>;
export type Product = typeof products.$inferSelect;
export type ProductImage = typeof productImages.$inferSelect;

export async function createProduct(
  db: DatabaseConnection['db'],
  ownerId: string,
  input: ProductInput,
): Promise<Product> {
  const [product] = await db
    .insert(products)
    .values({ ...input, ownerId, status: 'draft' })
    .returning();
  return product;
}

export async function listPublishedProducts(
  db: DatabaseConnection['db'],
  page: number,
  pageSize: number,
): Promise<{ items: Array<Product & { images: ProductImage[] }>; page: number; pageSize: number; hasNextPage: boolean }> {
  const offset = (page - 1) * pageSize;
  const rows = await db
    .select()
    .from(products)
    .where(eq(products.status, 'published'))
    .orderBy(desc(products.createdAt), desc(products.id))
    .limit(pageSize + 1)
    .offset(offset);

  const hasNextPage = rows.length > pageSize;
  const visibleRows = rows.slice(0, pageSize);
  const items = await Promise.all(
    visibleRows.map(async (product) => ({
      ...product,
      images: await db
        .select()
        .from(productImages)
        .where(eq(productImages.productId, product.id))
        .orderBy(asc(productImages.position), asc(productImages.id)),
    })),
  );

  return { items, page, pageSize, hasNextPage };
}

export async function getPublishedProduct(
  db: DatabaseConnection['db'],
  productId: string,
): Promise<(Product & { images: ProductImage[] }) | null> {
  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.id, productId), eq(products.status, 'published')))
    .limit(1);

  if (!product) return null;

  const images = await db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, product.id))
    .orderBy(asc(productImages.position), asc(productImages.id));

  return { ...product, images };
}

export async function getOwnedProduct(
  db: DatabaseConnection['db'],
  ownerId: string,
  productId: string,
): Promise<Product | null> {
  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.id, productId), eq(products.ownerId, ownerId)))
    .limit(1);
  return product ?? null;
}

export async function listOwnedProducts(
  db: DatabaseConnection['db'],
  ownerId: string,
): Promise<Array<Product & { images: ProductImage[] }>> {
  const rows = await db
    .select()
    .from(products)
    .where(eq(products.ownerId, ownerId))
    .orderBy(desc(products.updatedAt), desc(products.id));

  return Promise.all(
    rows.map(async (product) => ({
      ...product,
      images: await db
        .select()
        .from(productImages)
        .where(eq(productImages.productId, product.id))
        .orderBy(asc(productImages.position), asc(productImages.id)),
    })),
  );
}

export async function updateOwnedProduct(
  db: DatabaseConnection['db'],
  ownerId: string,
  productId: string,
  input: ProductPatch,
): Promise<Product | null> {
  const [product] = await db
    .update(products)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(products.id, productId), eq(products.ownerId, ownerId)))
    .returning();
  return product ?? null;
}

export async function deleteOwnedProduct(
  db: DatabaseConnection['db'],
  ownerId: string,
  productId: string,
): Promise<boolean> {
  const deleted = await db
    .delete(products)
    .where(and(eq(products.id, productId), eq(products.ownerId, ownerId)))
    .returning({ id: products.id });
  return deleted.length === 1;
}

export async function publishOwnedProduct(
  db: DatabaseConnection['db'],
  ownerId: string,
  productId: string,
): Promise<{ product: Product; images: ProductImage[] } | null> {
  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.id, productId), eq(products.ownerId, ownerId)))
    .limit(1);
  if (!product) return null;

  const images = await db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, productId));

  if (
    product.status !== 'draft' ||
    product.title.trim().length < 3 ||
    product.description.trim().length === 0 ||
    product.priceMinor <= 0 ||
    !/^[A-Z]{3}$/.test(product.currency) ||
    images.length === 0
  ) {
    throw new Error('Product requires valid fields and at least one image');
  }

  const [published] = await db
    .update(products)
    .set({ status: 'published', updatedAt: new Date() })
    .where(and(eq(products.id, productId), eq(products.ownerId, ownerId)))
    .returning();

  return { product: published, images };
}

export async function addOwnedProductImage(
  db: DatabaseConnection['db'],
  ownerId: string,
  productId: string,
  image: Omit<typeof productImages.$inferInsert, 'productId'>,
): Promise<ProductImage | null> {
  const [product] = await db
    .select({ id: products.id })
    .from(products)
    .where(and(eq(products.id, productId), eq(products.ownerId, ownerId)))
    .limit(1);
  if (!product) return null;

  const [lastImage] = await db
    .select({ position: max(productImages.position) })
    .from(productImages)
    .where(eq(productImages.productId, productId));
  const nextPosition = Number(lastImage?.position ?? -1) + 1;

  const [created] = await db
    .insert(productImages)
    .values({ ...image, productId, position: nextPosition })
    .returning();
  return created;
}

export async function countProductImages(
  db: DatabaseConnection['db'],
  productId: string,
): Promise<number> {
  const [result] = await db
    .select({ value: count() })
    .from(productImages)
    .where(eq(productImages.productId, productId));
  return Number(result.value);
}

// Kept for compatibility with the generated library smoke test.
export function catalog(): string {
  return 'catalog';
}
