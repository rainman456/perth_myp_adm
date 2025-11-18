import { pgTable, uuid, text, varchar, timestamp, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { orderItems } from './order_item';
import { users } from './users';

// export const returnRequests = pgTable('return_requests', {
//   id: uuid('id').defaultRandom().primaryKey(),
//   orderItemId: uuid('order_item_id').notNull(),
//   customerId: uuid('customer_id').notNull(),
//   reason: text('reason').notNull(),
//   description: text('description'),
//   status: varchar('status').default('pending').notNull(),
//   merchantReviewedAt: timestamp('merchant_reviewed_at'),
//   merchantNotes: text('merchant_notes'),
//   adminEscalatedAt: timestamp('admin_escalated_at'),
//   adminReviewedAt: timestamp('admin_reviewed_at'),
//   adminNotes: text('admin_notes'),
//   refundedAt: timestamp('refunded_at'),
//   refundReference: varchar('refund_reference'),
//   createdAt: timestamp('created_at').defaultNow(),
//   updatedAt: timestamp('updated_at').defaultNow(),
// });


export const returnRequests = pgTable('return_requests', {
  id: uuid('id').primaryKey().defaultRandom(), // matches uuid_generate_v4()

  // This MUST be UUID string, because your Go model uses string (not integer)
  orderItemId: integer('order_item_id').notNull().references(() => orderItems.id),

  // CustomerID is uint → maps to integer() in Postgres
  customerId: integer('customer_id').notNull().references(() => users.id),

  reason: text('reason').notNull(),
  description: text('description'), // optional — you had it in service

  status: varchar('status', { length: 255 }).default('Pending').notNull(),

  // Optional but recommended for refunds
  refundedAt: timestamp('refunded_at'),
  refundReference: varchar('refund_reference', { length: 255 }),

  createdAt: timestamp('created_at').defaultNow(). $onUpdate(() => new Date()),
  updatedAt: timestamp('updated_at').defaultNow(). $onUpdate(() => new Date()),
});

export const returnRequestRelations = relations(returnRequests, ({ one }) => ({
  orderItem: one(orderItems, {
    fields: [returnRequests.orderItemId],
    references: [orderItems.id],
  }),
  customer: one(users, {
    fields: [returnRequests.customerId],
    references: [users.id],
  }),
}));