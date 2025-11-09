import { pgTable, uuid, varchar, timestamp, serial, integer, text } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { carts } from "./cart";
import { orders } from "./order";
import { userWishlists } from "./userWishlists";
import { reviews } from "./reviews";

export const users = pgTable("users", {
  id: serial('id').primaryKey(),  // Auto-increment integer to match GORM's uint ID
  email: varchar("email", { length: 255 }).unique().notNull(),  // Assume reasonable length for email
  name: varchar("name", { length: 100 }).notNull(),
  password: varchar("password", { length: 255 }),  // Optional for OAuth; length for security
  googleId: varchar("google_id", { length: 255 }),  // For OAuth
  country: varchar("country", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  // deletedAt: timestamp("deleted_at"),  // Add if using soft deletes (GORM.Model supports it)
});

export const userAddresses = pgTable("user_addresses", {  // Table name plural/snake_case convention
  id: serial('id').primaryKey(),  // Auto-increment integer
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),  // FK to users.id, not null, index implied
  phoneNumber: varchar("phone_number", { length: 20 }),
  additionalPhoneNumber: varchar("additional_phone_number", { length: 20 }),
  deliveryAddress: text("delivery_address"),
  shippingAddress: text("shipping_address"),
  state: varchar("state", { length: 100 }),
  lga: varchar("lga", { length: 100 }),  // Assuming LGA = Local Government Area
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  // deletedAt: timestamp("deleted_at"),  // For soft deletes
});

export const userRelations = relations(users, ({ many }) => ({
  addresses: many(userAddresses),  // Users has many UserAddresses
  carts: many(carts),  // Existing, assuming carts table defined elsewhere
  orders: many(orders),  // Existing
  wishlists: many(userWishlists),  // Assuming user_wishlists table; define if needed
  reviews: many(reviews),  // Assuming reviews table
}));

export const userAddressRelations = relations(userAddresses, ({ one }) => ({
  user: one(users, {
    fields: [userAddresses.userId],
    references: [users.id],
  }),
}));