import {
  pgTable,
  uuid,
  integer,
  decimal,
  varchar,
  timestamp,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { orders } from "./order";
import { products } from "./products";
import { variants } from "./variant";
import { merchants } from "./merchant";

export const fulfillmentStatusEnum = pgEnum('fulfillment_status', [
  'Processing',
  'Confirmed',
  'Declined',
  'SentToAronovaHub',
  'OutForDelivery',
  'Delivered',  // ← ADD THIS
]);

export const orderItems = pgTable('order_items', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  orderId: integer('order_id')
    .notNull()
    .references(() => orders.id),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id),
  variantId: uuid('variant_id').references(() => variants.id),
  merchantId: uuid('merchant_id')
    .notNull()
    .references(() => merchants.merchantId),
  quantity: integer('quantity').notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  fulfillmentStatus: fulfillmentStatusEnum('fulfillment_status').notNull().default('Processing'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  orderIdIdx: index('idx_orderitem_order_id').on(table.orderId),
  productIdIdx: index('idx_orderitem_product_id').on(table.productId),
  variantIdIdx: index('idx_orderitem_variant_id').on(table.variantId),
  merchantIdIdx: index('idx_orderitem_merchant_id').on(table.merchantId),
}));


export const orderItemsRelations = relations(orderItems, ({ one }) => ({
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
    references: [merchants.merchantId],
  }),
}));
