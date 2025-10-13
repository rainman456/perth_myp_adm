// Dispute schema
import { pgTable, varchar, text, timestamp } from 'drizzle-orm/pg-core';

export const disputes = pgTable('disputes', {
  id: varchar('id').primaryKey(),
  orderId: varchar('order_id').notNull(),
  customerId: varchar('customer_id').notNull(),
  merchantId: varchar('merchant_id').notNull(),
  reason: text('reason').notNull(),
  description: text('description').notNull(),
  status: text('status').notNull().default('open'),
  resolution: text('resolution'),
  createdAt: timestamp('created_at').defaultNow(),
  resolvedAt: timestamp('resolved_at'),
});
