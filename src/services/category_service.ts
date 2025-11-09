// Category logic
/*
import * as repo from '../repositories/category_repository';
import { createAdminLog } from '../repositories/merchant_repository';

// Get all categories
export const getAllCategories = async () => repo.getAllCategories();

// Create category
export const createCategory = async (data: any, adminId?: string) => {
  const category = await repo.createCategory(data);
  if (adminId) await createAdminLog({ adminId, action: 'CREATE_CATEGORY', targetType: 'category', targetId: category[0].id });
  return category;
};

// Update category
export const updateCategory = async (id: string, data: any, adminId?: string) => {
  const category = await repo.updateCategory(id, data);
  if (adminId) await createAdminLog({ adminId, action: 'UPDATE_CATEGORY', targetType: 'category', targetId: id });
  return category;
};

// Delete category
export const deleteCategory = async (id: string, adminId?: string) => {
  await repo.deleteCategory(id);
  if (adminId) await createAdminLog({ adminId, action: 'DELETE_CATEGORY', targetType: 'category', targetId: id });
};




















import { drizzle } from 'drizzle-orm/neon-serverless'; // Adjust import if using different connector
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';
import { categories, categoryRelations } from '../models/category';
import { db } from '../config/database'; // Assuming centralized DB export
import { CategoryRepository } from '../repositories/category_repository';
const repo = new CategoryRepository();

// Validation schemas
const categorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  parentId: z.string().optional(),
  attributes: z.record(z.any()).optional(), // JSONB: e.g., { color: ['red', 'blue'] }
});

const updateCategorySchema = categorySchema.partial();

// Interface for Category (inferred from schema, but explicit for clarity)
interface Category {
  id: string;
  name: string;
  parentId?: string | null;
  attributes?: Record<string, any> | null;
  createdAt: Date;
}

// Recursive type for tree
interface CategoryTree extends Category {
  children?: CategoryTree[];
}

export class CategoryService {
  async createCategory(data: unknown): Promise<Category> {
  const validated = categorySchema.parse(data);
  if (validated.parentId) {
    await this.checkCycle(validated.parentId, validated.parentId);
  }
  validated.id = crypto.randomUUID(); // Or handle in repo
  return repo.create(validated);
}

  async getCategoryById(id: string): Promise<Category | null> {
  return repo.findById(id);
}
  async getAllCategories(): Promise<Category[]> {
    return db.select().from(categories).orderBy(desc(categories.createdAt));
  }

  async getCategoryTree(): Promise<CategoryTree[]> {
    const allCats = await repo.findAll();
    const catMap = new Map<string, CategoryTree>(allCats.map(cat => [cat.id, { ...cat, children: [] }]));
    
    // Build tree
    const roots: CategoryTree[] = [];
    allCats.forEach(cat => {
      if (cat.parentId && catMap.has(cat.parentId)) {
        catMap.get(cat.parentId)!.children!.push(catMap.get(cat.id)!);
      } else {
        roots.push(catMap.get(cat.id)!);
      }
    });
    return roots;
  }

 async updateCategory(id: string, data: unknown): Promise<Category | null> {
  const validated = updateCategorySchema.parse(data);
  if (validated.parentId) {
    await this.checkCycle(id, validated.parentId);
  }
  return repo.update(id, validated);
}

async deleteCategory(id: string): Promise<void> {
  const children = await repo.findChildren(id);
  if (children.length > 0) {
    throw new Error('Cannot delete category with children');
  }
  await repo.delete(id);
}

private async checkCycle(startId: string, newParentId: string): Promise<void> {
  let current = newParentId;
  while (current) {
    if (current === startId) {
      throw new Error('Category hierarchy cycle detected');
    }
    const parentPath = await repo.findParentPath(current); // Use repo helper
    if (parentPath.includes(startId)) {
      throw new Error('Category hierarchy cycle detected');
    }
    const cat = await repo.findById(current);
    current = cat?.parentId || '';
  }
}

async addAttribute(id: string, key: string, value: any): Promise<Category | null> {
  const cat = await repo.findById(id);
  if (!cat) throw new Error('Category not found');
  const attributes = { ...(cat.attributes || {}), [key]: value };
  return repo.update(id, { attributes });
}
}

*/



