import {
  pgTable,
  uuid,
  integer,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { products } from "./products";
import { variants } from "./variant";
import { merchants } from "./merchant";

export const inventories = pgTable("inventories", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id"),
  variantId: uuid("variant_id"),
  merchantId: uuid("merchant_id").notNull(),
  quantity: integer("quantity").notNull().default(0),
  reservedQuantity: integer("reserved_quantity").notNull().default(0),
  lowStockThreshold: integer("low_stock_threshold").default(5),
  backorderAllowed: boolean("backorder_allowed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const inventoryRelations = relations(inventories, ({ one }) => ({
  product: one(products, {
    fields: [inventories.productId],
    references: [products.id],
  }),
  variant: one(variants, {
    fields: [inventories.variantId],
    references: [variants.id],
  }),
  merchant: one(merchants, {
    fields: [inventories.merchantId],
    references: [merchants.id],
  }),
}));
