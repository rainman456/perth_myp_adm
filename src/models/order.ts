import {
  pgTable,
  uuid,
  decimal,
  varchar,
  timestamp,
  pgEnum,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { orderItems } from "./order_item";
import { payments } from "./payment";
import { orderMerchantSplits } from "./order_merchant_split";

export const orderStatusEnum = pgEnum('order_status', [
  'Pending',
  'Paid',
  'Processing',
  'Completed',
  'Cancelled',
  'OutForDelivery',
  'Delivered',
]);

export const orders = pgTable('orders', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  subTotal: decimal('sub_total', { precision: 10, scale: 2 }),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }),
  status: orderStatusEnum('status').notNull().default('Pending'),
  shippingMethod: varchar('shipping_method', { length: 50 }),
  couponCode: varchar('coupon_code', { length: 50 }),
  currency: varchar('currency', { length: 3 }).default('NGN'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  orderItems: many(orderItems),
  payments: many(payments),
  merchantSplits: many(orderMerchantSplits),
}));