import { z } from 'zod';
import { CategoryRepository } from '../repositories/category_repository';
import { categories } from '../models/category';

// Validation schemas
const categorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  parentId: z.number().nullable().optional(),  // Integer, nullable
  attributes: z.record(z.any()).nullable().optional(),
});

const updateCategorySchema = categorySchema.partial();

// Interface for Category (aligned with Drizzle schema)
interface Category {
  id: number;
  name: string;
  parentId: number | null;
  attributes: Record<string, any> | null;
  createdAt: Date | null;
}

// Recursive type for tree
interface CategoryTree extends Category {
  children?: CategoryTree[];
}

export class CategoryService {
  private repo: CategoryRepository;

  constructor() {
    this.repo = new CategoryRepository();
  }

  async createCategory(data: unknown): Promise<Category> {
    const validated = categorySchema.parse(data);
    const insertData = {
      name: validated.name,
      parentId: validated.parentId ?? null,
      attributes: validated.attributes ?? null,
    };
    const created = await this.repo.create(insertData);
    return this.mapToCategory(created);
  }

  async getCategoryById(id: string): Promise<Category | null> {
    const numId = Number(id);
    if (isNaN(numId)) {
      return null; // Or throw Error('Invalid ID')
    }
    const cat = await this.repo.findById(numId);
    return cat ? this.mapToCategory(cat) : null;
  }

  async getAllCategories(): Promise<Category[]> {
    const cats = await this.repo.findAll();
    return cats.map(this.mapToCategory.bind(this));
  }

  async getCategoryTree(): Promise<CategoryTree[]> {
    const allCats = await this.getAllCategories();
    const catMap = new Map<number, CategoryTree>(
      allCats.map(cat => [cat.id, { ...cat, children: [] }])
    );
    
    // Build tree
    const roots: CategoryTree[] = [];
    allCats.forEach(cat => {
      if (cat.parentId && catMap.has(cat.parentId)) {
        catMap.get(cat.parentId)!.children!.push(catMap.get(cat.id)!);
      } else {
        roots.push(catMap.get(cat.id)!);
      }
    });
    return roots;
  }

  async updateCategory(id: string, data: unknown): Promise<Category | null> {
    const numId = Number(id);
    if (isNaN(numId)) {
      return null; // Or throw Error('Invalid ID')
    }
    const validated = updateCategorySchema.parse(data);
    if (validated.parentId !== undefined && validated.parentId !== null) {
      await this.checkCycle(numId, validated.parentId);
    }
    const updated = await this.repo.update(numId, validated);
    return updated ? this.mapToCategory(updated) : null;
  }

  async deleteCategory(id: string): Promise<void> {
    const numId = Number(id);
    if (isNaN(numId)) {
      throw new Error('Invalid ID');
    }
    const children = await this.repo.findChildren(numId);
    if (children.length > 0) {
      throw new Error('Cannot delete category with children');
    }
    await this.repo.delete(numId);
  }

  private async checkCycle(startId: number, newParentId: number): Promise<void> {
    if (newParentId === startId) {
      throw new Error('Cannot set category as its own parent');
    }
    const path = await this.repo.findParentPath(newParentId);
    if (path.includes(startId)) {
      throw new Error('Category hierarchy cycle detected');
    }
  }

  async addAttribute(id: string, key: string, value: any): Promise<Category | null> {
    const numId = Number(id);
    if (isNaN(numId)) {
      return null; // Or throw Error('Invalid ID')
    }
    const cat = await this.repo.findById(numId);
    if (!cat) throw new Error('Category not found');
    const attributes = { ...(cat.attributes || {}), [key]: value };
    const updated = await this.repo.update(numId, { attributes });
    return updated ? this.mapToCategory(updated) : null;
  }

  // Helper to map Drizzle types to Category interface
  private mapToCategory(cat: typeof categories.$inferSelect): Category {
    // Ensure attributes is Record<string, any> | null
    const attributes = cat.attributes === null || cat.attributes === undefined
      ? null
      : (typeof cat.attributes === 'object' ? cat.attributes : {}) as Record<string, any>;

    return {
      id: cat.id,
      name: cat.name,
      parentId: cat.parentId,
      attributes,
      createdAt: cat.createdAt,
    };
  }
}