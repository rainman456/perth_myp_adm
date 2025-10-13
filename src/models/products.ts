import {
  pgTable,
  uuid,
  varchar,
  text,
  decimal,
  timestamp,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { merchants } from "./merchant";
import { categories } from "./category";
import { variants } from "./variant";
import { medias } from "./media";
import { inventories } from "./inventory";

export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  merchantId: uuid("merchant_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  sku: varchar("sku", { length: 100 }).unique().notNull(),
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
  categoryId: integer("category_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const productRelations = relations(products, ({ one, many }) => ({
  merchant: one(merchants, {
    fields: [products.merchantId],
    references: [merchants.id],
  }),
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  variants: many(variants),
  medias: many(medias),
  simpleInventory: one(inventories, {
    fields: [products.id],
    references: [inventories.productId],
  }),
}));
