import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { merchants } from "./merchant";

export const merchantBankDetails = pgTable(
  "merchant_bank_details",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    merchantId: uuid("merchant_id")
      .notNull()
      .unique(), // Changed: references merchantId, not id
    bankName: varchar("bank_name", { length: 255 }),
    bankCode: varchar("bank_code", { length: 10 }).notNull(),
    accountNumber: varchar("account_number", { length: 255 }).notNull(),
    accountName: varchar("account_name", { length: 255 }),
    recipientCode: varchar("recipient_code", { length: 50 }), // Changed size to match GORM
    currency: varchar("currency", { length: 8 }).default("NGN"), // Changed size to match GORM
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    merchantIdIdx: index("idx_bank_details_merchant_id").on(table.merchantId),
  })
);

export const merchantBankDetailsRelations = relations(
  merchantBankDetails,
  ({ one }) => ({
    merchant: one(merchants, {
      fields: [merchantBankDetails.merchantId],
      references: [merchants.merchantId], // Changed: reference merchantId field
    }),
  })
);

export type MerchantBankDetails = typeof merchantBankDetails.$inferSelect;
export type NewMerchantBankDetails = typeof merchantBankDetails.$inferInsert;