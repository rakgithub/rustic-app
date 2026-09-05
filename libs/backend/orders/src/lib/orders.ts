import { and, desc, eq, sql } from 'drizzle-orm';
import type { DatabaseConnection } from 'database';
import { ledgerEntries, ledgerTransactions, orders as ordersTable, products, walletAccounts } from 'database';

type Db = DatabaseConnection['db'];
export type Order = typeof ordersTable.$inferSelect;

export class PurchaseError extends Error {}

export async function purchaseProduct(
  db: Db,
  buyerId: string,
  productId: string,
  idempotencyKey: string,
  options: { failAfterOrder?: boolean } = {},
): Promise<Order> {
  if (!idempotencyKey.trim() || idempotencyKey.length > 200) {
    throw new PurchaseError('A valid idempotency key is required');
  }

  try {
    return await db.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(ordersTable)
        .where(and(eq(ordersTable.buyerId, buyerId), eq(ordersTable.idempotencyKey, idempotencyKey)))
        .limit(1);
      if (existing) return existing;

      const [product] = await tx
        .select()
        .from(products)
        .where(eq(products.id, productId))
        .for('update');
      if (!product || product.status !== 'published') throw new PurchaseError('Product is not available');
      if (product.ownerId === buyerId) throw new PurchaseError('You cannot purchase your own product');

      await tx.insert(walletAccounts).values([
        { ownerId: buyerId, currency: product.currency },
        { ownerId: product.ownerId, currency: product.currency },
      ]).onConflictDoNothing();

      const [buyerWallet] = await tx
        .select()
        .from(walletAccounts)
        .where(and(eq(walletAccounts.ownerId, buyerId), eq(walletAccounts.currency, product.currency)))
        .for('update');
      const [sellerWallet] = await tx
        .select()
        .from(walletAccounts)
        .where(and(eq(walletAccounts.ownerId, product.ownerId), eq(walletAccounts.currency, product.currency)))
        .for('update');
      if (!buyerWallet || !sellerWallet) throw new PurchaseError('Wallets could not be prepared');
      if (buyerWallet.balanceMinor < product.priceMinor) throw new PurchaseError('Insufficient wallet balance');

      const [order] = await tx
        .insert(ordersTable)
        .values({
          productId: product.id,
          buyerId,
          sellerId: product.ownerId,
          priceMinor: product.priceMinor,
          currency: product.currency,
          idempotencyKey,
        })
        .returning();
      if (options.failAfterOrder) throw new Error('Injected purchase failure');

      await tx
        .update(products)
        .set({ status: 'sold', updatedAt: new Date() })
        .where(and(eq(products.id, product.id), eq(products.status, 'published')));
      const [ledgerTransaction] = await tx
        .insert(ledgerTransactions)
        .values({ kind: 'purchase', orderId: order.id })
        .returning();
      await tx.insert(ledgerEntries).values([
        { transactionId: ledgerTransaction.id, walletAccountId: buyerWallet.id, amountMinor: -product.priceMinor },
        { transactionId: ledgerTransaction.id, walletAccountId: sellerWallet.id, amountMinor: product.priceMinor },
      ]);
      await tx
        .update(walletAccounts)
        .set({ balanceMinor: sql`${walletAccounts.balanceMinor} - ${product.priceMinor}`, updatedAt: new Date() })
        .where(eq(walletAccounts.id, buyerWallet.id));
      await tx
        .update(walletAccounts)
        .set({ balanceMinor: sql`${walletAccounts.balanceMinor} + ${product.priceMinor}`, updatedAt: new Date() })
        .where(eq(walletAccounts.id, sellerWallet.id));
      return order;
    });
  } catch (error) {
    const [existing] = await db
      .select()
      .from(ordersTable)
      .where(and(eq(ordersTable.buyerId, buyerId), eq(ordersTable.idempotencyKey, idempotencyKey)))
      .limit(1);
    if (existing) return existing;
    throw error;
  }
}

export async function listOrders(db: Db, ownerId: string): Promise<Order[]> {
  return db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.buyerId, ownerId))
    .orderBy(desc(ordersTable.createdAt), desc(ordersTable.id));
}

export async function getOrder(db: Db, ownerId: string, orderId: string): Promise<Order | null> {
  const [order] = await db
    .select()
    .from(ordersTable)
    .where(and(eq(ordersTable.id, orderId), eq(ordersTable.buyerId, ownerId)))
    .limit(1);
  return order ?? null;
}

// Kept for compatibility with the generated library smoke test.
export function orders(): string {
  return 'orders';
}
