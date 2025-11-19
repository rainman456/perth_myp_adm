// schemas/settings.ts
import { pgTable, text, decimal, jsonb, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

/**
 * Settings table — global marketplace configuration (singleton row with id = 'global')
 */
export const settings = pgTable(
  'settings',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => 'global'),

    fees: decimal('fees', { precision: 10, scale: 2 })
      .notNull()
      .default(sql`'5.00'::decimal`),

    taxRate: decimal('tax_rate', { precision: 10, scale: 2 })
      .notNull()
      .default(sql`'0.00'::decimal`),

    shippingOptions: jsonb('shipping_options')
      .notNull()
      .$type<ShippingOption[]>(), // typed as array of ShippingOption (see below)

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => sql`now()`),

    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => ({
    // Optional: ensure only one row exists (singleton pattern)
    globalSingletonIdx: uniqueIndex('settings_global_singleton_idx').on(table.id),
  }),
);

/**
 * Type for a single shipping option — exactly matches the Go struct
 */
export type ShippingOption = {
  name: string;
  description: string;
  price: number;
  enabled: boolean;
};

/**
 * TypeScript types inferred from the table
 */
export type Settings = typeof settings.$inferSelect;
export type NewSettings = typeof settings.$inferInsert;