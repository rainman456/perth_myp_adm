// Category queries using Drizzle
/*
import { db } from "../config/database";
import { categories } from "../models/category";
import { eq } from "drizzle-orm";
interface CategoryData {
  id: string;
  name: string;
  parentId?: string;
}

// Get all categories
export const getAllCategories = async () => {
  return db.select().from(categories);
};

// Create category
interface CategoryData {
  id: string;
  name: string;
  parentId?: string;
}
export const createCategory = async (data: CategoryData) => {
  return db.insert(categories).values(data).returning();
};

// Update category
export const updateCategory = async (id: string, data: any) => {
  return db
    .update(categories)
    .set(data)
    .where(eq(categories.id, id))
    .returning();
};

// Delete category
export const deleteCategory = async (id: string) => {
  return db.delete(categories).where(eq(categories.id, id));
};
*/
// src/repositories/category_repository.ts
import { drizzle } from 'drizzle-orm/neon-serverless'; // Adjust if needed
import { eq, desc,isNull } from 'drizzle-orm';
import { categories } from '../models/category';
import { db } from '../config/database'; // Centralized DB

export class CategoryRepository {
  async create(data: Omit<typeof categories.$inferInsert, 'createdAt'>): Promise<typeof categories.$inferSelect> {
    const [newCat] = await db.insert(categories).values({ ...data, createdAt: new Date() }).returning();
    return newCat;
  }

  async findById(id: number): Promise<typeof categories.$inferSelect | null> {
    const [cat] = await db.select().from(categories).where(eq(categories.id, id));
    return cat || null;
  }

  async findAll(): Promise<(typeof categories.$inferSelect)[]> {
    return db.select().from(categories).orderBy(desc(categories.createdAt));
  }

  async findChildren(parentId: number | null): Promise<(typeof categories.$inferSelect)[]> {
    if (parentId === null) {
      return db.select().from(categories).where(isNull(categories.parentId));
    }
    return db.select().from(categories).where(eq(categories.parentId, parentId));
  }
  async findParentPath(id: number): Promise<number[]> {
    const path: number[] = [];
    let current: number | null = id;
    while (current !== null) {
      const [cat] = await db
        .select({ parentId: categories.parentId })
        .from(categories)
        .where(eq(categories.id, current));
      if (!cat) break;
      path.push(current);  // Push the current ID (child to root)
      current = cat.parentId ?? null;  // Handle null properly; no string coercion
    }
    return path;
  }

  async update(id: number, data: Partial<typeof categories.$inferInsert>): Promise<typeof categories.$inferSelect | null> {
    const [updated] = await db.update(categories).set(data).where(eq(categories.id, id)).returning();
    return updated || null;
  }

  async delete(id: number): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }
}