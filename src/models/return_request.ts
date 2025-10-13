import { pgTable, uuid, text, varchar, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { orderItems } from './order_item';

export const returnRequests = pgTable('return_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderItemId: uuid('order_item_id').notNull(),
  customerId: uuid('customer_id').notNull(),
  reason: text('reason').notNull(),
  description: text('description'),
  status: varchar('status').default('pending').notNull(),
  merchantReviewedAt: timestamp('merchant_reviewed_at'),
  merchantNotes: text('merchant_notes'),
  adminEscalatedAt: timestamp('admin_escalated_at'),
  adminReviewedAt: timestamp('admin_reviewed_at'),
  adminNotes: text('admin_notes'),
  refundedAt: timestamp('refunded_at'),
  refundReference: varchar('refund_reference'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const returnRequestRelations = relations(returnRequests, ({ one }) => ({
  orderItem: one(orderItems, {
    fields: [returnRequests.orderItemId],
    references: [orderItems.id],
  }),
}));