// Merchant schema, including applications and merchants
import {
  pgTable,
  varchar,
  text,
  timestamp,
  decimal,
  jsonb,
  index,
  uniqueIndex,
  uuid,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm"; // For FK/relations if needed later
import { sql } from "drizzle-orm";
import { merchantApplication } from "./merchant_applications";
import { products } from "./products";
import { cartItems } from "./cart_item";
import { orderItems } from "./order_item";
import { payouts } from "./payout";

// Merchant table (migrated by TS, queries both)
export const merchants = pgTable(
  "merchant",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    applicationId: uuid("application_id").notNull().unique(),
    merchantId: uuid("merchant_id").notNull().unique(),
    storeName: varchar("store_name", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    personalEmail: varchar("personal_email", { length: 255 })
      .notNull()
      .unique(),
    workEmail: varchar("work_email", { length: 255 }).notNull().unique(),
    phoneNumber: varchar("phone_number", { length: 50 }),
    personalAddress: jsonb("personal_address").notNull(),
    workAddress: jsonb("work_address").notNull(),
    businessType: varchar("business_type", { length: 100 }),
    website: varchar("website", { length: 255 }),
    businessDescription: text("business_description"),
    businessRegistrationNumber: varchar("business_registration_number", {
      length: 255,
    })
      .notNull()
      .unique(),
    businessRegistrationCertificate: varchar(
      "business_registration_certificate",
      { length: 255 }
    ),
    storeLogoUrl: varchar("store_logo_url", { length: 255 }),
    password: varchar("password", { length: 255 }).notNull(),
    status: varchar("status", { length: 20 }).notNull().default("active"),
    commissionTier: varchar("commission_tier").default("standard"),
    commissionRate: decimal("commission_rate", {
      precision: 10,
      scale: 2,
    }).default("5.00"),
    accountBalance: decimal("account_balance", {
      precision: 15,
      scale: 2,
    }).default("0.00"),
    totalSales: decimal("total_sales", { precision: 15, scale: 2 }).default(
      "0.00"
    ),
    totalPayouts: decimal("total_payouts", { precision: 15, scale: 2 }).default(
      "0.00"
    ),
    //stripeAccountId: text("stripe_account_id"),
    accountId: text("account_id"),
    payoutSchedule: varchar("payout_schedule").default("weekly"),
    lastPayoutDate: timestamp("last_payout_date", { mode: "date" }),
    banner: varchar("banner", { length: 255 }),
    policies: jsonb("policies"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({
    statusIdx: index("merchant_status_idx").on(table.status), // For filtering active/suspended
  })
);

// Relations for joins (admin API queries) - merged one and many relations
export const merchantsRelations = relations(merchants, ({ one, many }) => ({
  application: one(merchantApplication, {
    fields: [merchants.applicationId],
    references: [merchantApplication.id],
  }),
  products: many(products),
  cartItems: many(cartItems),
  orderItems: many(orderItems),
  payouts: many(payouts),
  // promotions: many(promotions),
}));
