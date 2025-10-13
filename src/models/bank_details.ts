import { pgTable, varchar, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { merchants } from "./merchant";

export const merchantBankDetails = pgTable("merchant_bank_details", {
  id: uuid("id").primaryKey().defaultRandom(),
  merchantId: uuid("merchant_id")
    .notNull()
    .references(() => merchants.id, { onDelete: "cascade" })
    .unique(),
  bankName: varchar("bank_name", { length: 100 }),
  bankCode: varchar("bank_code", { length: 3 }),
  accountNumber: varchar("account_number", { length: 10 }),
  accountName: varchar("account_name", { length: 100 }),
  recipientCode: varchar("recipient_code", { length: 50 }),
  currency: varchar("currency", { length: 3 }).default("NGN"),
  status: varchar("status", { length: 20 }).default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const merchantBankDetailsRelations = relations(
  merchantBankDetails,
  ({ one }) => ({
    merchant: one(merchants, {
      fields: [merchantBankDetails.merchantId],
      references: [merchants.merchantId],
    }),
  })
);
