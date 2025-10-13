import {
  pgTable,
  uuid,
  jsonb,
  decimal,
  varchar,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { products } from "./products";
import { inventories } from "./inventory";

export const variants = pgTable("variants", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").notNull(),
  sku: varchar("sku", { length: 100 }).unique().notNull(),
  priceAdjustment: decimal("price_adjustment", { precision: 10, scale: 2 })
    .notNull()
    .default("0.00"),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  attributes: jsonb("attributes").default({}),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const variantRelations = relations(variants, ({ one }) => ({
  product: one(products, {
    fields: [variants.productId],
    references: [products.id],
  }),
  inventory: one(inventories, {
    fields: [variants.id],
    references: [inventories.variantId],
  }),
}));
