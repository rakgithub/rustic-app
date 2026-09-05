import { and, desc, eq, sql } from 'drizzle-orm';
import type { DatabaseConnection } from 'database';
import { ledgerEntries, ledgerTransactions, walletAccounts } from 'database';

type Db = DatabaseConnection['db'];

export type WalletSummary = typeof walletAccounts.$inferSelect;

export async function getWallet(db: Db, ownerId: string, currency = 'EUR'): Promise<WalletSummary | null> {
  const [wallet] = await db
    .select()
    .from(walletAccounts)
    .where(and(eq(walletAccounts.ownerId, ownerId), eq(walletAccounts.currency, currency)))
    .limit(1);
  return wallet ?? null;
}

export async function getWalletTransactions(db: Db, ownerId: string, currency = 'EUR') {
  return db
    .select({
      id: ledgerEntries.id,
      amountMinor: ledgerEntries.amountMinor,
      createdAt: ledgerEntries.createdAt,
      kind: ledgerTransactions.kind,
      orderId: ledgerTransactions.orderId,
    })
    .from(ledgerEntries)
    .innerJoin(walletAccounts, eq(ledgerEntries.walletAccountId, walletAccounts.id))
    .innerJoin(ledgerTransactions, eq(ledgerEntries.transactionId, ledgerTransactions.id))
    .where(and(eq(walletAccounts.ownerId, ownerId), eq(walletAccounts.currency, currency)))
    .orderBy(desc(ledgerEntries.createdAt), desc(ledgerEntries.id));
}

export async function topUpWallet(
  db: Db,
  ownerId: string,
  amountMinor: number,
  currency = 'EUR',
): Promise<WalletSummary> {
  if (!Number.isSafeInteger(amountMinor) || amountMinor <= 0) {
    throw new Error('Top-up amount must be a positive integer in minor units');
  }

  return db.transaction(async (tx) => {
    await tx
      .insert(walletAccounts)
      .values({ ownerId, currency })
      .onConflictDoNothing();
    await tx
      .insert(walletAccounts)
      .values({ ownerId: 'platform:funding', currency })
      .onConflictDoNothing();

    const [wallet] = await tx
      .select()
      .from(walletAccounts)
      .where(and(eq(walletAccounts.ownerId, ownerId), eq(walletAccounts.currency, currency)))
      .for('update');
    const [fundingWallet] = await tx
      .select()
      .from(walletAccounts)
      .where(and(eq(walletAccounts.ownerId, 'platform:funding'), eq(walletAccounts.currency, currency)))
      .for('update');
    if (!wallet || !fundingWallet) throw new Error('Could not create wallet accounts');

    const [ledgerTransaction] = await tx
      .insert(ledgerTransactions)
      .values({ kind: 'top_up' })
      .returning();
    await tx.insert(ledgerEntries).values([
      { transactionId: ledgerTransaction.id, walletAccountId: wallet.id, amountMinor },
      { transactionId: ledgerTransaction.id, walletAccountId: fundingWallet.id, amountMinor: -amountMinor },
    ]);
    const [updated] = await tx
      .update(walletAccounts)
      .set({ balanceMinor: sql`${walletAccounts.balanceMinor} + ${amountMinor}`, updatedAt: new Date() })
      .where(eq(walletAccounts.id, wallet.id))
      .returning();
    await tx
      .update(walletAccounts)
      .set({ balanceMinor: sql`${walletAccounts.balanceMinor} - ${amountMinor}`, updatedAt: new Date() })
      .where(eq(walletAccounts.id, fundingWallet.id));
    return updated;
  });
}

// Kept for compatibility with the generated library smoke test.
export function wallet(): string {
  return 'wallet';
}
