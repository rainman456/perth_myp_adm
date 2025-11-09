import { pgTable, uuid, varchar, timestamp, text, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { products } from "./products";
import { users } from "./users";




export const reviews = pgTable("reviews", {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id").notNull(),
    userId: uuid("user_id").notNull(),
    rating: integer("rating").notNull(), // 1-5
    comment: text("comment"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  });
  

  export const reviewRelations = relations(reviews, ({ one }) => ({
    product: one(products, {
      fields: [reviews.productId],
      references: [products.id],
    }),
    user: one(users, {
      fields: [reviews.userId],
      references: [users.id],
    }),
  }));