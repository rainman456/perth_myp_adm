import { pgTable, uuid, integer, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { carts } from "./cart";
import { products } from "./products";
import { merchants } from "./merchant";
import { variants } from "./variant";

export const cartItems = pgTable("cart_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  cartId: uuid("cart_id").notNull(),
  variantId: uuid("variant_id"),
  productId: uuid("product_id").notNull(),
  quantity: integer("quantity").notNull(),
  merchantId: uuid("merchant_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const cartItemRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, {
    fields: [cartItems.cartId],
    references: [carts.id],
  }),
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id],
  }),
  merchant: one(merchants, {
    fields: [cartItems.merchantId],
    references: [merchants.id],
  }),
  variant: one(variants, {
    fields: [cartItems.variantId],
    references: [variants.id],
  }),
}));
