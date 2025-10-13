// Merchant queries using Drizzle
/*
import { db } from "../config/database";
import { merchant_application, merchants } from "../models/merchant";
//import { users } from "../models/users";
import { eq } from "drizzle-orm";
import { adminLogs } from "../models/admins";

export const getAllApplications = async () => db.query.merchantApplications.findMany();

// Get pending applications
export const getPendingApplications = async () => db.query.merchantApplications.findMany({
  where: (merchantApplications, { eq }) => eq(merchantApplications.status, 'pending'),
});

// Get application by ID
export const getApplicationById = async (id: string) => db.query.merchantApplications.findFirst({
  where: (merchantApplications, { eq }) => eq(merchantApplications.id, id),
});

// Update application
export const updateApplication = async (id: string, data: any) => db.update(merchant_application)
  .set(data)
  .where(eq(merchantApplications.id, id))
  .returning();

// Create merchant
export const createMerchant = async (data: any) => db.insert(merchants).values(data).returning();

// Create admin log
export const createAdminLog = async (data: any) => db.insert(adminLogs).values(data).returning();


// Get all applications
export const getAllApplications = async () => {
  return db.select().from(merchantApplications);
};

// Get pending applications
export const getPendingApplications = async () => {
  return db
    .select()
    .from(merchantApplications)
    .where(eq(merchantApplications.status, "pending"));
};

// Get application by ID
export const getApplicationById = async (id: string) => {
  return db
    .select()
    .from(merchantApplications)
    .where(eq(merchantApplications.id, id))
    .limit(1);
};

// Update application
export const updateApplication = async (id: string, data: any) => {
  return db
    .update(merchantApplications)
    .set(data)
    .where(eq(merchantApplications.id, id))
    .returning();
};

// Create user
export const createUser = async (data: any) => {
  return db.insert(users).values(data).returning();
};

// Create merchant
export const createMerchant = async (data: any) => {
  return db.insert(merchants).values(data).returning();
};

// Get all merchants
export const getAllMerchants = async () => {
  return db.select().from(merchants);
};

// Update merchant
export const updateMerchant = async (id: string, data: any) => {
  return db.update(merchants).set(data).where(eq(merchants.id, id)).returning();
};

// Create admin log
export const createAdminLog = async (data: any) => {
  return db.insert(adminLogs).values(data).returning();
};
*/

// Merchant queries using Drizzle
/*
import { db } from "../config/database";
import { merchants } from "../models/merchant";  // Updated imports (singular app)
import { eq, and } from "drizzle-orm";
import { adminLogs } from "../models/admins";
import bcrypt from "bcrypt";  // For hashing
import { merchantApplication } from "../models/merchant_applications";

// Raw queries for existing merchant_application (no migration needed)
export const getAllApplications = async () => {
  return await db.select().from(merchantApplication);
};

export const getPendingApplications = async () => {
  return await db
    .select()
    .from(merchantApplication)
    .where(eq(merchantApplication.status, "pending"));
};

export const getApplicationById = async (id: string) => {
  return await db
    .select()
    .from(merchantApplication)
    .where(eq(merchantApplication.id, id))
    .limit(1);
};

export const updateApplication = async (id: string, data: any) => {
  // Manually set updated_at if needed (GORM auto, but Drizzle doesn't)
  data.updatedAt = new Date();
  return await db
    .update(merchantApplication)
    .set(data)
    .where(eq(merchantApplication.id, id))
    .returning();
};

// For new merchants table (migrated)
export const createMerchant = async (data: any) => {
  // Hash password before insert
  if (data.password) {
    data.password = await bcrypt.hash(data.password, 10);
  }
  data.updatedAt = new Date();  // Manual
  return await db.insert(merchants).values(data).returning();
};

export const getAllMerchants = async () => {
  return await db.select().from(merchants);
};

export const updateMerchant = async (id: string, data: any) => {
  data.updatedAt = new Date();  // Manual
  return await db
    .update(merchants)
    .set(data)
    .where(eq(merchants.id, id))
    .returning();
};

// Admin logs (assumes admins model migrated separately)
export const createAdminLog = async (data: any) => {
  data.timestamp = new Date();
  return await db.insert(adminLogs).values(data).returning();
};
*/

































import { db } from "../config/database";
import { merchants } from "../models/merchant";
import { merchantApplication } from "../models/merchant_applications";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { InferInsertModel } from "drizzle-orm"; // For $inferInsert

// Stub for adminLogs (matches models/admins.ts)
import { pgTable, uuid, varchar, jsonb, timestamp } from "drizzle-orm/pg-core";
export const adminLogs = pgTable("admin_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  adminId: uuid("admin_id").notNull(),
  action: varchar("action", { length: 50 }).notNull(),
  targetType: varchar("target_type", { length: 20 }).notNull(),
  targetId: uuid("target_id").notNull(),
  details: jsonb("details"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Type-safe schemas using $inferInsert
export type MerchantInsert = InferInsertModel<typeof merchants>;
export type MerchantApplicationUpdate = Partial<{
  status: "pending" | "approved" | "rejected" | "more_info";
  reviewedAt: Date;
  reviewedBy: string;
  rejectionReason: string;
}>;
export type MerchantUpdate = Partial<{
  status: "active" | "suspended";
  commissionTier: string;
  commissionRate: string;
}>;
export type AdminLogInsert = InferInsertModel<typeof adminLogs>;

// Raw queries for merchant_application
export const getAllApplications = async () => {
  return await db.select().from(merchantApplication);
};

export const getPendingApplications = async () => {
  return await db
    .select()
    .from(merchantApplication)
    .where(eq(merchantApplication.status, "pending"));
};

export const getApplicationById = async (id: string) => {
  return await db
    .select()
    .from(merchantApplication)
    .where(eq(merchantApplication.id, id))
    .limit(1);
};

export const updateApplication = async (id: string, data: MerchantApplicationUpdate) => {
  const updateData = { ...data, updatedAt: new Date() };
  return await db
    .update(merchantApplication)
    .set(updateData)
    .where(eq(merchantApplication.id, id))
    .returning();
};

// For merchants
export const createMerchant = async (data: MerchantInsert) => {
  const insertData = { ...data };
  if (insertData.password) {
    insertData.password = await bcrypt.hash(insertData.password, 10);
  }
  return await db.insert(merchants).values(insertData).returning();
};

export const getAllMerchants = async () => {
  return await db.select().from(merchants);
};

export const updateMerchant = async (id: string, data: MerchantUpdate) => {
  const updateData = { ...data, updatedAt: new Date() };
  return await db
    .update(merchants)
    .set(updateData)
    .where(eq(merchants.id, id))
    .returning();
};

export const createAdminLog = async (data: AdminLogInsert) => {
  // Remove timestamp; schema's defaultNow() handles it
  const { timestamp, ...insertData } = data; // Destructure to exclude timestamp
  return await db.insert(adminLogs).values(insertData).returning();
};