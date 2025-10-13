import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { carts } from "./cart";
import { orders } from "./order";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email").unique().notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  password: varchar("password"),
  googleId: varchar("google_id"),
  country: varchar("country", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userRelations = relations(users, ({ many }) => ({
  carts: many(carts),
  orders: many(orders),
}));
