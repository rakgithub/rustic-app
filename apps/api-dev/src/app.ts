import { head } from '@vercel/blob';
import { handleUpload } from '@vercel/blob/client';
import type { Context } from 'hono';
import { OpenAPIHono, z } from '@hono/zod-openapi';
import { getDatabase } from 'database';
import {
  addOwnedProductImage,
  createProduct,
  deleteOwnedProduct,
  getOwnedProduct,
  getPublishedProduct,
  listOwnedProducts,
  listPublishedProducts,
  productInputSchema,
  productPatchSchema,
  publishOwnedProduct,
  updateOwnedProduct,
} from 'catalog';
import { getOrder, listOrders, PurchaseError, purchaseProduct } from 'orders';
import { getWallet, getWalletTransactions, topUpWallet } from 'wallet';

const HealthResponseSchema = z
  .object({
    status: z.literal('ok'),
  })
  .openapi('HealthResponse');

export const app = new OpenAPIHono();

app.get('/health', (context) => context.json({ status: 'ok' as const }));

const pageSchema = z.coerce.number().int().min(1).max(10_000).default(1);
const pageSizeSchema = z.coerce.number().int().min(1).max(50).default(20);
const productIdSchema = z.string().uuid();
const uploadRequestSchema = z.object({
  type: z.literal('blob.generate-client-token'),
  payload: z.object({
    pathname: z.string().min(1).max(300),
    multipart: z.boolean().default(false),
    clientPayload: z.string().default(''),
  }),
});
const topUpSchema = z.object({
  amountMinor: z.number().int().positive().max(100_000_000),
  currency: z.string().regex(/^[A-Z]{3}$/).default('EUR'),
});
const purchaseSchema = z.object({ idempotencyKey: z.string().trim().min(1).max(200) });

const productImageResponseSchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  blobUrl: z.string().url(),
  blobPathname: z.string(),
  contentType: z.string(),
  sizeBytes: z.number().int(),
  position: z.number().int(),
  createdAt: z.string().datetime(),
});
const productResponseSchema = z.object({
  id: z.string().uuid(),
  ownerId: z.string(),
  title: z.string(),
  description: z.string(),
  priceMinor: z.number().int(),
  currency: z.string(),
  status: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
const productWithImagesResponseSchema = productResponseSchema.extend({
  images: z.array(productImageResponseSchema),
});
const productListResponseSchema = z.object({
  items: z.array(productWithImagesResponseSchema),
  page: z.number().int(),
  pageSize: z.number().int(),
  hasNextPage: z.boolean(),
});
const errorResponseSchema = z.object({ error: z.string() });
const walletResponseSchema = z.object({
  id: z.string().uuid(), ownerId: z.string(), currency: z.string(), balanceMinor: z.number().int(),
  createdAt: z.string().datetime(), updatedAt: z.string().datetime(),
});
const orderResponseSchema = z.object({
  id: z.string().uuid(), productId: z.string().uuid(), buyerId: z.string(), sellerId: z.string(),
  priceMinor: z.number().int(), currency: z.string(), idempotencyKey: z.string(), createdAt: z.string().datetime(),
});
const walletTransactionResponseSchema = z.object({
  id: z.string().uuid(), amountMinor: z.number().int(), createdAt: z.string().datetime(),
  kind: z.string(), orderId: z.string().uuid().nullable(),
});

function ownerIdFromRequest(context: Context): string | null {
  // Phase 5 auth will replace this development identity with the verified session subject.
  const ownerId = context.req.header('x-user-id')?.trim();
  return ownerId || null;
}

app.get('/products', async (context) => {
  const page = pageSchema.parse(context.req.query('page'));
  const pageSize = pageSizeSchema.parse(context.req.query('pageSize'));
  const result = await listPublishedProducts(getDatabase().db, page, pageSize);
  return context.json(result, 200);
});

app.get('/products/:productId', async (context) => {
  const productId = productIdSchema.safeParse(context.req.param('productId'));
  if (!productId.success) return context.json({ error: 'Invalid product ID' }, 400);

  const product = await getPublishedProduct(getDatabase().db, productId.data);
  if (!product) return context.json({ error: 'Product not found' }, 404);
  return context.json(product, 200);
});

app.post('/products', async (context) => {
  const ownerId = ownerIdFromRequest(context);
  if (!ownerId) return context.json({ error: 'Authentication required' }, 401);

  const input = productInputSchema.safeParse(await context.req.json().catch(() => null));
  if (!input.success) return context.json({ error: 'Invalid product', details: input.error.flatten() }, 400);

  const product = await createProduct(getDatabase().db, ownerId, input.data);
  return context.json(product, 201);
});

app.patch('/products/:productId', async (context) => {
  const ownerId = ownerIdFromRequest(context);
  if (!ownerId) return context.json({ error: 'Authentication required' }, 401);
  const productId = productIdSchema.safeParse(context.req.param('productId'));
  if (!productId.success) return context.json({ error: 'Invalid product ID' }, 400);

  const input = productPatchSchema.safeParse(await context.req.json().catch(() => null));
  if (!input.success) return context.json({ error: 'Invalid product', details: input.error.flatten() }, 400);

  const product = await updateOwnedProduct(getDatabase().db, ownerId, productId.data, input.data);
  if (!product) return context.json({ error: 'Product not found' }, 404);
  return context.json(product, 200);
});

app.post('/products/:productId/publish', async (context) => {
  const ownerId = ownerIdFromRequest(context);
  if (!ownerId) return context.json({ error: 'Authentication required' }, 401);
  const productId = productIdSchema.safeParse(context.req.param('productId'));
  if (!productId.success) return context.json({ error: 'Invalid product ID' }, 400);

  try {
    const result = await publishOwnedProduct(getDatabase().db, ownerId, productId.data);
    if (!result) return context.json({ error: 'Product not found' }, 404);
    return context.json(result, 200);
  } catch (error) {
    if (error instanceof Error && error.message.includes('requires valid')) {
      return context.json({ error: error.message }, 400);
    }
    throw error;
  }
});

app.delete('/products/:productId', async (context) => {
  const ownerId = ownerIdFromRequest(context);
  if (!ownerId) return context.json({ error: 'Authentication required' }, 401);
  const productId = productIdSchema.safeParse(context.req.param('productId'));
  if (!productId.success) return context.json({ error: 'Invalid product ID' }, 400);

  const deleted = await deleteOwnedProduct(getDatabase().db, ownerId, productId.data);
  if (!deleted) return context.json({ error: 'Product not found' }, 404);
  return context.body(null, 204);
});

app.get('/me/products', async (context) => {
  const ownerId = ownerIdFromRequest(context);
  if (!ownerId) return context.json({ error: 'Authentication required' }, 401);
  return context.json(await listOwnedProducts(getDatabase().db, ownerId), 200);
});

app.get('/wallet', async (context) => {
  const ownerId = ownerIdFromRequest(context);
  if (!ownerId) return context.json({ error: 'Authentication required' }, 401);
  const currency = context.req.query('currency') ?? 'EUR';
  return context.json(await getWallet(getDatabase().db, ownerId, currency), 200);
});

app.get('/wallet/transactions', async (context) => {
  const ownerId = ownerIdFromRequest(context);
  if (!ownerId) return context.json({ error: 'Authentication required' }, 401);
  const currency = context.req.query('currency') ?? 'EUR';
  return context.json(await getWalletTransactions(getDatabase().db, ownerId, currency), 200);
});

app.post('/dev/wallet/top-up', async (context) => {
  const ownerId = ownerIdFromRequest(context);
  if (!ownerId) return context.json({ error: 'Authentication required' }, 401);
  if (process.env['NODE_ENV'] === 'production') return context.json({ error: 'Not available in production' }, 404);
  const input = topUpSchema.safeParse(await context.req.json().catch(() => null));
  if (!input.success) return context.json({ error: 'Invalid top-up amount' }, 400);
  return context.json(await topUpWallet(getDatabase().db, ownerId, input.data.amountMinor, input.data.currency), 200);
});

app.post('/products/:productId/purchase', async (context) => {
  const ownerId = ownerIdFromRequest(context);
  if (!ownerId) return context.json({ error: 'Authentication required' }, 401);
  const productId = productIdSchema.safeParse(context.req.param('productId'));
  if (!productId.success) return context.json({ error: 'Invalid product ID' }, 400);
  const input = purchaseSchema.safeParse(await context.req.json().catch(() => null));
  if (!input.success) return context.json({ error: 'A valid idempotency key is required' }, 400);
  try {
    return context.json(await purchaseProduct(getDatabase().db, ownerId, productId.data, input.data.idempotencyKey), 201);
  } catch (error) {
    if (error instanceof PurchaseError) return context.json({ error: error.message }, 409);
    throw error;
  }
});

app.get('/orders', async (context) => {
  const ownerId = ownerIdFromRequest(context);
  if (!ownerId) return context.json({ error: 'Authentication required' }, 401);
  return context.json(await listOrders(getDatabase().db, ownerId), 200);
});

app.get('/orders/:orderId', async (context) => {
  const ownerId = ownerIdFromRequest(context);
  if (!ownerId) return context.json({ error: 'Authentication required' }, 401);
  const orderId = productIdSchema.safeParse(context.req.param('orderId'));
  if (!orderId.success) return context.json({ error: 'Invalid order ID' }, 400);
  const order = await getOrder(getDatabase().db, ownerId, orderId.data);
  if (!order) return context.json({ error: 'Order not found' }, 404);
  return context.json(order, 200);
});

app.post('/uploads/product-image-token', async (context) => {
  const ownerId = ownerIdFromRequest(context);
  if (!ownerId) return context.json({ error: 'Authentication required' }, 401);
  const blobToken = process.env['BLOB_READ_WRITE_TOKEN'];
  if (!blobToken) return context.json({ error: 'Blob storage is not configured' }, 503);

  const parsed = uploadRequestSchema.safeParse(await context.req.json().catch(() => null));
  if (!parsed.success) return context.json({ error: 'Invalid upload request' }, 400);

  const pathnameMatch = /^products\/([0-9a-f-]{36})\/([a-zA-Z0-9][a-zA-Z0-9._-]*)$/.exec(
    parsed.data.payload.pathname,
  );
  if (!pathnameMatch) return context.json({ error: 'Invalid product image pathname' }, 400);
  const productId = pathnameMatch[1];
  const extension = pathnameMatch[2].split('.').pop()?.toLowerCase();
  if (!extension || !['jpg', 'jpeg', 'png', 'webp', 'avif'].includes(extension)) {
    return context.json({ error: 'Only image uploads are supported' }, 400);
  }

  const product = await getOwnedProduct(getDatabase().db, ownerId, productId);
  if (!product || product.status !== 'draft') {
    return context.json({ error: 'Draft product not found' }, 404);
  }

  const result = await handleUpload({
    token: blobToken,
    request: context.req.raw,
    body: parsed.data,
    onBeforeGenerateToken: async () => ({
      allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
      maximumSizeInBytes: 10 * 1024 * 1024,
      addRandomSuffix: true,
      tokenPayload: JSON.stringify({ ownerId, productId }),
    }),
    onUploadCompleted: async ({ blob, tokenPayload }) => {
      const token = tokenPayload ? JSON.parse(tokenPayload) as { ownerId: string; productId: string } : null;
      if (!token || token.ownerId !== ownerId || token.productId !== productId) {
        throw new Error('Invalid upload token payload');
      }
      const metadata = await head(blob.url, { token: blobToken });
      await addOwnedProductImage(getDatabase().db, token.ownerId, token.productId, {
        blobUrl: metadata.url,
        blobPathname: metadata.pathname,
        contentType: metadata.contentType,
        sizeBytes: metadata.size,
        position: 0,
      });
    },
  });

  return context.json(result, 200);
});

app.openAPIRegistry.registerPath({
  method: 'get',
  path: '/health',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: HealthResponseSchema,
        },
      },
      description: 'Confirms that the API is running',
    },
  },
});

