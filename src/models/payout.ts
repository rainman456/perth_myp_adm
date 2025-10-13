import {
  pgTable,
  uuid,
  decimal,
  varchar,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { merchants } from "./merchant";

export const payouts = pgTable("payouts", {
  id: uuid("id").defaultRandom().primaryKey(),
  merchantId: uuid("merchant_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("Pending"),
  payoutAccountId: varchar("payout_account_id", { length: 255 }).notNull(),
  paystackTransferId: varchar("paystack_transfer_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const payoutRelations = relations(payouts, ({ one }) => ({
  merchant: one(merchants, {
    fields: [payouts.merchantId],
    references: [merchants.id],
  }),
}));
