// Category schema
// import { pgTable, text, varchar, timestamp } from 'drizzle-orm/pg-core';

// export const categories = pgTable('categories', {
//   id: varchar('id').primaryKey(),
//   name: text('name').notNull(),
//   parentId: varchar('parent_id'),
//   createdAt: timestamp('created_at').defaultNow(),
// });
import { pgTable, varchar, text, timestamp, jsonb, serial, bigint } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),  // Auto-increment INT; use bigint('id', { mode: 'number' }).primaryKey().$defaultSeq() for BIGINT
  name: text('name').notNull(),
  parentId: bigint('parent_id', { mode: 'number' }),  // Nullable integer; matches GORM's *uint
  attributes: jsonb('attributes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),  // Ensure notNull if GORM enforces it
});
// Add relations for hierarchy
export const categoryRelations = relations(categories, ({ one }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
  }),
}));