import {
  pgTable,
  varchar,
  text,
  timestamp,
  decimal,
  jsonb,
   uuid,
} from "drizzle-orm/pg-core";


export const admins = pgTable("admins", {
  //id: varchar("id").primaryKey(),
  id: uuid("id").defaultRandom().primaryKey(),
  username: text("username").notNull(),
  password: text("password").notNull(),
  role: text("role").notNull().default("admin"),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt:timestamp("created_at").defaultNow()
});

export const adminLogs = pgTable("admin_logs", {
  id: varchar("id").primaryKey(),
  adminId: varchar("admin_id").notNull(),
  action: text("action").notNull(),
  targetType: text("target_type").notNull(),
  targetId: varchar("target_id").notNull(),
  details: jsonb("details"),
  timestamp: timestamp("timestamp").defaultNow(),
});