app.openAPIRegistry.registerPath({
  method: 'get',
  path: '/products',
  request: {
    query: z.object({ page: pageSchema.optional(), pageSize: pageSizeSchema.optional() }),
  },
  responses: {
    200: { description: 'Published products', content: { 'application/json': { schema: productListResponseSchema } } },
  },
});

app.openAPIRegistry.registerPath({
  method: 'get',
  path: '/products/{productId}',
  request: { params: z.object({ productId: productIdSchema }) },
  responses: {
    200: { description: 'Published product', content: { 'application/json': { schema: productWithImagesResponseSchema } } },
    404: { description: 'Product not found', content: { 'application/json': { schema: errorResponseSchema } } },
  },
});

app.openAPIRegistry.registerPath({
  method: 'post',
  path: '/products',
  request: {
    headers: z.object({ 'x-user-id': z.string().min(1) }),
    body: { content: { 'application/json': { schema: productInputSchema } } },
  },
  responses: {
    201: { description: 'Draft product', content: { 'application/json': { schema: productResponseSchema } } },
    400: { description: 'Invalid product', content: { 'application/json': { schema: errorResponseSchema } } },
  },
});

app.openAPIRegistry.registerPath({
  method: 'patch',
  path: '/products/{productId}',
  request: {
    params: z.object({ productId: productIdSchema }),
    headers: z.object({ 'x-user-id': z.string().min(1) }),
    body: { content: { 'application/json': { schema: productPatchSchema } } },
  },
  responses: {
    200: { description: 'Updated product', content: { 'application/json': { schema: productResponseSchema } } },
    404: { description: 'Product not found', content: { 'application/json': { schema: errorResponseSchema } } },
  },
});

