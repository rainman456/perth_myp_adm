import { db } from "../config/database";
import { merchants } from "../models/merchant";  // Updated imports (singular app)
import { eq, and, InferInsertModel } from "drizzle-orm";
import { adminLogs } from "../models/admins";
import bcrypt from "bcrypt";  // For hashing
import { merchantApplication } from "../models/merchant_applications";
// Stub for adminLogs (matches models/admins.ts)
import { pgTable, uuid, varchar, jsonb, timestamp } from "drizzle-orm/pg-core";


// Type-safe schemas using $inferInsert
export type MerchantInsert = InferInsertModel<typeof merchants>;
export type MerchantCreate = Omit<MerchantInsert, 'id' | 'createdAt' | 'updatedAt'> & {
  // Ensure required fields are present for creation
  name: string;
  applicationId: string;
  merchantId: string;
  storeName: string;
  personalEmail: string;
  workEmail: string;
  businessRegistrationNumber: string;
  password: string;
};
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
export const createMerchant = async (data: MerchantCreate) => {
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
  // Let the database handle default values for id and timestamp
  const { id, timestamp, ...insertData } = data as any;
  return await db.insert(adminLogs).values(insertData).returning();
};