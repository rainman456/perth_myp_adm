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
import { relations } from "drizzle-orm";  // For FK/relations if needed later
import { sql } from "drizzle-orm";
import { merchants } from "./merchant";


export const merchantApplication = pgTable("merchant_application", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v4()`).notNull(),
  storeName: varchar("store_name", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  personalEmail: varchar("personal_email", { length: 255 }).notNull().unique(),
  workEmail: varchar("work_email", { length: 255 }).notNull().unique(),
  phoneNumber: varchar("phone_number", { length: 50 }),
  personalAddress: jsonb("personal_address").notNull(),
  workAddress: jsonb("work_address").notNull(),
  businessType: varchar("business_type", { length: 100 }),
  website: varchar("website", { length: 255 }),
  businessDescription: text("business_description"),
  businessRegistrationNumber: varchar("business_registration_number", { length: 255 }).notNull().unique(),
  storeLogoUrl: varchar("store_logo_url", { length: 255 }),
  businessRegistrationCertificate: varchar("business_registration_certificate", { length: 255 }),
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
}, (table) => ({
  personalEmailIdx: uniqueIndex("uni_merchant_application_personal_email").on(table.personalEmail),
  workEmailIdx: uniqueIndex("uni_merchant_application_work_email").on(table.workEmail),
  businessRegNumIdx: uniqueIndex("uni_merchant_application_business_registration_number").on(table.businessRegistrationNumber),
}));

export const merchantApplicationRelations = relations(merchantApplication, ({ one }) => ({
  merchant: one(merchants, {
    fields: [merchantApplication.id],
    references: [merchants.applicationId],
  }),
}));

export { merchants };
