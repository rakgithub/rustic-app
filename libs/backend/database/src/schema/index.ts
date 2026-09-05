import {
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const products = pgTable(
  'products',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    ownerId: text('owner_id').notNull(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    priceMinor: integer('price_minor').notNull(),
    currency: text('currency').notNull(),
    status: text('status').notNull().default('draft'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    ownerStatusIndex: index('products_owner_id_id_idx').on(
      table.ownerId,
      table.id,
    ),
  }),
);

export const productImages = pgTable(
  'product_images',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    blobUrl: text('blob_url').notNull(),
    blobPathname: text('blob_pathname').notNull(),
    contentType: text('content_type').notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    position: integer('position').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    productPositionIndex: index('product_images_product_id_position_idx').on(
      table.productId,
      table.position,
    ),
  }),
);

export const walletAccounts = pgTable(
  'wallet_accounts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    ownerId: text('owner_id').notNull(),
    currency: text('currency').notNull(),
    balanceMinor: integer('balance_minor').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    ownerCurrencyUnique: uniqueIndex('wallet_accounts_owner_currency_idx').on(table.ownerId, table.currency),
  }),
);

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    productId: uuid('product_id').notNull().references(() => products.id),
    buyerId: text('buyer_id').notNull(),
    sellerId: text('seller_id').notNull(),
    priceMinor: integer('price_minor').notNull(),
    currency: text('currency').notNull(),
    idempotencyKey: text('idempotency_key').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    productUnique: uniqueIndex('orders_product_id_idx').on(table.productId),
    buyerCreatedIndex: index('orders_buyer_id_created_at_idx').on(table.buyerId, table.createdAt),
    idempotencyUnique: uniqueIndex('orders_buyer_idempotency_key_idx').on(table.buyerId, table.idempotencyKey),
  }),
);

export const ledgerTransactions = pgTable(
  'ledger_transactions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    kind: text('kind').notNull(),
    orderId: uuid('order_id').references(() => orders.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({ orderIndex: index('ledger_transactions_order_id_idx').on(table.orderId) }),
);

export const ledgerEntries = pgTable(
  'ledger_entries',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    transactionId: uuid('transaction_id').notNull().references(() => ledgerTransactions.id),
    walletAccountId: uuid('wallet_account_id').notNull().references(() => walletAccounts.id),
    amountMinor: integer('amount_minor').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({ transactionIndex: index('ledger_entries_transaction_id_idx').on(table.transactionId) }),
);
