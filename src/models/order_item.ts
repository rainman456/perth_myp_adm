import {
  pgTable,
  uuid,
  integer,
  decimal,
  varchar,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { orders } from "./order";
import { products } from "./products";
import { variants } from "./variant";
import { merchants } from "./merchant";

export const orderItems = pgTable("order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").notNull(),
  productId: uuid("product_id").notNull(),
  variantId: uuid("variant_id").notNull(),
  merchantId: uuid("merchant_id").notNull(),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
 // variantId: uuid("variant_id"),
  fulfillmentStatus: varchar("fulfillment_status", { length: 20 })
    .notNull()
    .default("New"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const orderItemRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
  variant: one(variants, {
    fields: [orderItems.variantId],
    references: [variants.id],
  }),
  merchant: one(merchants, {
    fields: [orderItems.merchantId],
    references: [merchants.id],
  }),
}));
