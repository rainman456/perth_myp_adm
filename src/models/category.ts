import { pgTable, varchar, text, timestamp, jsonb, serial, bigint, index, integer } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

export const categories = pgTable('categories', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  name: varchar('name', { length: 255 }).notNull(),
  parentId: integer('parent_id'),
  categorySlug: varchar('category_slug', { length: 255 }),
  attributes: jsonb('attributes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  slugIdx: index('idx_category_slug').on(table.categorySlug),
  parentIdFk: index('idx_category_parent_id').on(table.parentId),
}));

export function getSlug(name: string): string {
  if (!name) return '';
  let slug = name.trim().toLowerCase();
  slug = slug.replace(/[^a-z0-9]+/g, '-');
  slug = slug.replace(/-+/g, '-').replace(/^-|-$/g, '');
  return slug;
}

export const categoryRelations = relations(categories, ({ one }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
  }),
}));