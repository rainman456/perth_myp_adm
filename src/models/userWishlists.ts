
import { pgTable, uuid, varchar, timestamp, text, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { products } from "./products";


export const userWishlists = pgTable("user_wishlists", {
    userId: uuid("user_id").notNull().primaryKey(),
    productId: uuid("product_id").notNull().primaryKey(),
    addedAt: timestamp("added_at").defaultNow(),
  });


  export const userWishlistRelations = relations(userWishlists, ({ one }) => ({
    user: one(users, {
      fields: [userWishlists.userId],
      references: [users.id],
    }),
    product: one(products, {
      fields: [userWishlists.productId],
      references: [products.id],
    }),
  }));