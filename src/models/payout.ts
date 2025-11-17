import {
  pgTable,
  uuid,
  decimal,
  varchar,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { merchants } from "./merchant";

export const payoutStatusEnum = pgEnum('payout_status', [
  'Pending', 
  'Completed', 
  'Open',
  'pending',      // Add lowercase
  'completed',    // Add lowercase
  'processing',   // Add this
  'failed'        // Add this
]);

export const payouts = pgTable('payouts', {
  id: uuid('id').primaryKey().defaultRandom(),
  merchantId: uuid('merchant_id')
    .notNull()
    .references(() => merchants.merchantId),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  status: payoutStatusEnum('status').notNull().default('Pending'),
  payoutAccountId: varchar('payout_account_id', { length: 255 }),
  paystackTransferId: varchar('paystack_transfer_id', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  merchantIdIdx: index('idx_payout_merchant_id').on(table.merchantId),
}));
export const payoutRelations = relations(payouts, ({ one }) => ({
  merchant: one(merchants, {
    fields: [payouts.merchantId],
    references: [merchants.merchantId],  // ← CHANGED FROM merchants.id
  }),
}));

export type Payout = typeof payouts.$inferSelect;
export type NewPayout = typeof payouts.$inferInsert;