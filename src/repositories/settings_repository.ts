// Settings queries using Drizzle
import { db } from '../config/database';
import { settings } from '../models/settings';
import { eq } from 'drizzle-orm';

// Get settings
export const getGlobalSettings = async () => {
  return db.select().from(settings).where(eq(settings.id, 'global')).limit(1);
};

// Update settings
export const updateGlobalSettings = async (data: any) => {
  return db.update(settings).set(data).where(eq(settings.id, 'global')).returning();
};
