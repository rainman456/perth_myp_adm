// Category schema
// import { pgTable, text, varchar, timestamp } from 'drizzle-orm/pg-core';

// export const categories = pgTable('categories', {
//   id: varchar('id').primaryKey(),
//   name: text('name').notNull(),
//   parentId: varchar('parent_id'),
//   createdAt: timestamp('created_at').defaultNow(),
// });
import { pgTable, varchar, text, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const categories = pgTable('categories', {
  id: varchar('id').primaryKey(),
  name: text('name').notNull(),
  parentId: varchar('parent_id'),
  attributes: jsonb('attributes'),  // Align with Go's map[string]any
  createdAt: timestamp('created_at').defaultNow(),
});

// Add relations for hierarchy
export const categoryRelations = relations(categories, ({ one }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
  }),
}));