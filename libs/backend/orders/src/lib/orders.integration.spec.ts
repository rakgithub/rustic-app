import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { createDatabase, ledgerEntries, ledgerTransactions, products } from 'database';
import { getWallet, topUpWallet } from 'wallet';
import { PurchaseError, purchaseProduct } from './orders';

const testUrl = process.env['TEST_DATABASE_URL'];
const canRun = Boolean(testUrl) && testUrl !== process.env['DATABASE_URL'];
const describeDatabase = canRun ? describe : describe.skip;

describeDatabase('purchase transaction (PostgreSQL)', () => {
  const connection = createDatabase(testUrl ?? 'postgres://localhost/rustic_test', { maxConnections: 1, prepare: false });

  beforeEach(async () => {
    await connection.client.unsafe(
      'TRUNCATE TABLE ledger_entries, ledger_transactions, orders, wallet_accounts, product_images, products RESTART IDENTITY CASCADE',
    );
  });

  afterAll(async () => { await connection.close(); });

  async function publishedProduct(sellerId: string, priceMinor = 500) {
    const [product] = await connection.db.insert(products).values({
      ownerId: sellerId, title: 'Test jacket', description: 'A test product', priceMinor, currency: 'EUR', status: 'published',
    }).returning();
    return product;
  }

  it('returns the original order when the same idempotency key is submitted twice', async () => {
    const product = await publishedProduct('seller');
    await topUpWallet(connection.db, 'buyer', 1_000);
    const key = randomUUID();
    const first = await purchaseProduct(connection.db, 'buyer', product.id, key);
    const retry = await purchaseProduct(connection.db, 'buyer', product.id, key);
    expect(retry.id).toBe(first.id);
  });

  it('allows only one buyer to purchase a product concurrently', async () => {
    const product = await publishedProduct('seller');
    await Promise.all([topUpWallet(connection.db, 'buyer-a', 1_000), topUpWallet(connection.db, 'buyer-b', 1_000)]);
    const results = await Promise.allSettled([
      purchaseProduct(connection.db, 'buyer-a', product.id, randomUUID()),
      purchaseProduct(connection.db, 'buyer-b', product.id, randomUUID()),
    ]);
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
  });

  it('rejects insufficient funds and self-purchases', async () => {
    const product = await publishedProduct('seller');
    await expect(purchaseProduct(connection.db, 'buyer', product.id, randomUUID())).rejects.toBeInstanceOf(PurchaseError);
    await expect(purchaseProduct(connection.db, 'seller', product.id, randomUUID())).rejects.toBeInstanceOf(PurchaseError);
  });

  it('rolls back an injected failure after creating an order', async () => {
    const product = await publishedProduct('seller');
    await topUpWallet(connection.db, 'buyer', 1_000);
    await expect(purchaseProduct(connection.db, 'buyer', product.id, randomUUID(), { failAfterOrder: true })).rejects.toThrow('Injected purchase failure');
    const [storedProduct] = await connection.db.select().from(products).where(eq(products.id, product.id));
    expect(storedProduct.status).toBe('published');
    expect(await getWallet(connection.db, 'buyer')).toMatchObject({ balanceMinor: 1_000 });
  });

  it('creates balanced ledger transactions', async () => {
    const product = await publishedProduct('seller');
    await topUpWallet(connection.db, 'buyer', 1_000);
    await purchaseProduct(connection.db, 'buyer', product.id, randomUUID());
    const transactions = await connection.db.select().from(ledgerTransactions);
    for (const transaction of transactions) {
      const entries = await connection.db.select().from(ledgerEntries).where(eq(ledgerEntries.transactionId, transaction.id));
      expect(entries.reduce((total, entry) => total + entry.amountMinor, 0)).toBe(0);
    }
  });
});
