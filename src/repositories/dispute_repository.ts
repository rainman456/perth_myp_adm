// Dispute queries using Drizzle
import { db } from '../config/database';
import { disputes } from '../models/dispute';
import { eq } from 'drizzle-orm';

// Get all disputes
export const getAllDisputes = async () => {
  return db.select().from(disputes);
};

// Get dispute by ID
export const getDisputeById = async (id: string) => {
  return db.select().from(disputes).where(eq(disputes.id, id)).limit(1);
};

// Create dispute
export const createDispute = async (data: any) => {
  return db.insert(disputes).values(data).returning();
};

// Update dispute
export const updateDispute = async (id: string, data: any) => {
  return db.update(disputes).set(data).where(eq(disputes.id, id)).returning();
};
