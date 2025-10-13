// Global settings schema
import { pgTable, text, decimal, jsonb } from 'drizzle-orm/pg-core';

export const settings = pgTable('settings', {
  id: text('id').primaryKey().default('global'),
  fees: decimal('fees').notNull().default('5.00'),
  taxRate: decimal('tax_rate').notNull().default('0.00'),
  shippingOptions: jsonb('shipping_options').notNull(),
});
