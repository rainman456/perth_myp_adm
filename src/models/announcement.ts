// Announcement schema
import { pgTable, varchar, text, timestamp } from 'drizzle-orm/pg-core';

export const announcements = pgTable('announcements', {
  id: varchar('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
