/** Generated from the Rustic API OpenAPI document. */
export interface components {
  schemas: {
    HealthResponse: { status: 'ok' };
    ProductImage: {
      id: string;
      productId: string;
      blobUrl: string;
      blobPathname: string;
      contentType: string;
      sizeBytes: number;
      position: number;
      createdAt: string;
    };
    Product: {
      id: string;
      ownerId: string;
      title: string;
      description: string;
      priceMinor: number;
      currency: string;
      status: string;
      createdAt: string;
      updatedAt: string;
    };
    ProductInput: {
      title: string;
      description: string;
      priceMinor: number;
      currency: string;
    };
    ProductPatch: Partial<components['schemas']['ProductInput']>;
    ProductWithImages: components['schemas']['Product'] & { images: components['schemas']['ProductImage'][] };
    ProductList: {
      items: components['schemas']['ProductWithImages'][];
      page: number;
      pageSize: number;
      hasNextPage: boolean;
    };
    Wallet: {
      id: string;
      ownerId: string;
      currency: string;
      balanceMinor: number;
      createdAt: string;
      updatedAt: string;
    };
    WalletTransaction: {
      id: string;
      amountMinor: number;
      createdAt: string;
      kind: string;
      orderId: string | null;
    };
    Order: {
      id: string;
      productId: string;
      buyerId: string;
      sellerId: string;
      priceMinor: number;
      currency: string;
      idempotencyKey: string;
      createdAt: string;
    };
  };
}

type Product = components['schemas']['Product'];
type ProductWithImages = components['schemas']['ProductWithImages'];
type ProductList = components['schemas']['ProductList'];
type ErrorResponse = { error: string; details?: unknown };
type ProductId = { productId: string };
type UserHeader = { 'x-user-id': string };

export interface paths {
  '/health': { get: { responses: { 200: { content: { 'application/json': components['schemas']['HealthResponse'] } } } } };
  '/products': {
    get: {
      parameters: { query?: { page?: number; pageSize?: number } };
      responses: { 200: { content: { 'application/json': ProductList } } };
    };
    post: {
      parameters: { header: UserHeader };
      requestBody: { content: { 'application/json': components['schemas']['ProductInput'] } };
      responses: { 201: { content: { 'application/json': Product } }; 400: { content: { 'application/json': ErrorResponse } } };
    };
  };
  '/products/{productId}': {
    get: {
      parameters: { path: ProductId };
      responses: { 200: { content: { 'application/json': ProductWithImages } }; 404: { content: { 'application/json': ErrorResponse } } };
    };
    patch: {
      parameters: { path: ProductId; header: UserHeader };
      requestBody: { content: { 'application/json': components['schemas']['ProductPatch'] } };
      responses: { 200: { content: { 'application/json': Product } }; 404: { content: { 'application/json': ErrorResponse } } };
    };
    delete: {
      parameters: { path: ProductId; header: UserHeader };
      responses: { 204: { content: never }; 404: { content: { 'application/json': ErrorResponse } } };
    };
  };
  '/products/{productId}/publish': {
    post: {
      parameters: { path: ProductId; header: UserHeader };
      responses: { 200: { content: { 'application/json': { product: Product; images: components['schemas']['ProductImage'][] } } }; 400: { content: { 'application/json': ErrorResponse } } };
    };
  };
  '/me/products': {
    get: {
      parameters: { header: UserHeader };
      responses: { 200: { content: { 'application/json': ProductWithImages[] } } };
    };
  };
  '/uploads/product-image-token': {
    post: {
      parameters: { header: UserHeader };
      requestBody: { content: { 'application/json': { type: 'blob.generate-client-token'; payload: { pathname: string; multipart?: boolean; clientPayload?: string } } } };
      responses: { 200: { content: { 'application/json': Record<string, unknown> } }; 400: { content: { 'application/json': ErrorResponse } } };
    };
  };
  '/wallet': {
    get: {
      parameters: { header: UserHeader; query?: { currency?: string } };
      responses: { 200: { content: { 'application/json': components['schemas']['Wallet'] | null } } };
    };
  };
  '/wallet/transactions': {
    get: {
      parameters: { header: UserHeader; query?: { currency?: string } };
      responses: { 200: { content: { 'application/json': components['schemas']['WalletTransaction'][] } } };
    };
  };
  '/dev/wallet/top-up': {
    post: {
      parameters: { header: UserHeader };
      requestBody: { content: { 'application/json': { amountMinor: number; currency?: string } } };
      responses: { 200: { content: { 'application/json': components['schemas']['Wallet'] } } };
    };
  };
  '/products/{productId}/purchase': {
    post: {
      parameters: { path: ProductId; header: UserHeader };
      requestBody: { content: { 'application/json': { idempotencyKey: string } } };
      responses: { 201: { content: { 'application/json': components['schemas']['Order'] } }; 409: { content: { 'application/json': ErrorResponse } } };
    };
  };
  '/orders': {
    get: {
      parameters: { header: UserHeader };
      responses: { 200: { content: { 'application/json': components['schemas']['Order'][] } } };
    };
  };
  '/orders/{orderId}': {
    get: {
      parameters: { path: { orderId: string }; header: UserHeader };
      responses: { 200: { content: { 'application/json': components['schemas']['Order'] } }; 404: { content: { 'application/json': ErrorResponse } } };
    };
  };
}

export type webhooks = Record<string, never>;
export type $defs = Record<string, never>;
export type operations = Record<string, never>;