app.openAPIRegistry.registerPath({
  method: 'post',
  path: '/products/{productId}/publish',
  request: { params: z.object({ productId: productIdSchema }), headers: z.object({ 'x-user-id': z.string().min(1) }) },
  responses: {
    200: { description: 'Published product', content: { 'application/json': { schema: z.object({ product: productResponseSchema, images: z.array(productImageResponseSchema) }) } } },
    400: { description: 'Product is not ready', content: { 'application/json': { schema: errorResponseSchema } } },
  },
});

app.openAPIRegistry.registerPath({
  method: 'delete',
  path: '/products/{productId}',
  request: { params: z.object({ productId: productIdSchema }), headers: z.object({ 'x-user-id': z.string().min(1) }) },
  responses: { 204: { description: 'Product deleted' }, 404: { description: 'Product not found', content: { 'application/json': { schema: errorResponseSchema } } } },
});

app.openAPIRegistry.registerPath({
  method: 'get',
  path: '/me/products',
  request: { headers: z.object({ 'x-user-id': z.string().min(1) }) },
  responses: { 200: { description: 'Seller products', content: { 'application/json': { schema: z.array(productWithImagesResponseSchema) } } } },
});

app.openAPIRegistry.registerPath({
  method: 'post',
  path: '/uploads/product-image-token',
  request: {
    headers: z.object({ 'x-user-id': z.string().min(1) }),
    body: { content: { 'application/json': { schema: uploadRequestSchema } } },
  },
  responses: { 200: { description: 'Vercel Blob client upload token', content: { 'application/json': { schema: z.record(z.string(), z.unknown()) } } } },
});

app.openAPIRegistry.registerPath({
  method: 'get', path: '/wallet',
  request: { headers: z.object({ 'x-user-id': z.string().min(1) }), query: z.object({ currency: z.string().optional() }) },
  responses: { 200: { description: 'Wallet balance', content: { 'application/json': { schema: walletResponseSchema.nullable() } } } },
});

app.openAPIRegistry.registerPath({
  method: 'get', path: '/wallet/transactions',
  request: { headers: z.object({ 'x-user-id': z.string().min(1) }), query: z.object({ currency: z.string().optional() }) },
  responses: { 200: { description: 'Wallet ledger entries', content: { 'application/json': { schema: z.array(walletTransactionResponseSchema) } } } },
});

app.openAPIRegistry.registerPath({
  method: 'post', path: '/dev/wallet/top-up',
  request: { headers: z.object({ 'x-user-id': z.string().min(1) }), body: { content: { 'application/json': { schema: topUpSchema } } } },
  responses: { 200: { description: 'Updated wallet', content: { 'application/json': { schema: walletResponseSchema } } } },
});

app.openAPIRegistry.registerPath({
  method: 'post', path: '/products/{productId}/purchase',
  request: { params: z.object({ productId: productIdSchema }), headers: z.object({ 'x-user-id': z.string().min(1) }), body: { content: { 'application/json': { schema: purchaseSchema } } } },
  responses: { 201: { description: 'Completed order', content: { 'application/json': { schema: orderResponseSchema } } }, 409: { description: 'Purchase rejected', content: { 'application/json': { schema: errorResponseSchema } } } },
});

app.openAPIRegistry.registerPath({
  method: 'get', path: '/orders', request: { headers: z.object({ 'x-user-id': z.string().min(1) }) },
  responses: { 200: { description: 'Buyer orders', content: { 'application/json': { schema: z.array(orderResponseSchema) } } } },
});

app.openAPIRegistry.registerPath({
  method: 'get', path: '/orders/{orderId}', request: { params: z.object({ orderId: productIdSchema }), headers: z.object({ 'x-user-id': z.string().min(1) }) },
  responses: { 200: { description: 'Buyer order', content: { 'application/json': { schema: orderResponseSchema } } }, 404: { description: 'Order not found', content: { 'application/json': { schema: errorResponseSchema } } } },
});

app.doc('/openapi.json', {
  openapi: '3.1.0',
  info: {
    title: 'Rustic API',
    version: '1.0.0',
  },
});

export type App = typeof app;
