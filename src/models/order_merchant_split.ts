import {
  pgTable,
  uuid,
  decimal,
  varchar,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { orders } from "./order";
import { merchants } from "./merchant";

export const orderMerchantSplits = pgTable("order_merchant_splits", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull(), // References orders.id
  merchantId: uuid("merchant_id")
    .notNull()
    .references(() => merchants.id),
  amountDue: decimal("amount_due", { precision: 10, scale: 2 }).notNull(),
  fee: decimal("fee", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, payout_requested, paid, reversed
  holdUntil: timestamp("hold_until").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const orderMerchantSplitRelations = relations(
  orderMerchantSplits,
  ({ one }) => ({
    order: one(orders, {
      fields: [orderMerchantSplits.orderId],
      references: [orders.id],
    }),
    merchant: one(merchants, {
      fields: [orderMerchantSplits.merchantId],
      references: [merchants.id],
    }),
  })
);
