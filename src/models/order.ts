import {
  pgTable,
  uuid,
  decimal,
  varchar,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { orderItems } from "./order_item";
import { payments } from "./payment";

export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  subTotal: decimal("sub_total", { precision: 10, scale: 2 }),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("Pending"),
  shippingMethod: varchar("shipping_method", { length: 50 }),
  couponCode: varchar("coupon_code", { length: 50 }),
  paymentReference: varchar("payment_reference", { length: 255 }),
  currency: varchar("currency", { length: 3 }).default("NGN"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const orderRelations = relations(orders, ({ many, one }) => ({
  orderItems: many(orderItems),
  payments: many(payments),
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
}));
